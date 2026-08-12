import express from 'express';
import { login, register, verifyToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/verify', authenticate, verifyToken);

export default router;
