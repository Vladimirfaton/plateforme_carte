import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { classAPI } from '../services/api';

export default function ObservationsPanel({ classId, readOnly = false, currentUserId = null }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [content, setContent]           = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    classAPI
      .listObservations(classId)
      .then((res) => setObservations(res.data || []))
      .catch(() => setObservations([]))
      .finally(() => setLoading(false));
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await classAPI.createObservation(classId, content.trim());
      setObservations((s) => [res.data, ...s]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout de l'observation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (obs) => {
    if (!confirm('Supprimer cette observation ?')) return;
    try {
      await classAPI.deleteObservation(classId, obs.id);
      setObservations((s) => s.filter((o) => o.id !== obs.id));
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'DELETE_DELAY_EXCEEDED') {
        alert('Impossible de supprimer : le délai de 30 minutes est dépassé.');
      } else {
        alert(err.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  // Vérifie si l'observation est supprimable par l'utilisateur courant
  const canDelete = (obs) => {
    if (!currentUserId) return false;
    if (obs.auteur_id !== currentUserId) return false;
    const diffMs = Date.now() - new Date(obs.created_at).getTime();
    return diffMs <= 30 * 60 * 1000;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Observations</h3>

      {!readOnly && (
        <form onSubmit={handleSubmit} className="mb-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ajouter une observation (ex: correction du nom, absence photo, etc.)"
            rows={3}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              {submitting ? 'Envoi...' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Chargement...</p>
      ) : observations.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune observation pour cette classe.</p>
      ) : (
        <ul className="space-y-3">
          {observations.map((o) => (
            <li key={o.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-slate-400 mb-1">
                  {(o.auteur_prenom || o.auteur_nom)
                    ? `${o.auteur_prenom || ''} ${o.auteur_nom || ''}`.trim()
                    : (o.auteur_role || 'Utilisateur')}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {new Date(o.created_at).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                {canDelete(o) && (
                  <button
                    onClick={() => handleDelete(o)}
                    className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer shrink-0"
                    title="Supprimer (dans les 30 min)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-sm text-slate-700">{o.contenu}</div>
              {o.eleve_nom && (
                <div className="text-xs text-emerald-600 mt-1">
                  Élève : {o.eleve_prenom} {o.eleve_nom} ({o.eleve_matricule})
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
