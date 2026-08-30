import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AccessKey } from '../models/AccessKey.js';
import logger from '../config/logger.js';
import { generateOTP, saveOTP, verifyOTP } from '../utils/otpUtils.js';
import { sendOtpEmail, sendLoginLinkEmail } from '../utils/email.js';
import { College } from '../models/College.js';
import { normalizeUsername } from '../utils/username.js';
import { isValidPassword } from '../utils/validators.js';
import { verifyReactivationToken } from '../utils/reactivationToken.js';
import { AccessKey, TRIAL_DURATION_DAYS } from '../models/AccessKey.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const isValidPasswordMatch = await User.verifyPassword(password, user.password_hash);
    if (!isValidPasswordMatch) {
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    try {
      const otpCode = generateOTP();
      await saveOTP(email, otpCode);
      await sendOtpEmail(email, otpCode);

      logger.info(`OTP sent to ${email}`);
      return res.json({
        message: 'Un code OTP a été envoyé à votre email',
        email: email,
        requiresOTP: true,
      });
    } catch (emailError) {
      logger.error(`Failed to send OTP: ${emailError.message}`);
      return res.status(500).json({ error: 'Erreur lors de l\'envoi du code OTP' });
    }
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

export const verifyOtpCode = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Email et code OTP requis' });
    }

    const isValidOtp = await verifyOTP(email, otpCode);
    if (!isValidOtp) {
      logger.warn(`Invalid OTP attempt for: ${email}`);
      return res.status(401).json({ error: 'Code OTP invalide ou expiré' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`User logged in successfully: ${email}`);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error(`OTP verification error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la vérification du code' });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 8 caractères' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà enregistré' });
    }

    const user = await User.create(email, password, 'admin');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`New user registered: ${email}`);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const otpCode = generateOTP();
    await saveOTP(email, otpCode);
    await sendOtpEmail(email, otpCode);

    logger.info(`OTP resent to ${email}`);
    res.json({ message: 'Nouveau code envoyé', email });
  } catch (error) {
    logger.error(`Resend OTP error: ${error.message}`);
    res.status(500).json({ error: "Erreur lors de l'envoi du code" });
  }
};

export const verifyToken = (req, res) => {
  try {
    const user = req.user;
    res.json({
      valid: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token invalide' });
  }
};

// ============================================================================
// COMPTES DE GESTION (directeur / secrétaire) — pas d'OTP, login username+mdp
// ============================================================================

export const loginGestion = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
    }

    const user = await User.findByUsername(username.trim());
        if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    if (user.status === 'pending_activation') {
      return res.status(403).json({
        error: "Compte non activé. Vérifiez l'email reçu pour l'activer.",
        code: 'ACCOUNT_PENDING',
      });
    }
    if (user.status === 'expired') {
      return res.status(403).json({
        error: 'Accès expiré. Un renouvellement est nécessaire.',
        code: 'ACCESS_EXPIRED',
      });
    }

    const validPassword = await User.verifyPassword(password, user.password_hash);
    if (!validPassword) {
      logger.warn(`Failed login attempt for username: ${username}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        college_id: user.college_id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`Management login: ${username} (${user.role})`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        college_id: user.college_id,
        username: user.username,
        nom: user.nom,
        prenom: user.prenom,
      },
    });
  } catch (error) {
    logger.error(`Login gestion error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

export const activateAccount = async (req, res) => {
  try {
    const { email, accessKey, username, password, confirmPassword } = req.body;

    if (!email || !accessKey || !username || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
      });
    }

    const user = await User.findByEmail(email);
    if (!user || !['directeur', 'secretaire'].includes(user.role)) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }
    if (user.status !== 'pending_activation') {
      return res.status(409).json({ error: 'Ce compte a déjà été activé' });
    }

    const usernameNormalized = normalizeUsername(username);
    if (!usernameNormalized) {
      return res.status(400).json({ error: "Nom d'utilisateur invalide" });
    }
    const taken = await User.usernameExists(usernameNormalized);
    if (taken) {
      return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris", code: 'USERNAME_TAKEN' });
    }

    const pendingKey = await AccessKey.verifyPendingKey(user.college_id, accessKey);
    if (!pendingKey) {
      return res.status(401).json({ error: "Clé d'accès invalide" });
    }
const activatedUser = await User.activateAccount(user.id, usernameNormalized, password);
    await AccessKey.activate(pendingKey.id, TRIAL_DURATION_DAYS);

    const loginUrl = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/gestion/login`;
    try {
      const college = await College.findById(activatedUser.college_id);
      await sendLoginLinkEmail(activatedUser.email, {
        role: activatedUser.role,
        collegeName: college?.nom || '',
        loginUrl,
      });
    } catch (mailErr) {
      logger.error(`Login link email failed: ${mailErr.message}`);
    }

    logger.info(`Account activated: ${email} (${activatedUser.role})`);
    res.json({ activated: true, user: activatedUser });
  } catch (error) {
    logger.error(`Activation error: ${error.message}`);
    res.status(500).json({ error: "Erreur lors de l'activation du compte" });
  }
};

export const reactivateAccount = async (req, res) => {
  try {
    const { email, accessKey, password } = req.body;
    if (!email || !accessKey || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const user = await User.findByEmail(email);
    if (!user || !['directeur', 'secretaire'].includes(user.role)) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }
    if (user.status !== 'expired') {
      return res.status(409).json({ error: "Ce compte n'est pas en attente de renouvellement" });
    }

    const validPassword = await User.verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const pendingKey = await AccessKey.verifyPendingKey(user.college_id, accessKey);
    if (!pendingKey) {
      return res.status(401).json({ error: "Clé d'accès invalide" });
    }

    const reactivatedUser = await User.reactivate(user.id);
    await AccessKey.activate(pendingKey.id, 'paid');

    const token = jwt.sign(
      {
        id: reactivatedUser.id,
        email: reactivatedUser.email,
        role: reactivatedUser.role,
        college_id: reactivatedUser.college_id,
        username: reactivatedUser.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`Account reactivated: ${email}`);
    res.json({ token, user: reactivatedUser });
  } catch (error) {
    logger.error(`Reactivation error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la réactivation du compte' });
  }
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Nom d'utilisateur requis" });
    }
    const normalized = normalizeUsername(username);
    const exists = await User.usernameExists(normalized);
    res.json({ available: !exists, username: normalized });
  } catch (error) {
    logger.error(`Username check error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
};
// Page publique de réactivation : résout le token en nom de collège, sans login
export const getReactivationInfo = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    let collegeId;
    try {
      collegeId = verifyReactivationToken(token);
    } catch {
      return res.status(401).json({ error: 'Lien de renouvellement invalide ou expiré' });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    res.json({ collegeId: college.id, collegeName: college.nom });
  } catch (error) {
    logger.error(`getReactivationInfo error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la vérification du lien' });
  }
};