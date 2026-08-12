import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, FileText, CreditCard, LogOut, Trash2, Search,
  Users, School, IdCard, ChevronRight, Plus, Pencil, ArrowLeft, Loader2
} from 'lucide-react';
import api, { collegeAPI, classAPI, studentAPI } from '../services/api';

const TABS = [
  { key: 'colleges', label: 'Collèges', icon: Building2 },
  { key: 'brouillon', label: 'Brouillon', icon: FileText },
  { key: 'cartes', label: 'Cartes finales', icon: CreditCard },
];

const NIVEAU_ORDRE = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle', 'Terminale'];

const rangNiveau = (niveau = '') => {
  const n = niveau.trim().toLowerCase();
  const i = NIVEAU_ORDRE.findIndex(x => x.toLowerCase() === n);
  return i === -1 ? 999 : i;
};

const trierClasses = (list) =>
  [...list].sort((a, b) => {
    const ra = rangNiveau(a.niveau);
    const rb = rangNiveau(b.niveau);
    if (ra !== rb) return ra - rb;
    if (ra === 999 && a.niveau !== b.niveau) {
      return a.niveau.localeCompare(b.niveau, 'fr');
    }
    return (a.serie || '').localeCompare(b.serie || '', 'fr', { numeric: true });
  });

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('colleges');
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedDept, setSelectedDept] = useState('Littoral');
  const [selectedCommune, setSelectedCommune] = useState('Cotonou');

  const [colleges, setColleges] = useState([]);
  const [activeCollege, setActiveCollege] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [students, setStudents] = useState([]);

  const [stats, setStats] = useState({ colleges: 0, students: 0, cards: 0 });

  useEffect(() => {
    api.get('/locations/departements')
      .then(r => setDepartments(r.data || []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    api.get(`/locations/communes/${selectedDept}`)
      .then(r => {
        const list = r.data || [];
        setCommunes(list);
        if (list.length) setSelectedCommune(list[0]);
      })
      .catch(() => setCommunes([]));
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedCommune || !selectedDept) return;
    loadColleges();
  }, [selectedCommune, selectedDept]);

  const loadColleges = async () => {
    setLoading(true);
    try {
      const r = await collegeAPI.getByCommune(selectedCommune, selectedDept);
      const list = r.data || [];
      setColleges(list);
      setStats({
        colleges: list.length,
        students: list.reduce((s, c) => s + (c.students_count || 0), 0),
        cards: list.reduce((s, c) => s + (c.cards_generated || 0), 0),
      });
    } catch {
      setColleges([]);
      setStats({ colleges: 0, students: 0, cards: 0 });
    } finally {
      setLoading(false);
    }
  };

  const openCollege = async (college) => {
    setActiveCollege(college);
    setActiveClass(null);
    setStudents([]);
    setLoading(true);
    try {
      const res = await classAPI.getByCollege(college.id);
      setClasses(trierClasses(res.data || []));
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const openClass = async (cls) => {
    setActiveClass(cls);
    setLoading(true);
    try {
      const r = await studentAPI.getByClass(cls.id);
      setStudents(r.data?.students || r.data || []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (activeClass) { setActiveClass(null); setStudents([]); }
    else if (activeCollege) { setActiveCollege(null); setClasses([]); }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <IdCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">FVS</h1>
              <p className="text-xs text-slate-500">Gestion complète des cartes d'identité scolaires</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </header>

      <div className="sticky top-[73px] z-20 bg-[#f7faf8] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <StatCard icon={School} label="Collèges" value={stats.colleges} color="emerald" />
            <StatCard icon={Users} label="Élèves" value={stats.students} color="cyan" />
            <StatCard icon={CreditCard} label="Cartes générées" value={stats.cards} color="violet" />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              const on = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition cursor-pointer ${
                    on ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'colleges' && !activeCollege && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Field label="Département">
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Commune">
                <select
                  value={selectedCommune}
                  onChange={e => setSelectedCommune(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {communes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <button
                onClick={() => navigate(`/colleges/new?dept=${selectedDept}&commune=${selectedCommune}`)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nouveau collège
              </button>
            </div>
          </div>
        )}

        {activeTab === 'colleges' && activeCollege && (
          <div className="flex items-center gap-2 mb-5 text-sm">
            <button onClick={goBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-medium">{activeCollege.nom}</span>
            {activeClass && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-700 font-medium">{activeClass.code}</span>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Chargement</span>
          </div>
        ) : (
          <>
            {activeTab === 'colleges' && !activeCollege && (
              <CollegeGrid
                colleges={colleges}
                onOpen={openCollege}
                onEdit={id => navigate(`/colleges/${id}/edit`)}
                onCreate={() => navigate(`/colleges/new?dept=${selectedDept}&commune=${selectedCommune}`)}
              />
            )}

            {activeTab === 'colleges' && activeCollege && !activeClass && (
              <ClassGrid
                classes={classes}
                onOpen={openClass}
                collegeId={activeCollege.id}
                collegeNom={activeCollege.nom}
                onRefresh={() => openCollege(activeCollege)}
              />
            )}

            {activeTab === 'colleges' && activeClass && (
              <StudentTable students={students} cls={activeClass} navigate={navigate} />
            )}

            {activeTab === 'brouillon' && (
              <Panel><p className="text-sm text-slate-500">Ouvrez une classe depuis l'onglet Collèges pour générer son brouillon.</p></Panel>
            )}

            {activeTab === 'cartes' && (
              <Panel><p className="text-sm text-slate-500">Ouvrez une classe depuis l'onglet Collèges pour générer ses cartes.</p></Panel>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const COLORS = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
};

function StatCard({ icon: Icon, label, value, color }) {
  const c = COLORS[color];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="text-2xl font-semibold text-slate-800 leading-tight">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Panel({ children }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">{children}</div>;
}

function CollegeGrid({ colleges, onOpen, onEdit, onCreate }) {
  if (!colleges.length) {
    return (
      <Panel>
        <p className="text-sm text-slate-500 mb-4">Aucun collège pour cette localisation.</p>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium cursor-pointer"
        >
          Créer le premier collège
        </button>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {colleges.map(c => (
        <div
          key={c.id}
          onClick={() => onOpen(c)}
          className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <School className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition">{c.nom}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{c.commune}, {c.departement}</p>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onEdit(c.id); }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
              title="Modifier"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pl-12">
            <div>Directeur : {c.directeur_nom || '—'}</div>
            <div>Téléphone : {c.telephone || '—'}</div>
          </div>

          <div className="flex items-center gap-1 mt-4 pl-12 text-xs font-medium text-emerald-700">
            Voir les classes
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassGrid({ classes, onOpen, collegeId, collegeNom, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ niveau: '', serie: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const reset = () => {
    setForm({ niveau: '', serie: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const openCreate = () => {
    setForm({ niveau: '', serie: '' });
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (cls) => {
    setForm({ niveau: cls.niveau, serie: cls.serie });
    setEditingId(cls.id);
    setError('');
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) await classAPI.update(editingId, form);
      else await classAPI.create(collegeId, form);
      reset();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cls) => {
    if (!confirm(`Supprimer la classe ${cls.code} et tous ses élèves ?`)) return;
    try {
      await classAPI.delete(cls.id);
      onRefresh();
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const q = search.trim().toLowerCase();
  const visibles = q ? classes.filter(c => (c.code || '').toLowerCase().includes(q)) : classes;

  return (
    <div>
      <div className="sticky top-[233px] z-10 -mx-6 px-6 py-3 bg-[#f7faf8] border-b border-slate-200 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-auto min-w-0">
            <School className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-slate-800 truncate">{collegeNom}</span>
            <span className="text-xs text-slate-400 shrink-0">
              {classes.length} classe{classes.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une classe"
              className="w-52 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={showForm ? reset : openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Fermer' : 'Créer une classe'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-emerald-200 rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            {editingId ? 'Modifier la classe' : 'Nouvelle classe'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Classe</label>
              <input
                type="text"
                autoFocus
                placeholder="6ème, 3ème, Tle..."
                value={form.niveau}
                onChange={e => setForm({ ...form, niveau: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Série</label>
              <input
                type="text"
                placeholder="A, B, M2, D..."
                value={form.serie}
                onChange={e => setForm({ ...form, serie: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {(form.niveau || form.serie) && (
            <p className="text-xs text-slate-500 mb-4">
              Sera enregistrée sous :{' '}
              <span className="font-medium text-slate-700">
                {form.niveau}-{form.serie.toUpperCase()}
              </span>
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              {saving ? 'Enregistrement' : editingId ? 'Enregistrer' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {!visibles.length ? (
        <Panel>
          <p className="text-sm text-slate-500">
            {q ? `Aucune classe ne correspond à « ${search} ».` : 'Aucune classe dans ce collège.'}
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibles.map(cls => (
            <div
              key={cls.id}
              onClick={() => onOpen(cls)}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-5 cursor-pointer transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-base font-semibold text-slate-800 group-hover:text-emerald-700 transition">
                  {cls.code}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(cls); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                    title="Modifier"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); remove(cls); }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {cls.effectif ?? 0} élèves
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentTable({ students, cls, navigate }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => navigate(`/classes/${cls.id}/students`)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium cursor-pointer"
        >
          Importer / gérer les élèves
        </button>
        <button
          onClick={() => navigate(`/classes/${cls.id}/brouillon`)}
          className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
        >
          Brouillon
        </button>
        <button
          onClick={() => navigate(`/classes/${cls.id}/cartes`)}
          className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
        >
          Cartes finales
        </button>
      </div>

      {!students.length ? (
        <Panel><p className="text-sm text-slate-500">Aucun élève dans cette classe.</p></Panel>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Prénom</th>
                <th className="px-4 py-3">Sexe</th>
                <th className="px-4 py-3">Naissance</th>
                <th className="px-4 py-3">Photo</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.matricule}</td>
                  <td className="px-4 py-3 text-slate-700">{s.nom}</td>
                  <td className="px-4 py-3 text-slate-700">{s.prenom}</td>
                  <td className="px-4 py-3 text-slate-600">{s.sexe}</td>
                  <td className="px-4 py-3 text-slate-600">{s.date_naissance}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      s.photo_path ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {s.photo_path ? 'OK' : 'Manquante'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}