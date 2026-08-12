import express from 'express';
import {
  generateBrouillonPreview,
  generateFinalCards,
  updateStudentInBrouillon,
  getCardStats,
} from '../controllers/cardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/:classId/brouillon', authenticate, generateBrouillonPreview);
router.post('/:classId/generate', authenticate, generateFinalCards);
router.put('/student/:studentId', authenticate, updateStudentInBrouillon);
router.get('/stats/:collegeId', authenticate, getCardStats);

export default router;
