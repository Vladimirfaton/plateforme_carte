import jwt from 'jsonwebtoken';
import { kkiapay } from '@kkiapay-org/nodejs-sdk';
import { User } from '../models/User.js';
import { AccessKey } from '../models/AccessKey.js';
import { Payment } from '../models/Payment.js';
import { College } from '../models/College.js';
import { sendReactivationEmail } from '../utils/email.js';
import { normalizeUsername } from '../utils/username.js';
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

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      college_id: user.college_id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

// Coeur partagé (client callback + webhook). expectedUser = null → on retrouve
// l'utilisateur via l'email renvoyé par KKiaPay (cas webhook).
async function processTransaction(transactionId, expectedUser) {
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

  const user = expectedUser || (await User.findByEmail(tx.client?.email));
  if (!user || !['directeur', 'secretaire'].includes(user.role)) {
    throw new Error('USER_NOT_FOUND');
  }

  const pendingKey = await AccessKey.createPending(user.college_id, 'paid');
  await AccessKey.activate(pendingKey.id, 'paid');
  const reactivatedUser = await User.reactivate(user.id);

  const payment = await Payment.create({
    collegeId: user.college_id,
    userId: user.id,
    transactionId,
    amount: tx.amount,
    status: 'success',
  });

  try {
    const college = await College.findById(user.college_id);
    const reactivationUrl = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/gestion/login`;
    await sendReactivationEmail(reactivatedUser.email, {
      collegeName: college?.nom || '',
      accessKey: pendingKey.plainKey,
      reactivationUrl,
    });
  } catch (mailErr) {
    logger.error(`Reactivation email failed: ${mailErr.message}`);
  }

  return { alreadyProcessed: false, payment, reactivatedUser, plainKey: pendingKey.plainKey };
}

// Appelé par le frontend juste après le callback de succès du widget KKiaPay
export const confirmReactivationPayment = async (req, res) => {
  try {
    const { username, password, transactionId } = req.body;
    if (!username || !password || !transactionId) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const user = await User.findByUsername(normalizeUsername(username));
    if (!user || !['directeur', 'secretaire'].includes(user.role)) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }
    if (user.status !== 'expired') {
      return res.status(409).json({ error: "Ce compte n'est pas en attente de renouvellement" });
    }
    const validPassword = await User.verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const result = await processTransaction(transactionId, user);

    if (result.alreadyProcessed) {
      // Le webhook est arrivé en premier — le compte est déjà réactivé, on redonne juste un token
      const freshUser = await User.findById(user.id);
      return res.json({ token: signToken(freshUser), user: freshUser, plainKey: null, alreadyProcessed: true });
    }

    res.json({
      token: signToken(result.reactivatedUser),
      user: result.reactivatedUser,
      plainKey: result.plainKey,
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

// Filet de sécurité — appelé directement par KKiaPay, indépendamment du client
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

    await processTransaction(transactionId, null);
    res.json({ received: true });
  } catch (error) {
    logger.error(`KKiaPay webhook error: ${error.message}`);
    // 200 quand même pour éviter les retries agressifs de KKiaPay sur des erreurs métier
    res.status(200).json({ received: true, note: error.message });
  }
};