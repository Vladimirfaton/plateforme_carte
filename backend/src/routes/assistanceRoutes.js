import express from 'express';
import { sendAssistance } from '../controllers/assistanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/send', authenticate, sendAssistance);

export default router;