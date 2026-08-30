import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { collegeAPI } from '../services/api';

const emptyForm = {
  nom: '', slogan: '', directeur_prenom: '', directeur_nom: '', directeur_sexe: '', directeur_contact: '', email: '', telephone: '',
};

export default function CollegeForm() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const deptFromUrl = searchParams.get('dept') || '';
  const communeFromUrl = searchParams.get('commune') || '';

  const [form, setForm] = useState(emptyForm);
  const [departement, setDepartement] = useState(deptFromUrl);
  const [commune, setCommune] = useState(communeFromUrl);
  const [signature, setSignature] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [loading, setLoading] = useState(!!collegeId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!collegeId;

  useEffect(() => {
    if (!collegeId) return;
    collegeAPI.getById(collegeId)
      .then(res => {
        const c = res.data;
        setForm({
          nom: c.nom || '',
          slogan: c.slogan || '',
          directeur_prenom: c.directeur_prenom || '',
          directeur_nom: c.directeur_nom || '',
          directeur_sexe: c.directeur_sexe || '',          
          directeur_contact: c.directeur_contact || '',
          email: c.email || '',
          telephone: c.telephone || '',
        });
        setDepartement(c.departement || '');
        setCommune(c.commune || '');
        if (c.signature_path) setSignaturePreview(`${import.meta.env.VITE_API_URL}/uploads/signatures/${c.signature_path.split(/[\\/]/).pop()}`);
      })
      .catch(() => setError('Erreur lors du chargement du collège'))
      .finally(() => setLoading(false));
  }, [collegeId]);

  const handleSignature = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('La signature doit être en PNG ou JPEG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La signature ne doit pas dépasser 2 Mo');
      return;
    }
    setError('');
    setSignature(file);
    const reader = new FileReader();
    reader.onloadend = () => setSignaturePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nom.trim()) return setError('Le nom du collège est requis');
    if (!form.directeur_prenom.trim() || !form.directeur_nom.trim()) return setError('Le prénom et le nom du directeur sont requis');
    if (!departement || !commune) return setError('Localisation manquante — revenez au dashboard');

    setSaving(true);
    try {
      let id = collegeId;
      const payload = { ...form, departement, commune };

      if (isEditing) {
        await collegeAPI.update(collegeId, payload);
      } else {
        const res = await collegeAPI.create(payload);
        id = res.data.id;
      }

      if (signature && id) {
        await collegeAPI.uploadSignature(id, signature);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Chargement</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <h1 className="text-xl font-semibold text-slate-800 mb-1">
          {isEditing ? 'Modifier le collège' : 'Nouveau collège'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {isEditing ? 'Mettez à jour les informations' : 'Ajoutez un établissement à la plateforme'}
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-800">
              {commune}, {departement}
            </span>
          </div>

          <Field label="Nom du collège" required>
            <input
              type="text"
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Collège Catholique Saint Joseph"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </Field>

          <Field label="Slogan (optionnel)">
            <input
              type="text"
              value={form.slogan}
              onChange={e => setForm({ ...form, slogan: e.target.value })}
              placeholder="Prière - Travail - Excellence"
              maxLength={150}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom du directeur" required>
              <input
                type="text"
                value={form.directeur_prenom}
                onChange={e => setForm({ ...form, directeur_prenom: e.target.value })}
                placeholder="Victor"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </Field>
            <Field label="Nom du directeur" required>
              <input
                type="text"
                value={form.directeur_nom}
                onChange={e => setForm({ ...form, directeur_nom: e.target.value })}
                placeholder="LAMODI"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </Field>
          <Field label="Civilité du directeur / de la directrice">
            <select
              value={form.directeur_sexe}
              onChange={e => setForm({ ...form, directeur_sexe: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Non renseigné</option>
              <option value="M">Monsieur (Directeur)</option>
              <option value="F">Madame (Directrice)</option>
            </select>
          </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email du directeur">
              <input
                type="email"
                value={form.directeur_contact}
                onChange={e => setForm({ ...form, directeur_contact: e.target.value })}
                placeholder="directeur@college.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </Field>
            <Field label="Téléphone">
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                placeholder="+229 97 268 741"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </Field>
          </div>

          <Field label="Email du collège">
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="contact@college.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </Field>

          <Field label="Signature du directeur (PNG/JPEG, 200×80px)">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleSignature}
              className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
            />
            {signaturePreview && (
              <div className="mt-3 border border-slate-200 rounded-lg p-3 bg-slate-50 inline-block">
                <img src={signaturePreview} alt="Signature" style={{ maxWidth: 200, maxHeight: 80 }} />
              </div>
            )}
          </Field>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              {saving ? 'Enregistrement' : isEditing ? 'Mettre à jour' : 'Créer le collège'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}