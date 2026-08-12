import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collegeAPI } from '../services/api';
import axios from 'axios';

export default function Dashboard() {
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [department, setDepartment] = useState('Littoral');
  const [commune, setCommune] = useState('Cotonou');
  const [stats, setStats] = useState({ total_colleges: 0, total_students: 0, total_cards: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartements();
  }, []);

  useEffect(() => {
    fetchCommunes();
    fetchColleges();
  }, [department, commune]);

  const fetchDepartements = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/locations/departements`);
      setDepartments(response.data);
    } catch (err) {
      console.error('Erreur chargement départements:', err);
    }
  };

  const fetchCommunes = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/locations/communes/${department}`
      );
      setCommunes(response.data);
      if (response.data.length > 0) {
        setCommune(response.data[0]);
      }
    } catch (err) {
      console.error('Erreur chargement communes:', err);
      setCommunes([]);
    }
  };

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const response = await collegeAPI.getByCommune(commune, department);
      setColleges(response.data);

      // Calculer stats
      let totalStudents = 0;
      for (const college of response.data) {
        try {
          const statsResp = await collegeAPI.getStats(college.id);
          totalStudents += statsResp.data.stats.total_students || 0;
        } catch (e) {
          // Ignorer
        }
      }

      setStats({
        total_colleges: response.data.length,
        total_students: totalStudents,
        total_cards: totalStudents,
      });
    } catch (err) {
      setError('Erreur lors de la récupération des collèges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-600 to-sky-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">📋 FVS - Cartes d'Identité</h1>
            <p className="text-sky-100 mt-1">Gestion complète des cartes scolaires • 300 DPI • Format ISO ID-1</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-semibold"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-sky-500">
            <p className="text-gray-600 font-semibold">Collèges</p>
            <p className="text-4xl font-bold text-sky-600 mt-2">{stats.total_colleges}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-sky-500">
            <p className="text-gray-600 font-semibold">Élèves</p>
            <p className="text-4xl font-bold text-sky-600 mt-2">{stats.total_students}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-sky-500">
            <p className="text-gray-600 font-semibold">Cartes Générées</p>
            <p className="text-4xl font-bold text-sky-600 mt-2">{stats.total_cards}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Filtrer par localisation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Département</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border-2 border-sky-300 rounded-lg focus:outline-none focus:border-sky-500 bg-sky-50"
              >
                {departments.map((dept) => (
                  <option key={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Commune</label>
              <select
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-4 py-2 border-2 border-sky-300 rounded-lg focus:outline-none focus:border-sky-500 bg-sky-50"
              >
                {communes.map((comm) => (
                  <option key={comm}>{comm}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Create College Button */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">🏫 Collèges enregistrés</h2>
          <button
            onClick={() => navigate('/colleges/new')}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-semibold shadow-md"
          >
            ➕ Nouveau collège
          </button>
        </div>

        {/* Colleges Grid */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded mb-6 text-red-700 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">⏳ Chargement des collèges...</p>
          </div>
        ) : colleges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-sky-200">
            <p className="text-gray-600 text-lg">📭 Aucun collège pour cette localisation</p>
            <button
              onClick={() => navigate('/colleges/new')}
              className="mt-4 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg transition"
            >
              Créer le premier
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {colleges.map((college) => (
              <div
                key={college.id}
                className="bg-white p-6 rounded-lg border-2 border-sky-200 hover:shadow-lg transition-all hover:border-sky-400"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-sky-700">{college.nom}</h3>
                    <p className="text-gray-600 mt-2">👨‍🏫 <strong>Directeur:</strong> {college.directeur_nom}</p>
                    <p className="text-gray-500 text-sm mt-1">📍 {college.commune}, {college.departement}</p>
                    <p className="text-gray-500 text-sm">📞 {college.telephone}</p>
                  </div>
                  <div className="flex gap-2 flex-col">
                    <button
                      onClick={() => navigate(`/colleges/${college.id}/classes`)}
                      className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm transition font-semibold"
                    >
                      👥 Gérer Élèves
                    </button>
                    <button
                      onClick={() => navigate(`/colleges/${college.id}/edit`)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition font-semibold"
                    >
                      ✏️ Éditer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
