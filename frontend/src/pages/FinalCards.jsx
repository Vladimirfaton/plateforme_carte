import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generateFinalCardsPDF, generateFinalCardsImages } from '../utils/pdfUtils';

const FinalCards = () => {
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
  
  // Generation states
  const [generatingCards, setGeneratingCards] = useState(false);
  const [generationFormat, setGenerationFormat] = useState('pdf'); // 'pdf' or 'jpg'
  const [previewStudent, setPreviewStudent] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchCardsData();
  }, [classId]);

  const fetchCardsData = async () => {
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
      console.error('Error fetching cards data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCards = async () => {
    if (students.length === 0) {
      setError('Aucun élève à générer');
      return;
    }

    try {
      setGeneratingCards(true);

      if (generationFormat === 'pdf') {
        await generateFinalCardsPDF(students, classInfo, collegeInfo);
      } else {
        await generateFinalCardsImages(students, classInfo, collegeInfo);
      }

      setSuccess(`✅ Cartes générées et téléchargées (${generationFormat.toUpperCase()})!`);
    } catch (err) {
      console.error('Error generating cards:', err);
      setError('Erreur lors de la génération des cartes');
    } finally {
      setGeneratingCards(false);
    }
  };

  const currentStudent = students[previewStudent];

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-sky-600 hover:text-sky-800 mb-4 font-semibold"
          >
            ← Retour
          </button>
          <h1 className="text-4xl font-bold text-sky-700 mb-2">
            🎫 Générer Cartes Finales
          </h1>
          <p className="text-gray-600">
            {classInfo?.code} • {students.length} élèves • Format ISO ID-1 (85.6×53.98mm)
          </p>
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

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📋 Format d'Export
              </label>
              <div className="flex gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="pdf"
                    checked={generationFormat === 'pdf'}
                    onChange={(e) => setGenerationFormat(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">📄 PDF (Recto/Verso)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="jpg"
                    checked={generationFormat === 'jpg'}
                    onChange={(e) => setGenerationFormat(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">🖼️ JPG (300 DPI)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ℹ️ PDF idéal pour impression. JPG pour prévisualisation.
              </p>
            </div>

            {/* Specs Info */}
            <div className="bg-sky-50 border border-sky-200 rounded p-4">
              <p className="text-sm font-semibold text-sky-800 mb-2">📏 Spécifications</p>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• Format: ISO ID-1</div>
                <div>• Dimensions: 85.6 × 53.98 mm</div>
                <div>• Numériques: 1012 × 638 px</div>
                <div>• Résolution: 300 DPI</div>
                <div>• Colorimétrie: CMYK</div>
                <div>• Fonds perdus: 2mm</div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <button
              onClick={handleGenerateCards}
              disabled={generatingCards || students.length === 0}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold text-lg"
            >
              {generatingCards
                ? '⏳ Génération en cours...'
                : `🖨️ Générer Cartes (${students.length} cartes)`}
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && currentStudent && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-sky-700">
                👁️ Aperçu Carte #{previewStudent + 1}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            {/* Card Preview (1012×638px displayed at smaller scale) */}
            <div className="flex gap-8 overflow-x-auto pb-4">
              {/* Recto */}
              <div className="flex-shrink-0">
                <div className="text-sm font-semibold text-gray-700 mb-2">Recto</div>
                <div
                  className="bg-white border-4 border-gray-300 flex"
                  style={{
                    width: '300px',
                    aspectRatio: '1012/638',
                    transform: 'scale(0.3)',
                    transformOrigin: 'top left'
                  }}
                >
                  {/* Photo side */}
                  <div className="w-1/3 bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {currentStudent.photo_path ? (
                      <img
                        src={`${API_URL}/uploads/photos/${currentStudent.photo_path}`}
                        alt="Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <div className="text-4xl">📸</div>
                        <div>Pas de photo</div>
                      </div>
                    )}
                  </div>

                  {/* Info side */}
                  <div className="flex-1 bg-white p-12 flex flex-col justify-center text-sm">
                    <div className="mb-4">
                      <div className="text-xs text-gray-500">MATRICULE</div>
                      <div className="font-bold text-base">{currentStudent.matricule}</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs text-gray-500">NOM</div>
                      <div className="font-bold">{currentStudent.nom}</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs text-gray-500">PRÉNOM</div>
                      <div className="font-bold">{currentStudent.prenom}</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs text-gray-500">CLASSE</div>
                      <div className="font-bold">{classInfo?.code}</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs text-gray-500">DATE NAISS.</div>
                      <div className="text-sm">{currentStudent.date_naissance}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">NATIONALITÉ</div>
                      <div className="text-sm">{currentStudent.nationalite}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verso */}
              <div className="flex-shrink-0">
                <div className="text-sm font-semibold text-gray-700 mb-2">Verso</div>
                <div
                  className="bg-white border-4 border-gray-300 flex flex-col items-center justify-center p-8"
                  style={{
                    width: '300px',
                    aspectRatio: '1012/638',
                    transform: 'scale(0.3)',
                    transformOrigin: 'top left'
                  }}
                >
                  <div className="text-center text-xs">
                    <div className="font-bold text-sm mb-2">
                      {collegeInfo?.nom || 'ÉTABLISSEMENT'}
                    </div>
                    <div className="text-xs mb-4">
                      {collegeInfo?.commune}, {collegeInfo?.departement}
                    </div>

                    {collegeInfo?.signature_path && (
                      <div className="my-3">
                        <div className="text-xs text-gray-600 mb-1">Signature</div>
                        <div className="h-6 bg-gray-100 rounded flex items-center justify-center text-xs">
                          [Signature]
                        </div>
                      </div>
                    )}

                    <div className="my-3 inline-block">
                      <div className="text-xs text-gray-600 mb-1">QR Code</div>
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs">
                        QR
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-3">
                      Réalisé par FVS
                      <br />
                      contact@fvs.com
                      <br />
                      +229 97 268 741
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPreviewStudent(Math.max(0, previewStudent - 1))}
                disabled={previewStudent === 0}
                className="bg-gray-400 hover:bg-gray-500 disabled:bg-gray-200 text-white px-4 py-2 rounded"
              >
                ← Précédent
              </button>
              <span className="text-gray-700 font-semibold">
                Élève {previewStudent + 1} / {students.length}
              </span>
              <button
                onClick={() => setPreviewStudent(Math.min(students.length - 1, previewStudent + 1))}
                disabled={previewStudent === students.length - 1}
                className="bg-gray-400 hover:bg-gray-500 disabled:bg-gray-200 text-white px-4 py-2 rounded"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Résumé</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-sky-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-sky-700">{students.length}</div>
              <div className="text-xs text-gray-600">Élèves</div>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-green-700">
                {students.filter(s => s.photo_path).length}
              </div>
              <div className="text-xs text-gray-600">Photos</div>
            </div>
            <div className="bg-orange-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-orange-700">
                {students.filter(s => !s.photo_path).length}
              </div>
              <div className="text-xs text-gray-600">Sans photo</div>
            </div>
            <div className="bg-purple-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-purple-700">1012×638</div>
              <div className="text-xs text-gray-600">Pixels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalCards;
