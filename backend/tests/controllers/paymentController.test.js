import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyMock = vi.fn();
vi.mock('@kkiapay-org/nodejs-sdk', () => ({
  kkiapay: () => ({ verify: verifyMock }),
}));

const AccessKeyMock = {
  createPending: vi.fn(),
  activate: vi.fn(),
};
vi.mock('../../src/models/AccessKey.js', () => ({ AccessKey: AccessKeyMock }));

const UserMock = {
  findByCollege: vi.fn(),
  reactivateByCollege: vi.fn(),
};
vi.mock('../../src/models/User.js', () => ({ User: UserMock }));

const PaymentMock = {
  findByTransactionId: vi.fn(),
  create: vi.fn(),
};
vi.mock('../../src/models/Payment.js', () => ({ Payment: PaymentMock }));

const CollegeMock = { findById: vi.fn() };
vi.mock('../../src/models/College.js', () => ({ College: CollegeMock }));

vi.mock('../../src/utils/email.js', () => ({
  sendReactivationEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/utils/reactivationToken.js', () => ({
  verifyReactivationToken: vi.fn(),
}));

vi.mock('../../src/config/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { confirmReactivationPayment, kkiapayWebhook } = await import(
  '../../src/controllers/paymentController.js'
);
const { verifyReactivationToken } = await import('../../src/utils/reactivationToken.js');

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

describe('paymentController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CollegeMock.findById.mockResolvedValue({ nom: 'Collège Test' });
    AccessKeyMock.createPending.mockResolvedValue({ id: 'key-1', plainKey: 'PLAINKEY001' });
    UserMock.reactivateByCollege.mockResolvedValue([{ email: 'directeur@test.com' }]);
  });

  describe('confirmReactivationPayment', () => {
    it('rejette si le token de réactivation est invalide', async () => {
      verifyReactivationToken.mockImplementation(() => {
        throw new Error('bad token');
      });

      const req = { body: { token: 'bad', transactionId: 'tx-1' } };
      const res = mockRes();
      await confirmReactivationPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejette si aucun compte du collège n'est en attente de renouvellement", async () => {
      verifyReactivationToken.mockReturnValue('college-1');
      UserMock.findByCollege.mockResolvedValue([{ status: 'active' }]);

      const req = { body: { token: 'ok', transactionId: 'tx-1' } };
      const res = mockRes();
      await confirmReactivationPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('rejette si le paiement KKiaPay n\'est pas SUCCESS — ne crée AUCUNE clé', async () => {
      verifyReactivationToken.mockReturnValue('college-1');
      UserMock.findByCollege.mockResolvedValue([{ status: 'expired' }]);
      PaymentMock.findByTransactionId.mockResolvedValue(null);
      verifyMock.mockResolvedValue({ status: 'FAILED', amount: 15000 });

      const req = { body: { token: 'ok', transactionId: 'tx-1' } };
      const res = mockRes();
      await confirmReactivationPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(402);
      expect(AccessKeyMock.createPending).not.toHaveBeenCalled();
    });

    it('rejette si le montant payé est inférieur au prix attendu — ne crée AUCUNE clé', async () => {
      verifyReactivationToken.mockReturnValue('college-1');
      UserMock.findByCollege.mockResolvedValue([{ status: 'expired' }]);
      PaymentMock.findByTransactionId.mockResolvedValue(null);
      verifyMock.mockResolvedValue({ status: 'SUCCESS', amount: 5000 }); // < 15000

      const req = { body: { token: 'ok', transactionId: 'tx-1' } };
      const res = mockRes();
      await confirmReactivationPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(402);
      expect(AccessKeyMock.createPending).not.toHaveBeenCalled();
    });

    it('active la clé et réactive les comptes si le paiement est confirmé et suffisant', async () => {
      verifyReactivationToken.mockReturnValue('college-1');
      UserMock.findByCollege.mockResolvedValue([{ status: 'expired' }]);
      PaymentMock.findByTransactionId.mockResolvedValue(null);
      verifyMock.mockResolvedValue({ status: 'SUCCESS', amount: 15000 });
      PaymentMock.create.mockResolvedValue({ id: 'payment-1' });

      const req = { body: { token: 'ok', transactionId: 'tx-1' } };
      const res = mockRes();
      await confirmReactivationPayment(req, res);

      expect(AccessKeyMock.createPending).toHaveBeenCalledWith('college-1', 'paid');
      expect(AccessKeyMock.activate).toHaveBeenCalledWith('key-1', 'paid');
      expect(UserMock.reactivateByCollege).toHaveBeenCalledWith('college-1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ plainKey: 'PLAINKEY001', alreadyProcessed: false })
      );
    });

    it('ne rejoue rien si la transaction a déjà été traitée (déduplication)', async () => {
      verifyReactivationToken.mockReturnValue('college-1');
      UserMock.findByCollege.mockResolvedValue([{ status: 'expired' }]);
      PaymentMock.findByTransactionId.mockResolvedValue({ id: 'payment-existant' });

      const req = { body: { token: 'ok', transactionId: 'tx-1' } };
      const res = mockRes();
      await confirmReactivationPayment(req, res);

      expect(verifyMock).not.toHaveBeenCalled(); // pas de re-vérification KKiaPay
      expect(AccessKeyMock.createPending).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ alreadyProcessed: true, plainKey: null })
      );
    });
  });

  describe('kkiapayWebhook', () => {
    it('rejette si la signature x-kkiapay-secret est absente ou incorrecte', async () => {
      process.env.KKIAPAY_WEBHOOK_SECRET = 'le-bon-secret';
      const req = { headers: { 'x-kkiapay-secret': 'mauvais-secret' }, body: {} };
      const res = mockRes();

      await kkiapayWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(verifyMock).not.toHaveBeenCalled();
    });

    it('traite la transaction si la signature est correcte et partnerId présent', async () => {
      process.env.KKIAPAY_WEBHOOK_SECRET = 'le-bon-secret';
      PaymentMock.findByTransactionId.mockResolvedValue(null);
      verifyMock.mockResolvedValue({ status: 'SUCCESS', amount: 15000, partnerId: 'college-1' });
      PaymentMock.create.mockResolvedValue({ id: 'payment-1' });

      const req = {
        headers: { 'x-kkiapay-secret': 'le-bon-secret' },
        body: { transactionId: 'tx-2' },
      };
      const res = mockRes();

      await kkiapayWebhook(req, res);

      expect(AccessKeyMock.createPending).toHaveBeenCalledWith('college-1', 'paid');
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });
});