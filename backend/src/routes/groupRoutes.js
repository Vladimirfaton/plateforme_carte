import express from 'express';
import {
  getGroupsByClass,
  getGroupById,
  deleteGroup,
} from '../controllers/groupController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/:classId/groups', authenticate, getGroupsByClass);
router.get('/group/:groupId', authenticate, getGroupById);
router.delete('/group/:groupId', authenticate, deleteGroup);

export default router;
