import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IdCard, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';

export default function ActivationCompte({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [accessKey, setAccessKey] = useState(searchParams.get('key') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setUsernameError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.activateAccount({
        email,
        accessKey: accessKey.trim().toUpperCase(),
        username,
        password,
        confirmPassword,
      });
      const { token, user } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess?.();
      navigate('/gestion/dashboard');
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.error || "Erreur lors de l'activation";
      if (code === 'USERNAME_TAKEN') {
        setUsernameError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-4 py-10">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <IdCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 leading-tight">FVS</h1>
            <p className="text-xs text-slate-500">Activation de votre espace</p>
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
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Clé d'accès</label>
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
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Identifiant souhaité</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setUsernameError(''); }}
              placeholder="prenomnom"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${usernameError ? 'border-rose-300' : 'border-slate-200'}`}
              required
            />
            {usernameError && <p className="text-xs text-rose-600 mt-1">{usernameError}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">8 caractères min., une majuscule, une minuscule, un chiffre</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
            {loading ? 'Activation...' : 'Activer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
