import express from 'express';
import {
  login,
  register,
  verifyToken,
  verifyOtpCode,
  resendOtp,
  loginGestion,
  activateAccount,
  checkUsernameAvailability,
} from '../controllers/authController.js';
import { confirmReactivationPayment } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify-otp', verifyOtpCode);
router.post('/resend-otp', resendOtp);
router.post('/register', register);
router.get('/verify', authenticate, verifyToken);

// Comptes de gestion (directeur / secrétaire) — pas d'OTP
router.post('/login-gestion', loginGestion);
router.post('/activation-compte', activateAccount);
router.post('/reactivation-paiement', confirmReactivationPayment);
router.get('/username-disponible', checkUsernameAvailability);

export default router;