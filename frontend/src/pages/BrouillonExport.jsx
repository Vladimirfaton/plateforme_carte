import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generateBrouillonPDF } from '../utils/pdfUtils';

const BrouillonExport = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editingStudent, setEditingStudent] = useState(null);
  const [editData, setEditData] = useState({});
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const CARDS_PER_PAGE = 6;

  useEffect(() => {
    fetchBrouillonData();
  }, [classId]);

  const fetchBrouillonData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/cards/${classId}/brouillon`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudents(response.data.students || []);
      setClassInfo(response.data.classData);
      if (response.data.classData?.college_id) {
        const collegeRes = await axios.get(
          `${API_URL}/colleges`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const college = collegeRes.data.find(c => c.id === response.data.classData.college_id);
        setCollegeInfo(college);
      }
    } catch (err) {
      console.error('Error fetching brouillon data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student.id);
    setEditData({
      matricule: student.matricule,
      nom: student.nom,
      prenom: student.prenom,
      sexe: student.sexe,
      date_naissance: student.date_naissance,
      lieu_naissance: student.lieu_naissance,
      nationalite: student.nationalite,
      adresse: student.adresse,
      telephone: student.telephone
    });
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/cards/student/${editingStudent}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Élève modifié');
      setEditingStudent(null);
      await fetchBrouillonData();
    } catch (err) {
      console.error('Error saving edit:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (studentId, file) => {
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('photo', file);

      await axios.put(
        `${API_URL}/students/${studentId}/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Photo mise à jour');
      await fetchBrouillonData();
    } catch (err) {
      console.error('Error updating photo:', err);
      setError('Erreur lors de la mise à jour de la photo');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setGeneratingPDF(true);
      await generateBrouillonPDF(students, classInfo, collegeInfo);
      setSuccess('PDF généré et téléchargé!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const pages = [];
  for (let i = 0; i < students.length; i += CARDS_PER_PAGE) {
    pages.push(students.slice(i, i + CARDS_PER_PAGE));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-sky-600 hover:text-sky-800 mb-4 font-semibold"
          >
            Retour
          </button>
          <h1 className="text-4xl font-bold text-sky-700 mb-2">
            Brouillon - Vérification Cartes
          </h1>
          <p className="text-gray-600">
            {classInfo?.code} | {students.length} élèves | {pages.length} page(s)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-4 mb-8 flex flex-wrap gap-3">
          <button
            onClick={handleExportPDF}
            disabled={generatingPDF || students.length === 0}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {generatingPDF ? 'Génération...' : 'Exporter PDF A4 Paysage'}
          </button>
          <button
            onClick={() => navigate(`/classes/${classId}/students`)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Gérer Élèves
          </button>
          <button
            onClick={fetchBrouillonData}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Rafraîchir
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">Aucun élève à afficher</p>
          </div>
        ) : (
          pages.map((pageStudents, pageIdx) => (
            <div key={pageIdx} className="mb-8">
              <div className="text-center text-gray-600 text-sm font-semibold mb-4">
                Page {pageIdx + 1}/{pages.length} - Format A4 Paysage (6 cartes)
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-2 gap-6">
                  {pageStudents.map((student, idx) => (
                    <div
                      key={student.id}
                      className="border-2 border-sky-300 rounded-lg p-4 bg-sky-50 hover:shadow-lg transition"
                    >
                      <div className="text-xs font-semibold text-gray-500 mb-2">
                        Carte {pageIdx * CARDS_PER_PAGE + idx + 1}
                      </div>

                      <div className="flex gap-4 bg-white p-3 rounded border border-gray-200 mb-3">
                        <div className="w-20 h-28 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center relative group">
                          {student.photo_path ? (
                            <>
                              <img
                                src={`${API_URL}/uploads/photos/${student.photo_path}`}
                                alt={student.nom}
                                className="w-full h-full object-cover rounded"
                              />
                              <label className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded transition">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePhotoChange(student.id, e.target.files[0])}
                                  className="hidden"
                                />
                                <span className="text-white text-xs font-semibold">Changer</span>
                              </label>
                            </>
                          ) : (
                            <label className="cursor-pointer text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoChange(student.id, e.target.files[0])}
                                className="hidden"
                              />
                              <div className="text-2xl">Photo</div>
                              <div className="text-xs text-gray-600">Ajouter</div>
                            </label>
                          )}
                        </div>

                        <div className="flex-1 text-sm">
                          <div className="mb-2">
                            <span className="font-semibold">MAT:</span> {student.matricule}
                          </div>
                          <div className="mb-2">
                            <span className="font-semibold">NOM:</span> {student.nom}
                          </div>
                          <div className="mb-2">
                            <span className="font-semibold">PRENOM:</span> {student.prenom}
                          </div>
                          <div className="mb-2">
                            <span className="font-semibold">CLASSE:</span> {classInfo?.code}
                          </div>
                          <div className="mb-2">
                            <span className="font-semibold">DATE NAISS:</span> {student.date_naissance}
                          </div>
                          <div>
                            <span className="font-semibold">NATIONALITÉ:</span> {student.nationalite}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditStudent(student)}
                        className="w-full bg-sky-500 hover:bg-sky-600 text-white text-sm px-3 py-1 rounded font-semibold"
                      >
                        Éditer Infos
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {pageIdx < pages.length - 1 && (
                <div className="my-8 text-center">
                  <div className="border-t-2 border-gray-400 pt-4">
                    <span className="bg-sky-50 px-4 py-2 text-gray-600 font-semibold">
                      Nouvelle Page
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-sky-700 mb-4">Éditer Élève</h2>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <input
                type="text"
                value={editData.matricule}
                disabled
                className="col-span-2 px-3 py-2 border rounded bg-gray-100 text-xs"
              />
              <input
                type="text"
                value={editData.nom}
                onChange={(e) => setEditData({ ...editData, nom: e.target.value })}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                placeholder="Nom"
              />
              <input
                type="text"
                value={editData.prenom}
                onChange={(e) => setEditData({ ...editData, prenom: e.target.value })}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                placeholder="Prénom"
              />
              <select
                value={editData.sexe || ''}
                onChange={(e) => setEditData({ ...editData, sexe: e.target.value })}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
              >
                <option value="">Sexe</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
              <input
                type="date"
                value={editData.date_naissance || ''}
                onChange={(e) => setEditData({ ...editData, date_naissance: e.target.value })}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
              />
              <input
                type="text"
                value={editData.lieu_naissance || ''}
                onChange={(e) => setEditData({ ...editData, lieu_naissance: e.target.value })}
                className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                placeholder="Lieu de naissance"
              />
              <input
                type="text"
                value={editData.nationalite || ''}
                onChange={(e) => setEditData({ ...editData, nationalite: e.target.value })}
                className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                placeholder="Nationalité"
              />
              <input
                type="tel"
                value={editData.telephone || ''}
                onChange={(e) => setEditData({ ...editData, telephone: e.target.value })}
                className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                placeholder="Téléphone"
              />
              <input
                type="text"
                value={editData.adresse || ''}
                onChange={(e) => setEditData({ ...editData, adresse: e.target.value })}
                className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                placeholder="Adresse"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold text-sm"
              >
                Sauver
              </button>
              <button
                onClick={() => setEditingStudent(null)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrouillonExport;
