export const getPricing = (req, res) => {
  res.json({
    amount: Number(process.env.RENEWAL_PRICE_XOF || 15000),
    currency: 'XOF',
    kkiapayPublicKey: process.env.KKIAPAY_PUBLIC_KEY,
    sandbox: process.env.KKIAPAY_SANDBOX === 'true',
  });
};