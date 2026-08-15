import express from 'express';
import {
  createClass,
  getClassesByCollege,
  getClassById,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';
import { createObservation, listObservations } from '../controllers/observationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/:collegeId/classes', authenticate, createClass);
router.get('/:collegeId/classes', authenticate, getClassesByCollege);
router.get('/class/:classId', authenticate, getClassById);
router.put('/class/:classId', authenticate, updateClass);
router.delete('/class/:classId', authenticate, deleteClass);

// Observations (directeur / secretaire / admin)
router.post('/class/:classId/observations', authenticate, createObservation);
router.get('/class/:classId/observations', authenticate, listObservations);

export default router;
