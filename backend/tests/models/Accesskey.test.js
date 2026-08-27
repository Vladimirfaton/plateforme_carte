import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('../../src/config/database.js', () => ({
  query: queryMock,
}));

const { AccessKey } = await import('../../src/models/AccessKey.js');

describe('AccessKey', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  describe('verifyPendingKey', () => {
    it('retourne null si aucune clé pending pour ce collège', async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });

      const result = await AccessKey.verifyPendingKey('college-1', 'ABCD1234WXYZ');
      expect(result).toBeNull();
    });

    it('retourne null si la clé saisie ne correspond pas au hash', async () => {
      const bcrypt = await import('bcryptjs');
      const wrongHash = await bcrypt.hash('AUTRECLE0000', 10);

      queryMock.mockResolvedValueOnce({
        rows: [{ id: 'key-1', college_id: 'college-1', key_hash: wrongHash, status: 'pending' }],
      });

      const result = await AccessKey.verifyPendingKey('college-1', 'MAUVAISECLE1');
      expect(result).toBeNull();
    });

    it('retourne la clé pending si elle correspond au hash', async () => {
      const bcrypt = await import('bcryptjs');
      const plainKey = 'BONNECLE0001';
      const hash = await bcrypt.hash(plainKey, 10);

      queryMock.mockResolvedValueOnce({
        rows: [{ id: 'key-1', college_id: 'college-1', key_hash: hash, status: 'pending' }],
      });

      const result = await AccessKey.verifyPendingKey('college-1', plainKey);
      expect(result).not.toBeNull();
      expect(result.id).toBe('key-1');
    });
  });

  describe('activate', () => {
    it('active une clé de type free avec la durée FREE_DURATION_DAYS (155j)', async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: 'key-1', status: 'active', type: 'free' }],
      });

      await AccessKey.activate('key-1', 'free');

      const [sql, params] = queryMock.mock.calls[0];
      expect(sql).toContain("SET status = 'active'");
      expect(params).toEqual(['key-1', 155]);
    });

    it('active une clé de type paid avec la durée PAID_DURATION_DAYS (365j)', async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: 'key-1', status: 'active', type: 'paid' }],
      });

      await AccessKey.activate('key-1', 'paid');

      const [, params] = queryMock.mock.calls[0];
      expect(params).toEqual(['key-1', 365]);
    });
  });

  describe('expireOutdatedKeys', () => {
    it("retourne un tableau vide et ne touche pas aux users si aucune clé n'a expiré", async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });

      const result = await AccessKey.expireOutdatedKeys();

      expect(result).toEqual([]);
      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it('retourne les college_id uniques et met à jour les comptes gestion de ces collèges', async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [
            { college_id: 'college-1' },
            { college_id: 'college-1' },
            { college_id: 'college-2' },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const result = await AccessKey.expireOutdatedKeys();

      expect(result.sort()).toEqual(['college-1', 'college-2']);
      expect(queryMock).toHaveBeenCalledTimes(2);

      const [usersSql, usersParams] = queryMock.mock.calls[1];
      expect(usersSql).toContain("SET status = 'expired'");
      expect(usersParams[0].sort()).toEqual(['college-1', 'college-2']);
    });
  });
});