import express from 'express';
import {
  createClass,
  getClassesByCollege,
  getClassById,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/:collegeId/classes', authenticate, createClass);
router.get('/:collegeId/classes', authenticate, getClassesByCollege);
router.get('/class/:classId', authenticate, getClassById);
router.put('/class/:classId', authenticate, updateClass);
router.delete('/class/:classId', authenticate, deleteClass);

export default router;
