import { IdCard, LogOut } from 'lucide-react';

export default function DashboardGestion({ onLogout }) {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const roleLabel = user.role === 'directeur' ? 'Directeur / Directrice' : 'Secrétaire';

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <IdCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800">Espace {roleLabel}</h1>
            <p className="text-xs text-slate-500">{user.prenom} {user.nom}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Déconnexion
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-sm text-slate-500">
          Le tableau de bord {roleLabel.toLowerCase()} est en cours de construction.
        </p>
      </div>
    </div>
  );
}
