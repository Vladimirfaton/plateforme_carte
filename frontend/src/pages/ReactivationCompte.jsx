import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IdCard, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { authAPI, configAPI } from '../services/api';

export default function ReactivationCompte() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [collegeId, setCollegeId] = useState(null);
  const [collegeName, setCollegeName] = useState('');
  const [payerRole, setPayerRole] = useState('directeur');
  const [pricing, setPricing] = useState(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(null); // { plainKey }
  const listenersAttached = useRef(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      return;
    }
    authAPI.getReactivationInfo(token)
      .then(res => {
        setCollegeId(res.data.collegeId);
        setCollegeName(res.data.collegeName);
      })
      .catch(() => setInvalidToken(true));

    configAPI.getPricing().then(res => setPricing(res.data)).catch(() => {});

    if (document.querySelector('script[src="https://cdn.kkiapay.me/k.js"]')) {
      setScriptReady(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.async = true;
      script.onload = () => setScriptReady(true);
      document.body.appendChild(script);
    }
  }, [token]);

  useEffect(() => {
    if (!scriptReady || listenersAttached.current) return;
    listenersAttached.current = true;

    window.addSuccessListener(async ({ transactionId }) => {
      setConfirming(true);
      setError('');
      try {
        const res = await authAPI.confirmReactivationPayment({ token, transactionId });
        setSuccess({ plainKey: res.data.plainKey });
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur lors de la confirmation du paiement');
      } finally {
        setConfirming(false);
      }
    });

    window.addFailedListener(() => {
      setError('Le paiement a échoué ou a été annulé.');
    });
  }, [scriptReady, token]);

  const startPayment = () => {
    if (!pricing || !scriptReady || !collegeId) return;
    setError('');
    window.openKkiapayWidget({
      amount: pricing.amount,
      key: pricing.kkiapayPublicKey,
      sandbox: pricing.sandbox,
      position: 'center',
      partnerId: collegeId, // relu côté backend (webhook) pour retrouver le collège
      data: JSON.stringify({ payerRole }),
    });
  };

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-base font-semibold text-slate-800 mb-2">Lien invalide</h1>
          <p className="text-sm text-slate-500">
            Ce lien de renouvellement est invalide ou a expiré. Contactez l'assistance FVS pour en obtenir un nouveau.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-sm text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-base font-semibold text-slate-800 mb-2">Accès renouvelé</h1>
          <p className="text-sm text-slate-500 mb-4">
            Un email de confirmation a été envoyé au directeur et à la secrétaire avec la nouvelle clé d'accès.
          </p>
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
          
           <a href="/gestion/login"
            className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
          >
            Aller à la page de connexion
          </a>
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

        <div className="space-y-4">
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500 mb-0.5">Collège</p>
            <p className="text-sm font-medium text-slate-800">{collegeName || '...'}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Qui effectue le paiement ?</label>
            <select
              value={payerRole}
              onChange={e => setPayerRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="directeur">Directeur / Directrice</option>
              <option value="secretaire">Secrétaire</option>
            </select>
          </div>

          {pricing && (
            <p className="text-xs text-slate-500 text-center">
              Renouvellement : <strong>{pricing.amount.toLocaleString('fr-FR')} {pricing.currency}</strong> · 365 jours
            </p>
          )}

          <button
            type="button"
            onClick={startPayment}
            disabled={confirming || !pricing || !scriptReady || !collegeId}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
          >
            {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirming ? 'Confirmation du paiement...' : 'Payer et renouveler'}
          </button>
        </div>
      </div>
    </div>
  );
}