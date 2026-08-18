import express from 'express';
import { getPricing } from '../controllers/configController.js';

const router = express.Router();
router.get('/pricing', getPricing);

export default router;