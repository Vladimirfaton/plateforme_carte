import express from 'express';
import {
  createClass,
  getClassesByCollege,
  getClassById,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';
import {
  createObservation,
  listObservations,
  deleteObservation,
} from '../controllers/observationController.js';
import { authenticate, checkAccountActive, scopeToOwnCollege } from '../middleware/auth.js';
import { Class } from '../models/Class.js';

const router = express.Router();

// --- Routes classes (écriture admin) ---
router.post(
  '/:collegeId/classes',
  authenticate,
  checkAccountActive,
  scopeToOwnCollege((req) => req.params.collegeId),
  createClass
);

router.put(
  '/class/:classId',
  authenticate,
  checkAccountActive,
  async (req, res, next) => {
    if (req.user.role !== 'admin') {
      const cls = await Class.findById(req.params.classId).catch(() => null);
      if (!cls || cls.college_id !== req.user.college_id) {
        return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
      }
    }
    next();
  },
  updateClass
);

router.delete(
  '/class/:classId',
  authenticate,
  checkAccountActive,
  async (req, res, next) => {
    if (req.user.role !== 'admin') {
      const cls = await Class.findById(req.params.classId).catch(() => null);
      if (!cls || cls.college_id !== req.user.college_id) {
        return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
      }
    }
    next();
  },
  deleteClass
);

// --- Routes lecture (directeur + secrétaire + admin) ---
router.get(
  '/:collegeId/classes',
  authenticate,
  checkAccountActive,
  scopeToOwnCollege((req) => req.params.collegeId),
  getClassesByCollege
);

router.get(
  '/class/:classId',
  authenticate,
  checkAccountActive,
  async (req, res, next) => {
    if (req.user.role !== 'admin') {
      const cls = await Class.findById(req.params.classId).catch(() => null);
      if (!cls || cls.college_id !== req.user.college_id) {
        return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
      }
    }
    next();
  },
  getClassById
);

// --- Observations ---
router.post(
  '/class/:classId/observations',
  authenticate,
  checkAccountActive,
  createObservation
);

router.get(
  '/class/:classId/observations',
  authenticate,
  checkAccountActive,
  listObservations
);

router.delete(
  '/class/:classId/observations/:observationId',
  authenticate,
  checkAccountActive,
  deleteObservation
);

export default router;