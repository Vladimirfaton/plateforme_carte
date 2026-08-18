import express from 'express';
import { kkiapayWebhook } from '../controllers/paymentController.js';

const router = express.Router();
router.post('/kkiapay', kkiapayWebhook);

export default router;