import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('../../src/config/database.js', () => ({
  query: queryMock,
}));

const { Payment } = await import('../../src/models/Payment.js');

describe('Payment', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  describe('findByTransactionId', () => {
    it('retourne le paiement si la transaction existe déjà', async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: 'payment-1', transaction_id: 'tx-1', status: 'success' }],
      });

      const result = await Payment.findByTransactionId('tx-1');
      expect(result.id).toBe('payment-1');
    });

    it("retourne undefined si la transaction n'existe pas", async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });

      const result = await Payment.findByTransactionId('tx-inexistante');
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('insère et retourne le paiement en cas normal', async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: 'payment-1', transaction_id: 'tx-1', amount: 15000, status: 'success' }],
      });

      const result = await Payment.create({
        collegeId: 'college-1',
        userId: null,
        transactionId: 'tx-1',
        amount: 15000,
        status: 'success',
      });

      expect(result.transaction_id).toBe('tx-1');
    });

    it('retourne undefined si la transaction existe déjà (ON CONFLICT DO NOTHING)', async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });

      const result = await Payment.create({
        collegeId: 'college-1',
        userId: null,
        transactionId: 'tx-deja-traitee',
        amount: 15000,
        status: 'success',
      });

      expect(result).toBeUndefined();
    });
  });
});