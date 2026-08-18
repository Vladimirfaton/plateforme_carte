import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { College } from '../models/College.js';
import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import { sendCartesReadyEmail } from '../utils/email.js';
import logger from '../config/logger.js';

const saveNotification = async ({ college_id, classe_id, sent_by, emails_sent, date_passage }) => {
  const id = uuidv4();
  await query(
    `INSERT INTO notifications_cartes (id, college_id, classe_id, sent_by, sent_at, emails_sent, date_passage)
     VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
    [id, college_id, classe_id || null, sent_by, emails_sent, date_passage]
  );
};

// POST /api/colleges/:id/notifier-cartes
// Body : { classe_id? , date_passage } — date_passage obligatoire (ISO string)
export const notifierCartes = async (req, res) => {
  try {
    const { id: collegeId } = req.params;
    const { classe_id, date_passage } = req.body;

    if (!date_passage) {
      return res.status(400).json({ error: 'Date de passage requise' });
    }

    const college = await College.findById(collegeId);
    if (!college) return res.status(404).json({ error: 'Collège non trouvé' });

    let classeCode = null;
    if (classe_id) {
      const cls = await Class.findById(classe_id);
      if (!cls || cls.college_id !== collegeId) {
        return res.status(404).json({ error: 'Classe non trouvée dans ce collège' });
      }
      classeCode = cls.code;
    }

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
          await sendCartesReadyEmail(account.email, {
            role: account.role,
            collegeName: college.nom,
            classeCode,
            datePassage: date_passage,
            loginUrl,
          });
          logger.info(`Cartes notification sent to ${account.email} (${account.role})`);
          return { email: account.email, role: account.role, sent: true };
        } catch (err) {
          logger.error(`Cartes notification failed for ${account.email}: ${err.message}`);
          return { email: account.email, role: account.role, sent: false, error: err.message };
        }
      })
    );

    const sentCount = results.filter(r => r.sent).length;

    await saveNotification({
      college_id: collegeId,
      classe_id: classe_id || null,
      sent_by: req.user.id,
      emails_sent: sentCount,
      date_passage,
    });

    res.json({
      sent: sentCount,
      failed: results.filter(r => !r.sent),
      classeCode,
      collegeName: college.nom,
      datePassage: date_passage,
    });
  } catch (error) {
    logger.error(`notifierCartes error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
  }
};

// GET /api/colleges/:id/notifications-cartes
export const getNotificationsCartes = async (req, res) => {
  try {
    const { id: collegeId } = req.params;
    const result = await query(
      `SELECT nc.*, 
              cl.code AS classe_code,
              u.email AS sent_by_email
       FROM notifications_cartes nc
       LEFT JOIN classes cl ON cl.id = nc.classe_id
       LEFT JOIN users u ON u.id = nc.sent_by
       WHERE nc.college_id = $1
       ORDER BY nc.sent_at DESC
       LIMIT 50`,
      [collegeId]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error(`getNotificationsCartes error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};