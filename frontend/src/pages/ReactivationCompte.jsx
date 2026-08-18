import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IdCard, Loader2, CheckCircle2 } from 'lucide-react';
import { authAPI, configAPI } from '../services/api';

export default function ReactivationCompte({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(searchParams.get('username') || '');
  const [password, setPassword] = useState('');
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(null); // { plainKey }
  const scriptLoaded = useRef(false);
const widgetRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    configAPI.getPricing().then(res => setPricing(res.data)).catch(() => {});

    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.async = true;
      document.body.appendChild(script);
      scriptLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    const handleSuccess = async (event) => {
      const transactionId = event?.detail?.transactionId;
      if (!transactionId) return;
      setPaying(false);
      setConfirming(true);
      setError('');
      try {
        const res = await authAPI.confirmReactivationPayment({ username, password, transactionId });
        const { token, user, plainKey } = res.data;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        setSuccess({ plainKey });
        onLoginSuccess?.();
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur lors de la confirmation du paiement');
      } finally {
        setConfirming(false);
      }
    };
    const handleFailed = () => {
      setPaying(false);
      setError('Le paiement a échoué ou a été annulé.');
    };

    window.addEventListener('success', handleSuccess);
    window.addEventListener('failed', handleFailed);
    return () => {
      window.removeEventListener('success', handleSuccess);
      window.removeEventListener('failed', handleFailed);
    };
  }, [username, password]);

  const startPayment = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Identifiant et mot de passe requis avant de payer");
      return;
    }
    setError('');
    setPaying(true);
  };
  useEffect(() => {
  if (widgetRef.current && pricing?.kkiapayPublicKey) {
    widgetRef.current.setAttribute('key', pricing.kkiapayPublicKey);
  }
}, [paying, pricing]);
  if (success) {
    return (
      <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-sm text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-base font-semibold text-slate-800 mb-2">Accès renouvelé</h1>
          <p className="text-sm text-slate-500 mb-4">Un email de confirmation vous a été envoyé avec votre nouvelle clé d'accès.</p>
          {success.plainKey && (
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Nouvelle clé d'accès (reçue par email)</label>
              <input
                type="text"
                value={success.plainKey}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm tracking-widest uppercase text-center font-mono"
              />
            </div>
          )}
          <button
            onClick={() => navigate('/gestion/dashboard')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium cursor-pointer"
          >
            Accéder à mon espace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <IdCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 leading-tight">FVS</h1>
            <p className="text-xs text-slate-500">Renouvellement d'accès</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={startPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe habituel</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {pricing && (
            <p className="text-xs text-slate-500 text-center">
              Renouvellement : <strong>{pricing.amount.toLocaleString('fr-FR')} {pricing.currency}</strong> · 365 jours
            </p>
          )}

          <button
            type="submit"
            disabled={confirming || !pricing}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
          >
            {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirming ? 'Confirmation du paiement...' : 'Payer et renouveler'}
          </button>
        </form>

        {paying && pricing && (
  <kkiapay-widget
    ref={widgetRef}
    amount={pricing.amount}
    data={JSON.stringify({ username })}
    sandbox={pricing.sandbox ? 'true' : 'false'}
    position="center"
  />
)}
      </div>
    </div>
  );
}