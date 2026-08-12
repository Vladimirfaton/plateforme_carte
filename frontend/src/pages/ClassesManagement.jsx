import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { classAPI, collegeAPI } from '../services/api';

const emptyForm = { niveau: '', serie: '' };

export default function ClassesManagement() {
  const { collegeId } = useParams();
  const navigate = useNavigate();

  const [college, setCollege] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, [collegeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, cl] = await Promise.all([
        collegeAPI.getById(collegeId),
        classAPI.getByCollege(collegeId),
      ]);
      setCollege(c.data);
      setClasses(cl.data || []);
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); setError(''); };
  const openEdit = (cls) => {
    setForm({ niveau: cls.niveau, serie: cls.serie });
    setEditingId(cls.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await classAPI.update(editingId, form);
      else await classAPI.create(collegeId, form);
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (cls) => {
    if (!confirm(`Supprimer la classe ${cls.code} et tous ses élèves ?`)) return;
    try {
      await classAPI.delete(cls.id);
      fetchData();
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Retour Dashboard
        </button>

        <h1 className="text-xl font-semibold text-slate-800 mb-1">{college?.nom}</h1>
        <p className="text-sm text-slate-500 mb-6">Gestion des classes</p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!showForm ? (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium mb-6 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nouvelle classe
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              {editingId ? 'Modifier la classe' : 'Créer une classe'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Classe (ex: 6ème)"
                value={form.niveau}
                onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Série (ex: A)"
                value={form.serie}
                onChange={(e) => setForm({ ...form, serie: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium cursor-pointer">
                {editingId ? 'Enregistrer' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-base font-semibold text-slate-800">{cls.code}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cls)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cls)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {cls.effectif ?? 0} élèves
              </div>
              <button
                onClick={() => navigate(`/classes/${cls.id}/students`)}
                className="mt-3 w-full px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Gérer les élèves
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}