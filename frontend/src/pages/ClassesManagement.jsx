import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classAPI, collegeAPI } from '../services/api';

export default function ClassesManagement() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClass, setNewClass] = useState({ code: '', niveau: '', effectif_previsionnel: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [collegeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const collegeResp = await collegeAPI.getById(collegeId);
      setCollege(collegeResp.data);

      const classesResp = await classAPI.getByCollege(collegeId);
      setClasses(classesResp.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await classAPI.create(collegeId, newClass);
      setNewClass({ code: '', niveau: '', effectif_previsionnel: '' });
      setShowForm(false);
      fetchData();
      alert('✅ Classe créée avec groupes A-G automatiquement!');
    } catch (error) {
      alert('❌ Erreur: ' + error.response?.data?.error);
    }
  };

  if (loading) return <div className="text-center py-12">⏳ Chargement...</div>;

  return (
    <div className="min-h-screen bg-sky-50">
      <div className="max-w-7xl mx-auto p-6">
        <button onClick={() => navigate('/dashboard')} className="text-sky-600 hover:text-sky-700 font-semibold mb-4">
          ← Retour Dashboard
        </button>

        <h1 className="text-3xl font-bold text-sky-700 mb-2">{college?.nom}</h1>
        <p className="text-gray-600 mb-6">Gestion des classes et groupes</p>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-semibold mb-6"
          >
            ➕ Nouvelle Classe
          </button>
        ) : (
          <form onSubmit={handleAddClass} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold mb-4">Créer une classe</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Code (ex: 6ème)"
                value={newClass.code}
                onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                className="px-4 py-2 border-2 border-sky-300 rounded-lg focus:outline-none focus:border-sky-500"
                required
              />
              <input
                type="text"
                placeholder="Niveau"
                value={newClass.niveau}
                onChange={(e) => setNewClass({ ...newClass, niveau: e.target.value })}
                className="px-4 py-2 border-2 border-sky-300 rounded-lg focus:outline-none focus:border-sky-500"
              />
              <input
                type="number"
                placeholder="Effectif"
                value={newClass.effectif_previsionnel}
                onChange={(e) => setNewClass({ ...newClass, effectif_previsionnel: e.target.value })}
                className="px-4 py-2 border-2 border-sky-300 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-semibold">
                ✅ Créer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold"
              >
                ❌ Annuler
              </button>
            </div>
          </form>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Classes</h2>
        <div className="grid gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-sky-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-sky-700">{cls.code}</h3>
                  <p className="text-gray-600">Effectif: {cls.effectif_previsionnel || 'N/A'}</p>
                </div>
                <button
                  onClick={() => navigate(`/classes/${cls.id}/students`)}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  👥 Gérer Élèves
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
