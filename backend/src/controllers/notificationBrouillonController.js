import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { College } from '../models/College.js';
import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import { sendBrouillonReadyEmail } from '../utils/email.js';
import logger from '../config/logger.js';

// Enregistre la notification en DB
const saveNotification = async ({ college_id, classe_id, sent_by, emails_sent }) => {
  const id = uuidv4();
  await query(
    `INSERT INTO notifications_brouillon (id, college_id, classe_id, sent_by, sent_at, emails_sent)
     VALUES ($1, $2, $3, $4, NOW(), $5)`,
    [id, college_id, classe_id || null, sent_by, emails_sent]
  );
};

// POST /api/colleges/:id/notifier-brouillon
// Body optionnel : { classe_id } — si absent, notif pour tout le collège
export const notifierBrouillon = async (req, res) => {
  try {
    const { id: collegeId } = req.params;
    const { classe_id } = req.body;

    const college = await College.findById(collegeId);
    if (!college) return res.status(404).json({ error: 'Collège non trouvé' });

    // Résoudre le code de classe si fourni
    let classeCode = null;
    if (classe_id) {
      const cls = await Class.findById(classe_id);
      if (!cls || cls.college_id !== collegeId) {
        return res.status(404).json({ error: 'Classe non trouvée dans ce collège' });
      }
      classeCode = cls.code;
    }

    // Récupérer les comptes actifs du collège (directeur + secrétaire)
    const accounts = await User.findByCollege(collegeId);
    const actifs = accounts.filter(u => u.status === 'active');

    if (!actifs.length) {
      return res.status(400).json({
        error: 'Aucun compte de gestion actif pour ce collège',
        code: 'NO_ACTIVE_ACCOUNTS',
      });
    }

    const loginUrl = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/gestion/login`;
    const results = await Promise.all(
      actifs.map(async (account) => {
        try {
          await sendBrouillonReadyEmail(account.email, {
            role: account.role,
            collegeName: college.nom,
            classeCode,
            loginUrl,
          });
          logger.info(`Brouillon notification sent to ${account.email} (${account.role})`);
          return { email: account.email, role: account.role, sent: true };
        } catch (err) {
          logger.error(`Brouillon notification failed for ${account.email}: ${err.message}`);
          return { email: account.email, role: account.role, sent: false, error: err.message };
        }
      })
    );

    const sentCount = results.filter(r => r.sent).length;

    // Enregistrer en historique même si certains emails ont échoué
    await saveNotification({
      college_id: collegeId,
      classe_id: classe_id || null,
      sent_by: req.user.id,
      emails_sent: sentCount,
    });

    res.json({
      sent: sentCount,
      failed: results.filter(r => !r.sent),
      classeCode,
      collegeName: college.nom,
    });
  } catch (error) {
    logger.error(`notifierBrouillon error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
  }
};

// GET /api/colleges/:id/notifications-brouillon
// Historique des notifications pour un collège
export const getNotificationsBrouillon = async (req, res) => {
  try {
    const { id: collegeId } = req.params;
    const result = await query(
      `SELECT nb.*, 
              cl.code AS classe_code,
              u.email AS sent_by_email
       FROM notifications_brouillon nb
       LEFT JOIN classes cl ON cl.id = nb.classe_id
       LEFT JOIN users u ON u.id = nb.sent_by
       WHERE nb.college_id = $1
       ORDER BY nb.sent_at DESC
       LIMIT 50`,
      [collegeId]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error(`getNotificationsBrouillon error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};