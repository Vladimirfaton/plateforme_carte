import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import { User } from '../models/User.js';

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

// Bloque l'accès si le compte directeur/secrétaire est expiré (clé d'accès dépassée).
// L'admin n'est jamais concerné. Statut lu en base (mis à jour par le cron d'expiration).
export const checkAccountActive = async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  try {
    const user = await User.findById(req.user.id);
    if (!user || user.status !== 'active') {
      logger.warn(`Blocked access for expired/inactive account: ${req.user.email}`);
      return res.status(403).json({
        error: "Accès expiré. Veuillez renouveler votre clé d'accès.",
        code: 'ACCESS_EXPIRED',
      });
    }
    next();
  } catch (error) {
    logger.error(`checkAccountActive error: ${error.message}`);
    return res.status(500).json({ error: 'Erreur de vérification du compte' });
  }
};

// Restreint un directeur/secrétaire à son propre collège.
// getCollegeId(req) doit retourner l'id de collège visé par la requête
// (ex: req.params.collegeId, ou résolu depuis classeId/eleveId dans le controller).
export const scopeToOwnCollege = (getCollegeId) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();

    const requestedCollegeId = getCollegeId(req);
    if (requestedCollegeId && requestedCollegeId !== req.user.college_id) {
      logger.warn(`College scope violation by ${req.user.email}`);
      return res.status(403).json({ error: 'Accès non autorisé à ce collège' });
    }
    next();
  };
};