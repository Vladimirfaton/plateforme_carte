import jwt from 'jsonwebtoken';

// Token public inclus dans le lien de renouvellement envoyé au directeur.
// Pas de login requis — juste possession du lien (email) suffit.
export function generateReactivationToken(collegeId) {
  return jwt.sign({ collegeId, type: 'reactivation' }, process.env.JWT_SECRET, { expiresIn: '180d' });
}

export function verifyReactivationToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'reactivation' || !decoded.collegeId) {
    throw new Error('INVALID_TOKEN_TYPE');
  }
  return decoded.collegeId;
}