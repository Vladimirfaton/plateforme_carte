import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import logger from '../config/logger.js';
import { generateOTP, saveOTP, verifyOTP } from '../utils/otpUtils.js';
import { sendOtpEmail } from '../utils/email.js';

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

    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Générer et envoyer OTP
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
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
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
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
};

export const verifyToken = (req, res) => {
  try {
    const user = req.user;
    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token invalide' });
  }
};
