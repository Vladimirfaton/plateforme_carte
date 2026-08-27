import { describe, it, expect } from 'vitest';
import {
  generateReactivationToken,
  verifyReactivationToken,
} from '../../src/utils/reactivationToken.js';

describe('reactivationToken', () => {
  it('génère un token que verifyReactivationToken sait décoder', () => {
    const token = generateReactivationToken('college-abc');
    const collegeId = verifyReactivationToken(token);
    expect(collegeId).toBe('college-abc');
  });

  it('rejette un token invalide/mal formé', () => {
    expect(() => verifyReactivationToken('token.invalide.corrompu')).toThrow();
  });

  it("rejette un token d'un autre type (protection contre la confusion de jetons)", () => {
    const jwt = require('jsonwebtoken');
    const wrongTypeToken = jwt.sign(
      { collegeId: 'college-abc', type: 'autre_chose' },
      process.env.JWT_SECRET
    );
    expect(() => verifyReactivationToken(wrongTypeToken)).toThrow('INVALID_TOKEN_TYPE');
  });

  it('rejette un token signé avec un mauvais secret', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const forgedToken = jwt.sign(
      { collegeId: 'college-abc', type: 'reactivation' },
      'mauvais-secret'
    );
    expect(() => verifyReactivationToken(forgedToken)).toThrow();
  });
});