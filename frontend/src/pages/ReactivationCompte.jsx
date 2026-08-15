import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IdCard, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';

export default function ReactivationCompte({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [accessKey, setAccessKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.reactivateAccount({
        email,
        accessKey: accessKey.trim().toUpperCase(),
        password,
      });
      const { token, user } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess?.();
      navigate('/gestion/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réactivation');
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
            <p className="text-xs text-slate-500">Renouvellement d'accès</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nouvelle clé d'accès</label>
            <input
              type="text"
              value={accessKey}
              onChange={e => setAccessKey(e.target.value)}
              placeholder="12 caractères"
              maxLength={12}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Vérification...' : 'Renouveler mon accès'}
          </button>
        </form>
      </div>
    </div>
  );
}
