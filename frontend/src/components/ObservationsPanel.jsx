import React, { useEffect, useState } from 'react';
import { classAPI } from '../services/api';

export default function ObservationsPanel({ classId, readOnly = false }) {
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
          {error && (
            <p className="text-xs text-rose-600 mt-1">{error}</p>
          )}
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
              <div className="text-sm text-slate-700">{o.contenu}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
