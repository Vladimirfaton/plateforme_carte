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
  getReactivationInfo,
} from '../controllers/authController.js';
import { confirmReactivationPayment } from '../controllers/paymentController.js';
import { authenticate, checkAccountActive } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';


const router = express.Router();

router.post('/login', loginRateLimiter, login);
router.post('/login-gestion', loginRateLimiter, loginGestion);

router.post('/login', login);
router.post('/verify-otp', verifyOtpCode);
router.post('/resend-otp', resendOtp);
router.post('/register', register);
// checkAccountActive ajouté ici : sans ça, un JWT reste "valide" même si le
// compte est passé expired en base — la déconnexion au rechargement de page
// ne se déclenchait jamais.
router.get('/verify', authenticate, checkAccountActive, verifyToken);

// Comptes de gestion (directeur / secrétaire) — pas d'OTP
router.post('/login-gestion', loginGestion);
router.post('/activation-compte', activateAccount);
router.get('/reactivation-info', getReactivationInfo);
router.post('/reactivation-paiement', confirmReactivationPayment);
router.get('/username-disponible', checkUsernameAvailability);

export default router;