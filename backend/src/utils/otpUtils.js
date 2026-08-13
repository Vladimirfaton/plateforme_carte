import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';

const OTP_EXPIRY_MINUTES = 3;

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveOTP = async (email, otpCode) => {
  try {
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await query('DELETE FROM otps WHERE email = $1', [email]);

    const result = await query(
      `INSERT INTO otps (id, email, code, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [uuidv4(), email, otpCode, expiryTime]
    );

    logger.info(`OTP saved for ${email}`);
    return result.rows[0];
  } catch (error) {
    logger.error(`Error saving OTP: ${error.message}`);
    throw error;
  }
};

export const verifyOTP = async (email, otpCode) => {
  try {
    const result = await query(
      `SELECT * FROM otps
       WHERE email = $1 AND code = $2 AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, otpCode]
    );

    if (result.rows.length === 0) {
      logger.warn(`Invalid or expired OTP for ${email}`);
      return false;
    }

    await query('DELETE FROM otps WHERE id = $1', [result.rows[0].id]);
    logger.info(`OTP verified successfully for ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw error;
  }
};

export default { generateOTP, saveOTP, verifyOTP };