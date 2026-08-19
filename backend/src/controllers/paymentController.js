import { kkiapay } from '@kkiapay-org/nodejs-sdk';
import { User } from '../models/User.js';
import { AccessKey } from '../models/AccessKey.js';
import { Payment } from '../models/Payment.js';
import { College } from '../models/College.js';
import { sendReactivationEmail } from '../utils/email.js';
import { verifyReactivationToken } from '../utils/reactivationToken.js';
import logger from '../config/logger.js';
const RENEWAL_PRICE_XOF = Number(process.env.RENEWAL_PRICE_XOF || 15000);

function getKkiapayClient() {
  return kkiapay({
    privatekey: process.env.KKIAPAY_PRIVATE_KEY,
    publickey: process.env.KKIAPAY_PUBLIC_KEY,
    secretkey: process.env.KKIAPAY_SECRET_KEY,
    sandbox: process.env.KKIAPAY_SANDBOX === 'true',
  });
}

// Coeur partagé (callback client + webhook). La clé étant partagée, on
// réactive TOUS les comptes gestion (directeur + secrétaire) du collège.
async function processTransaction(transactionId, collegeId) {
  const existing = await Payment.findByTransactionId(transactionId);
  if (existing) {
    return { alreadyProcessed: true, payment: existing };
  }

  const k = getKkiapayClient();
  const tx = await k.verify(transactionId);

  if (tx.status !== 'SUCCESS') {
    throw new Error('PAYMENT_NOT_SUCCESSFUL');
  }
  if (Number(tx.amount) < RENEWAL_PRICE_XOF) {
    throw new Error('AMOUNT_MISMATCH');
  }

  const pendingKey = await AccessKey.createPending(collegeId, 'paid');
  await AccessKey.activate(pendingKey.id, 'paid');
  const reactivatedUsers = await User.reactivateByCollege(collegeId);

  const payment = await Payment.create({
    collegeId,
    userId: null,
    transactionId,
    amount: tx.amount,
    status: 'success',
  });

  try {
    const college = await College.findById(collegeId);
    const loginUrl = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/gestion/login`;
    await Promise.all(
      reactivatedUsers.map((u) =>
        sendReactivationEmail(u.email, {
          collegeName: college?.nom || '',
          accessKey: pendingKey.plainKey,
          reactivationUrl: loginUrl,
        })
      )
    );
  } catch (mailErr) {
    logger.error(`Reactivation email failed: ${mailErr.message}`);
  }

  return { alreadyProcessed: false, payment, reactivatedUsers, plainKey: pendingKey.plainKey };
}

// Appelé par le frontend juste après le callback de succès du widget KKiaPay
export const confirmReactivationPayment = async (req, res) => {
  try {
    const { token, transactionId } = req.body;
    if (!token || !transactionId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    let collegeId;
    try {
      collegeId = verifyReactivationToken(token);
    } catch {
      return res.status(401).json({ error: 'Lien de renouvellement invalide ou expiré' });
    }

    const accounts = await User.findByCollege(collegeId);
    const hasExpired = accounts.some((u) => u.status === 'expired');
    if (!hasExpired) {
      return res.status(409).json({ error: "Aucun compte de ce collège n'est en attente de renouvellement" });
    }

    const result = await processTransaction(transactionId, collegeId);

    res.json({
      plainKey: result.alreadyProcessed ? null : result.plainKey,
      alreadyProcessed: !!result.alreadyProcessed,
    });
  } catch (error) {
    logger.error(`Reactivation payment error: ${error.message}`);
    if (error.message === 'PAYMENT_NOT_SUCCESSFUL') {
      return res.status(402).json({ error: 'Paiement non confirmé' });
    }
    if (error.message === 'AMOUNT_MISMATCH') {
      return res.status(402).json({ error: 'Montant du paiement insuffisant' });
    }
    res.status(500).json({ error: 'Erreur lors de la confirmation du paiement' });
  }
};

// Filet de sécurité — appelé directement par KKiaPay, indépendamment du client.
// Le collège est retrouvé via `partnerId`, transmis lors de l'ouverture du widget.
export const kkiapayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-kkiapay-secret'];
    if (!signature || signature !== process.env.KKIAPAY_WEBHOOK_SECRET) {
      logger.warn('Invalid KKiaPay webhook signature');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId manquant' });
    }

    const k = getKkiapayClient();
    const tx = await k.verify(transactionId);
    logger.info(`[DEBUG kkiapay] réponse verify: ${JSON.stringify(tx)}`);
    const collegeId = tx.partnerId;

    if (!collegeId) {
      logger.warn(`KKiaPay webhook: partnerId manquant pour la transaction ${transactionId}`);
      return res.status(200).json({ received: true, note: 'partnerId manquant' });
    }

    await processTransaction(transactionId, collegeId);
    res.json({ received: true });
  } catch (error) {
    logger.error(`KKiaPay webhook error: ${error.message}`);
    res.status(200).json({ received: true, note: error.message });
  }
};