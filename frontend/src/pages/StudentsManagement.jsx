import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Upload, FileSpreadsheet, Image, Search,
  Pencil, Trash2, Loader2, Download, Check, X
} from 'lucide-react';
import { studentAPI, importAPI } from '../services/api';

const emptyStudent = {
  matricule: '', nom: '', prenom: '', sexe: 'M',
  date_naissance: '', lieu_naissance: '', nationalite: 'BENINOISE', adresse: '',
};

const TABS = [
  { key: 'list', label: 'Liste', icon: Search },
  { key: 'manual', label: 'Ajouter un élève', icon: Plus },
  { key: 'import', label: 'Import Excel', icon: FileSpreadsheet },
  { key: 'photos', label: 'Photos', icon: Image },
];

export default function StudentsManagement() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState('list');
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState(emptyStudent);
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [excelFile, setExcelFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [busy, setBusy] = useState(false);

  const [photoFiles, setPhotoFiles] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => { fetchStudents(); }, [classId]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getByClass(classId);
      setStudents(res.data?.students || []);
      setClassInfo(res.data?.classInfo || null);
    } catch {
      setError('Erreur lors du chargement des élèves');
    } finally {
      setLoading(false);
    }
  };

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      [s.matricule, s.nom, s.prenom].some(v => (v || '').toLowerCase().includes(q))
    );
  }, [students, search]);

  const resetForm = () => { setForm(emptyStudent); setPhoto(null); setEditingId(null); };

  const startEdit = (s) => {
    setForm({
      matricule: s.matricule,
      nom: s.nom || '',
      prenom: s.prenom || '',
      sexe: s.sexe || 'M',
      date_naissance: s.date_naissance ? s.date_naissance.split('T')[0] : '',
      lieu_naissance: s.lieu_naissance || '',
      nationalite: s.nationalite || '',
      adresse: s.adresse || '',
    });
    setEditingId(s.id);
    setPhoto(null);
    setTab('manual');
  };

  const submitStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await studentAPI.update(editingId, form);
        if (photo) await studentAPI.updatePhoto(editingId, photo);
        flash('Élève mis à jour');
      } else {
        await studentAPI.create(classId, form, photo);
        flash('Élève ajouté');
      }
      resetForm();
      await fetchStudents();
      setTab('list');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const removeStudent = async (s) => {
    if (!confirm(`Supprimer ${s.nom} ${s.prenom} (${s.matricule}) ?`)) return;
    try {
      await studentAPI.delete(s.id);
      await fetchStudents();
      flash('Élève supprimé');
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await importAPI.downloadTemplate();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_eleves.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors du téléchargement du template');
    }
  };

  const validateExcel = async () => {
    if (!excelFile) return;
    setError('');
    setBusy(true);
    try {
      const res = await importAPI.validateExcel(excelFile);
      setValidation(res.data);
      if (!res.data.valid) setError(`${res.data.errors.length} erreur(s) détectée(s)`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!validation?.data?.length) return;
    setBusy(true);
    try {
      const res = await importAPI.importStudents(classId, validation.data);
      flash(`${res.data.imported} élève(s) importé(s)`);
      if (res.data.errors?.length) setError(res.data.errors.join(' · '));
      setExcelFile(null);
      setValidation(null);
      await fetchStudents();
      setTab('list');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'import");
    } finally {
      setBusy(false);
    }
  };

  const uploadPhotos = async () => {
    if (!photoFiles.length) return;
    setBusy(true);
    setError('');
    let ok = 0;
    const orphelins = [];

    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const mat = file.name.replace(/\.[^.]+$/, '').trim().toUpperCase();
      const student = students.find(s => (s.matricule || '').toUpperCase() === mat);

      if (!student) { orphelins.push(file.name); }
      else {
        try {
          await studentAPI.updatePhoto(student.id, file);
          ok++;
        } catch {
          orphelins.push(file.name);
        }
      }
      setProgress(Math.round(((i + 1) / photoFiles.length) * 100));
    }

    flash(`${ok} photo(s) associée(s)`);
    if (orphelins.length) setError(`Sans correspondance : ${orphelins.join(', ')}`);
    setPhotoFiles([]);
    setProgress(0);
    setBusy(false);
    await fetchStudents();
  };

  const avecPhoto = students.filter(s => s.photo_path).length;

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <h1 className="text-lg font-semibold text-slate-800">{classInfo?.code || 'Classe'}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {students.length} élève{students.length > 1 ? 's' : ''} · {avecPhoto} avec photo
              </p>
            </div>

            <div className="flex gap-1">
              {TABS.map(t => {
                const Icon = t.icon;
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setError(''); if (t.key !== 'manual') resetForm(); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      on ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            <X className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="cursor-pointer shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {notice && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
            <Check className="w-4 h-4" />
            {notice}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Chargement</span>
          </div>
        ) : (
          <>
            {tab === 'list' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative mr-auto">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Matricule, nom, prénom"
                      className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => { resetForm(); setTab('manual'); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un élève
                  </button>
                </div>

                {!visibles.length ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                    <p className="text-sm text-slate-500">
                      {search ? 'Aucun résultat.' : 'Aucun élève dans cette classe.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-left text-xs font-medium text-slate-500">
                          <th className="px-4 py-3">Matricule</th>
                          <th className="px-4 py-3">Nom</th>
                          <th className="px-4 py-3">Prénom(s)</th>
                          <th className="px-4 py-3">Sexe</th>
                          <th className="px-4 py-3">Naissance</th>
                          <th className="px-4 py-3">Photo</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibles.map(s => (
                          <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-medium text-slate-800">{s.matricule}</td>
                            <td className="px-4 py-3 text-slate-700">{s.nom}</td>
                            <td className="px-4 py-3 text-slate-700">{s.prenom}</td>
                            <td className="px-4 py-3 text-slate-600">{s.sexe}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {s.date_naissance ? s.date_naissance.split('T')[0] : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                s.photo_path ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {s.photo_path ? 'OK' : 'Manquante'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => startEdit(s)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                                  title="Modifier"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => removeStudent(s)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'manual' && (
              <form onSubmit={submitStudent} className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl">
                <h2 className="text-sm font-semibold text-slate-800 mb-5">
                  {editingId ? 'Modifier l\'élève' : 'Nouvel élève'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <Input
                    label="Matricule" required disabled={!!editingId}
                    value={form.matricule}
                    onChange={v => setForm({ ...form, matricule: v })}
                    placeholder="MAT001"
                  />
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Sexe</label>
                    <select
                      value={form.sexe}
                      onChange={e => setForm({ ...form, sexe: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <Input label="Nom" required value={form.nom}
                    onChange={v => setForm({ ...form, nom: v })} placeholder="HOUNDNJE" />
                  <Input label="Prénom(s)" required value={form.prenom}
                    onChange={v => setForm({ ...form, prenom: v })} placeholder="Oswell Séwanu" />
                  <Input label="Date de naissance" type="date" value={form.date_naissance}
                    onChange={v => setForm({ ...form, date_naissance: v })} />
                  <Input label="Lieu de naissance" value={form.lieu_naissance}
                    onChange={v => setForm({ ...form, lieu_naissance: v })} placeholder="Cotonou" />
                  <Input label="Nationalité" value={form.nationalite}
                    onChange={v => setForm({ ...form, nationalite: v })} placeholder="BENINOISE" />
                  <Input label="Adresse" value={form.adresse}
                    onChange={v => setForm({ ...form, adresse: v })} placeholder="Akpakpa, Cotonou" />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Photo {editingId ? '(laisser vide pour conserver)' : '(optionnel)'}
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={e => setPhoto(e.target.files[0] || null)}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
                  >
                    {saving ? 'Enregistrement' : editingId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setTab('list'); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {tab === 'import' && (
              <div className="max-w-3xl space-y-4">
                <Card>
                  <p className="text-sm text-slate-700 mb-1 font-medium">1. Télécharger le modèle</p>
                  <p className="text-xs text-slate-500 mb-4">
                    Huit colonnes : matricule, nom, prénom, sexe, date de naissance, lieu, nationalité, adresse.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Template Excel
                  </button>
                </Card>

                <Card>
                  <p className="text-sm text-slate-700 mb-4 font-medium">2. Charger le fichier rempli</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={e => { setExcelFile(e.target.files[0] || null); setValidation(null); }}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
                  />
                  {excelFile && (
                    <button
                      onClick={validateExcel}
                      disabled={busy}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
                    >
                      {busy ? 'Vérification' : 'Vérifier le fichier'}
                    </button>
                  )}
                </Card>

                {validation && (
                  <Card>
                    <p className="text-sm text-slate-700 mb-3 font-medium">3. Importer</p>
                    <p className="text-sm text-slate-600 mb-3">
                      {validation.totalRows} ligne(s) valide(s)
                      {validation.errors?.length ? `, ${validation.errors.length} erreur(s)` : ''}
                    </p>
                    {validation.errors?.length > 0 && (
                      <ul className="mb-4 max-h-40 overflow-y-auto text-xs text-rose-600 space-y-1">
                        {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                    <button
                      onClick={runImport}
                      disabled={busy || !validation.data?.length}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {busy ? 'Import en cours' : `Importer ${validation.data?.length || 0} élève(s)`}
                    </button>
                  </Card>
                )}
              </div>
            )}

            {tab === 'photos' && (
              <div className="max-w-3xl space-y-4">
                <Card>
                  <p className="text-sm text-slate-700 mb-1 font-medium">Nommer les fichiers</p>
                  <p className="text-xs text-slate-500 mb-4">
                    Chaque photo doit porter le matricule de l'élève comme nom de fichier : MAT001.jpg, MAT002.jpg.
                    L'association est automatique. Sélectionnez le dossier entier d'un coup.
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    onChange={e => setPhotoFiles(Array.from(e.target.files))}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
                  />
                </Card>

                {photoFiles.length > 0 && (
                  <Card>
                    <p className="text-sm text-slate-700 mb-3 font-medium">
                      {photoFiles.length} fichier(s) sélectionné(s)
                    </p>

                    {progress > 0 && (
                      <div className="mb-4">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{progress}%</p>
                      </div>
                    )}

                    <button
                      onClick={uploadPhotos}
                      disabled={busy}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {busy ? 'Envoi en cours' : 'Associer les photos'}
                    </button>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, required, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:text-slate-400"
      />
    </div>
  );
}

function Card({ children }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-5">{children}</div>;
}