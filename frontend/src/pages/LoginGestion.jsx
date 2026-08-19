import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IdCard, Loader2, AlertTriangle } from 'lucide-react';
import { authAPI } from '../services/api';

export default function LoginGestion({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const wasExpired = searchParams.get('expired') === '1';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setLoading(true);

    try {
      const res = await authAPI.loginGestion(username, password);
      const { token, user } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess?.();
      navigate('/gestion/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
      setErrorCode(err.response?.data?.code || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <IdCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 leading-tight">FVS</h1>
            <p className="text-xs text-slate-500">Espace de gestion</p>
          </div>
        </div>

        {wasExpired && !error && (
          <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Votre accès a expiré et votre session a été fermée. Un lien de renouvellement a été envoyé par email au directeur ou à la directrice.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            {error}
            {errorCode === 'ACCOUNT_PENDING' && (
              <div className="mt-2">
                Activez votre compte via le lien reçu par email.
              </div>
            )}
            {errorCode === 'ACCESS_EXPIRED' && (
              <div className="mt-2">
                Un lien de renouvellement a été envoyé par email au directeur ou à la directrice. Vous pouvez aussi contacter l'assistance.
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="prenomnom"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Plateforme interne FVS · +229 01 47 61 14 99
        </p>
      </div>
    </div>
  );
}