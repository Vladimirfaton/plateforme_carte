import React, { useEffect, useState } from 'react';
import { classAPI } from '../services/api';

export default function ObservationsPanel({ classId }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const res = await classAPI.createObservation(classId, content.trim());
      setObservations((s) => [res.data, ...s]);
      setContent('');
    } catch (err) {
      // ignore - caller will show toasts normally
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white border rounded-md">
      <h3 className="text-sm font-semibold mb-3">Observations</h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter une observation (ex: correction du nom, absence photo, etc.)"
          className="w-full border rounded p-2 h-20 text-sm"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="bg-emerald-600 text-white px-3 py-1 rounded disabled:opacity-60"
          >
            {submitting ? 'Envoi...' : 'Ajouter'}
          </button>
        </div>
      </form>

      <div>
        {loading ? (
          <div className="text-sm text-gray-500">Chargement...</div>
        ) : observations.length === 0 ? (
          <div className="text-sm text-gray-500">Aucune observation</div>
        ) : (
          <ul className="space-y-3">
            {observations.map((o) => (
              <li key={o.id} className="border p-2 rounded">
                <div className="text-xs text-gray-500 mb-1">
                  {o.auteur_nom || 'Utilisateur'} {o.auteur_prenom ? ` ${o.auteur_prenom}` : ''} —{' '}
                  <span className="font-mono text-[11px]">{new Date(o.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm">{o.contenu}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
