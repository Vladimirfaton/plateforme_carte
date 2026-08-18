import express from 'express';
import { AccessKey } from '../models/AccessKey.js';
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
    const count = await AccessKey.expireOutdatedKeys();
    logger.info(`[cron externe] expireOutdatedKeys — ${count} clé(s) expirée(s)`);
    res.json({ expired: count });
  } catch (error) {
    logger.error(`[cron externe] expireOutdatedKeys — erreur: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de l\'expiration des clés' });
  }
});

export default router;