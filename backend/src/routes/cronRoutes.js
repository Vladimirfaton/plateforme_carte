import express from 'express';
import { AccessKey } from '../models/AccessKey.js';
import { College } from '../models/College.js';
import { sendExpirationEmail } from '../utils/email.js';
import { generateReactivationToken } from '../utils/reactivationToken.js';
import logger from '../config/logger.js';

const router = express.Router();

const verifyCronSecret = (req, res, next) => {
  const provided = req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
};

router.post('/expire-keys', verifyCronSecret, async (req, res) => {
  try {
    const collegeIds = await AccessKey.expireOutdatedKeys();
    logger.info(`[cron externe] expireOutdatedKeys — ${collegeIds.length} collège(s) affecté(s)`);

    const emailResults = await Promise.allSettled(
      collegeIds.map(async (collegeId) => {
        const college = await College.findById(collegeId);
        if (!college) return;

        const directeurEmail = (college.directeur_contact || college.email || '').trim();
        if (!directeurEmail) {
          logger.warn(`[cron externe] Pas d'email directeur pour le collège ${collegeId}`);
          return;
        }

        const token = generateReactivationToken(collegeId);
        const reactivationUrl = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/reactivation-compte?token=${token}`;

        await sendExpirationEmail(directeurEmail, {
          collegeName: college.nom,
          directeurSexe: college.directeur_sexe,
          reactivationUrl,
        });
      })
    );

    const failed = emailResults.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      logger.error(`[cron externe] ${failed} email(s) d'expiration en échec`);
    }

    res.json({ expired: collegeIds.length });
  } catch (error) {
    logger.error(`[cron externe] expireOutdatedKeys — erreur: ${error.message}`);
    res.status(500).json({ error: "Erreur lors de l'expiration des clés" });
  }
});

export default router;