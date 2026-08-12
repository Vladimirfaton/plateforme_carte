import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const CollegeForm = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const deptFromUrl = searchParams.get('dept') || '';
  const communeFromUrl = searchParams.get('commune') || '';

  const [formData, setFormData] = useState({
    nom: '',
    departement: deptFromUrl,
    commune: communeFromUrl,
    directeur_nom: '',
    directeur_contact: '',
    email: '',
    telephone: ''
  });

  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const token = localStorage.getItem('token');

  // Fetch college data if editing
  useEffect(() => {
    if (collegeId) {
      const fetchCollege = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `${API_URL}/colleges`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const college = response.data.find(c => c.id === collegeId);
          if (college) {
            setFormData({
              nom: college.nom || '',
              departement: college.departement || '',
              commune: college.commune || '',
              directeur_nom: college.directeur_nom || '',
              directeur_contact: college.directeur_contact || '',
              email: college.email || '',
              telephone: college.telephone || ''
            });
            if (college.signature_path) {
              setSignaturePreview(college.signature_path);
            }
            setIsEditing(true);
          }
        } catch (err) {
          console.error('Error fetching college:', err);
          setError('Erreur lors du chargement du collège');
        } finally {
          setLoading(false);
        }
      };
      fetchCollege();
    }
  }, [collegeId, API_URL, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        setError('La signature doit être en PNG ou JPEG');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('La signature ne doit pas dépasser 2MB');
        return;
      }
      setSignature(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nom.trim()) {
      setError('Le nom du collège est requis');
      return;
    }
    if (!formData.departement) {
      setError('Le département est requis');
      return;
    }
    if (!formData.commune) {
      setError('La commune est requise');
      return;
    }
    if (!formData.directeur_nom.trim()) {
      setError('Le nom du directeur est requis');
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await axios.put(
          `${API_URL}/colleges/${collegeId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/colleges`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (signature) {
        const collegeId2 = collegeId || (await axios.get(`${API_URL}/colleges`, {
          headers: { Authorization: `Bearer ${token}` }
        })).data[0]?.id;

        const formDataSig = new FormData();
        formDataSig.append('signature', signature);

        await axios.post(
          `${API_URL}/colleges/${collegeId2 || collegeId}/signature`,
          formDataSig,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSuccess(isEditing ? 'Collège mis à jour' : 'Collège créé');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error saving college:', err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sky-600 hover:text-sky-800 mb-4 font-semibold"
          >
            Retour au dashboard
          </button>
          <h1 className="text-4xl font-bold text-sky-700 mb-2">
            {isEditing ? 'Éditer Collège' : 'Créer un Collège'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Modifiez les informations du collège' : 'Ajoutez un nouveau collège'}
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

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Info (Read-only) */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Localisation sélectionnée:</strong> {formData.commune}, {formData.departement}
              </p>
            </div>

            {/* Nom Collège */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du Collège (requis)
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Collège Catholique Ste Cécile"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            {/* Directeur Nom */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du Directeur (requis)
              </label>
              <input
                type="text"
                name="directeur_nom"
                value={formData.directeur_nom}
                onChange={handleInputChange}
                placeholder="Victor O. LAMODI"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            {/* Directeur Contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email du Directeur
              </label>
              <input
                type="email"
                name="directeur_contact"
                value={formData.directeur_contact}
                onChange={handleInputChange}
                placeholder="directeur@college.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            {/* Email Collège */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email du Collège
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@college.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="+229 97 268 741"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            {/* Signature Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Signature du Directeur (PNG/JPEG, 200×80px)
              </label>
              <div className="border-2 border-dashed border-sky-300 rounded-lg p-6 text-center cursor-pointer hover:border-sky-500 transition">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleSignatureChange}
                  className="hidden"
                  id="signature-input"
                />
                <label htmlFor="signature-input" className="cursor-pointer">
                  <div className="text-2xl mb-2">Signature</div>
                  <p className="text-gray-600">Cliquez pour uploader la signature</p>
                  <p className="text-sm text-gray-500 mt-1">PNG ou JPEG, max 2MB</p>
                </label>
              </div>

              {signaturePreview && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Aperçu:</p>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      style={{ maxWidth: '200px', maxHeight: '80px' }}
                      className="mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer Collège')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollegeForm;
