import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

// Limite les tentatives de connexion — protège contre le bruteforce sur
// mot de passe (admin OTP) et username+mdp (gestion).
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes
  max: 10, // 10 tentatives max par IP sur la fenêtre
  standardHeaders: true, // renvoie les headers RateLimit-* standards
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit dépassé pour login: IP ${req.ip} sur ${req.path}`);
    res.status(429).json(options.message);
  },
});