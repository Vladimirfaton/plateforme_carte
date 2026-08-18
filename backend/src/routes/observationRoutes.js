import express from 'express';
import {
  getUnreadObservations,
  markObservationsAsRead,
} from '../controllers/observationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin uniquement
router.get('/non-lues', authenticate, authorize(['admin']), getUnreadObservations);
router.put('/marquer-lues', authenticate, authorize(['admin']), markObservationsAsRead);

export default router;