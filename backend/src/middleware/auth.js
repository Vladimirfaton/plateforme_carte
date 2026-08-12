import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Auth attempt without token');
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.debug(`Auth success for user: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email}`);
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    next();
  };
};
