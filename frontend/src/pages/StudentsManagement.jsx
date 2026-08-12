import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentsManagement = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('list'); // 'list', 'import', 'photos'
  
  // Import Excel states
  const [excelFile, setExcelFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importingData, setImportingData] = useState([]);

  // Photo upload states
  const [photoFiles, setPhotoFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit modal states
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/students/class/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(response.data.students || []);
      if (response.data.classInfo) {
        setClassInfo(response.data.classInfo);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Erreur lors du chargement des élèves');
    } finally {
      setLoading(false);
    }
  };

  // Download Excel template
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/students/import/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_eleves.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      setSuccess('Template téléchargé ✅');
    } catch (err) {
      console.error('Error downloading template:', err);
      setError('Erreur lors du téléchargement du template');
    }
  };

  // Handle Excel file selection
  const handleExcelChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
      }
      setExcelFile(file);
      setError('');
      setValidationResult(null);
    }
  };

  // Validate Excel file
  const handleValidateExcel = async () => {
    if (!excelFile) {
      setError('Veuillez sélectionner un fichier Excel');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await axios.post(
        `${API_URL}/students/import/validate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setValidationResult(response.data);
      if (response.data.valid) {
        setImportingData(response.data.data);
        setSuccess(`✅ ${response.data.data.length} élèves validés, prêts à importer`);
      } else {
        setError(`❌ Validation échouée: ${response.data.message}`);
      }
    } catch (err) {
      console.error('Error validating excel:', err);
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  // Import students from validated data
  const handleImportStudents = async () => {
    if (importingData.length === 0) {
      setError('Aucune donnée à importer');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/students/${classId}/import`,
        { data: importingData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`✅ ${response.data.imported} élèves importés avec succès!`);
      setExcelFile(null);
      setValidationResult(null);
      setImportingData([]);
      setTab('list');
      await fetchStudents();
    } catch (err) {
      console.error('Error importing students:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'importation');
    } finally {
      setLoading(false);
    }
  };

  // Handle photo files drop
  const handlePhotosDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePhotosDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    setPhotoFiles(files);
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotoFiles(files);
  };

  // Upload photos
  const handleUploadPhotos = async () => {
    if (photoFiles.length === 0) {
      setError('Veuillez sélectionner des photos');
      return;
    }

    try {
      setLoading(true);
      let uploaded = 0;

      for (const file of photoFiles) {
        // Extract matricule from filename (e.g., MAT001.jpg)
        const filename = file.name.split('.')[0];
        const student = students.find(s => s.matricule.toUpperCase() === filename.toUpperCase());

        if (student) {
          const formData = new FormData();
          formData.append('photo', file);

          await axios.put(
            `${API_URL}/students/${student.id}/photo`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          uploaded++;
        }

        setUploadProgress(Math.round((uploaded / photoFiles.length) * 100));
      }

      setSuccess(`✅ ${uploaded} photos uploadées sur ${photoFiles.length}`);
      setPhotoFiles([]);
      setUploadProgress(0);
      await fetchStudents();
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError('Erreur lors de l\'upload des photos');
    } finally {
      setLoading(false);
    }
  };

  // Edit student
  const handleEditStudent = (student) => {
    setEditingStudent(student.id);
    setEditFormData({
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
        `${API_URL}/students/${editingStudent}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('✅ Élève modifié avec succès');
      setEditingStudent(null);
      await fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élève?')) return;

    try {
      setLoading(true);
      await axios.delete(
        `${API_URL}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('✅ Élève supprimé');
      await fetchStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-sky-600 hover:text-sky-800 mb-4 font-semibold"
          >
            ← Retour
          </button>
          <h1 className="text-4xl font-bold text-sky-700">
            👥 Gestion des Élèves
          </h1>
          {classInfo && (
            <p className="text-gray-600 mt-2">
              Classe: {classInfo.code} • Collectif effectif: {students.length}
            </p>
          )}
        </div>

        {/* Alert Messages */}
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300">
          <button
            onClick={() => setTab('list')}
            className={`px-6 py-3 font-semibold transition ${
              tab === 'list'
                ? 'border-b-4 border-sky-500 text-sky-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Liste ({students.length})
          </button>
          <button
            onClick={() => setTab('import')}
            className={`px-6 py-3 font-semibold transition ${
              tab === 'import'
                ? 'border-b-4 border-sky-500 text-sky-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📥 Importer Excel
          </button>
          <button
            onClick={() => setTab('photos')}
            className={`px-6 py-3 font-semibold transition ${
              tab === 'photos'
                ? 'border-b-4 border-sky-500 text-sky-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📷 Upload Photos
          </button>
        </div>

        {/* TAB 1: Liste des élèves */}
        {tab === 'list' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Aucun élève pour cette classe</p>
                <button
                  onClick={() => setTab('import')}
                  className="mt-4 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg"
                >
                  Importer les premiers élèves
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-sky-100 text-sky-800">
                    <tr>
                      <th className="text-left px-4 py-3">Matricule</th>
                      <th className="text-left px-4 py-3">Nom Prénom</th>
                      <th className="text-left px-4 py-3">Date Naiss.</th>
                      <th className="text-left px-4 py-3">Nationalité</th>
                      <th className="text-left px-4 py-3">Photo</th>
                      <th className="text-center px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id} className="border-b hover:bg-sky-50 transition">
                        <td className="px-4 py-3 font-semibold">{student.matricule}</td>
                        <td className="px-4 py-3">{student.nom} {student.prenom}</td>
                        <td className="px-4 py-3">{student.date_naissance}</td>
                        <td className="px-4 py-3">{student.nationalite}</td>
                        <td className="px-4 py-3">
                          {student.photo_path ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-gray-400">❌</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Éditer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Import Excel */}
        {tab === 'import' && (
          <div className="space-y-6">
            {/* Step 1: Download Template */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-sky-700 mb-4">📥 Étape 1: Télécharger Template</h2>
              <p className="text-gray-600 mb-4">
                Téléchargez le modèle Excel vierge avec les 9 colonnes requises:
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Photo | Matricule | Nom | Prénom(s) | Sexe | Date Naiss | Lieu Naiss | Nationalité | Adresse
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                ⬇️ Télécharger Template
              </button>
            </div>

            {/* Step 2: Upload Excel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-sky-700 mb-4">📥 Étape 2: Upload Fichier Complété</h2>
              <div className="border-2 border-dashed border-sky-300 rounded-lg p-8 text-center cursor-pointer hover:border-sky-500 transition">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelChange}
                  className="hidden"
                  id="excel-input"
                />
                <label htmlFor="excel-input" className="cursor-pointer">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600">Cliquez pour sélectionner le fichier Excel</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {excelFile ? excelFile.name : 'Ou glissez-déposez ici'}
                  </p>
                </label>
              </div>

              {excelFile && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  ✅ Fichier sélectionné: {excelFile.name}
                </div>
              )}
            </div>

            {/* Step 3: Validate & Import */}
            {excelFile && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-sky-700 mb-4">✅ Étape 3: Valider & Importer</h2>
                <button
                  onClick={handleValidateExcel}
                  disabled={loading}
                  className="bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold mb-4"
                >
                  {loading ? '⏳ Validation...' : '🔍 Valider le Fichier'}
                </button>

                {validationResult && validationResult.valid && (
                  <>
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                      ✅ {validationResult.data.length} élèves prêts à importer
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto mb-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="text-left px-2 py-1">Matricule</th>
                            <th className="text-left px-2 py-1">Nom</th>
                            <th className="text-left px-2 py-1">Prénom</th>
                            <th className="text-left px-2 py-1">Date Naiss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationResult.data.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">{row.matricule}</td>
                              <td className="px-2 py-1">{row.nom}</td>
                              <td className="px-2 py-1">{row.prenom}</td>
                              <td className="px-2 py-1">{row.date_naissance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {validationResult.data.length > 10 && (
                        <p className="text-center text-gray-500 mt-2">
                          ... et {validationResult.data.length - 10} autres
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleImportStudents}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold w-full"
                    >
                      {loading ? '⏳ Import...' : '✅ Importer les Élèves'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Upload Photos */}
        {tab === 'photos' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-sky-700 mb-4">📷 Upload des Photos</h2>
            <p className="text-gray-600 mb-4">
              Renommez les photos avec le matricule (ex: MAT001.jpg) puis uploadez-les
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={handlePhotosDragOver}
              onDrop={handlePhotosDrop}
              className="border-2 border-dashed border-sky-300 rounded-lg p-8 text-center cursor-pointer hover:border-sky-500 transition mb-6"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotosChange}
                className="hidden"
                id="photos-input"
              />
              <label htmlFor="photos-input" className="cursor-pointer">
                <div className="text-5xl mb-2">📸</div>
                <p className="text-gray-600 font-semibold">Glissez-déposez les photos ici</p>
                <p className="text-sm text-gray-500 mt-1">
                  Ou cliquez pour sélectionner les fichiers
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {photoFiles.length > 0 && (
              <div className="mb-6">
                <p className="font-semibold text-gray-700 mb-2">
                  📁 {photoFiles.length} photo(s) sélectionnée(s):
                </p>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto mb-4">
                  {Array.from(photoFiles).map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">Progression:</span>
                      <span className="text-sm">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUploadPhotos}
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  {loading ? '⏳ Upload...' : `📤 Upload ${photoFiles.length} Photo(s)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {editingStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold text-sky-700 mb-4">✏️ Éditer Élève</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <input
                  type="text"
                  value={editFormData.matricule}
                  disabled
                  className="col-span-2 px-3 py-2 border rounded bg-gray-100"
                  placeholder="Matricule"
                />
                <input
                  type="text"
                  value={editFormData.nom}
                  onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Nom"
                />
                <input
                  type="text"
                  value={editFormData.prenom}
                  onChange={(e) => setEditFormData({ ...editFormData, prenom: e.target.value })}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Prénom"
                />
                <select
                  value={editFormData.sexe || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, sexe: e.target.value })}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Sexe</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                <input
                  type="date"
                  value={editFormData.date_naissance || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, date_naissance: e.target.value })}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={editFormData.lieu_naissance || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, lieu_naissance: e.target.value })}
                  className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Lieu de naissance"
                />
                <input
                  type="text"
                  value={editFormData.nationalite || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nationalite: e.target.value })}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Nationalité"
                />
                <input
                  type="tel"
                  value={editFormData.telephone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Téléphone"
                />
                <input
                  type="text"
                  value={editFormData.adresse || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                  className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Adresse"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold"
                >
                  💾 Sauver
                </button>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold"
                >
                  ❌ Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsManagement;
