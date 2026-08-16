import { useState, useEffect, useMemo } from 'react';
import {
  IdCard, LogOut, School, Users, FileText, ChevronRight,
  ArrowLeft, Loader2, Download, Search, Image as ImageIcon, Check, X,
  MessageSquare, Mail,
} from 'lucide-react';
import { collegeAPI, classAPI, studentAPI } from '../services/api';
import ObservationsPanel from '../components/ObservationsPanel';
import {
  generateBrouillonPDF, generateCollegeBrouillonPDF,
} from '../utils/pdfUtils';

// ─── Constantes ──────────────────────────────────────────────────────────────

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
    return (a.serie || '').localeCompare(b.serie || '', 'fr', { numeric: true });
  });

const formatDateFr = (value) => {
  if (!value) return '';
  const m = value.toString().trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
};

const resolveFileUrl = (value, folder) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  return `${base}/uploads/${folder}/${value.split(/[\\/]/).pop()}`;
};

const photoUrl = (path) => resolveFileUrl(path, 'photos');

// ─── Composants primitifs ────────────────────────────────────────────────────

function Notice({ type = 'error', children, onClose }) {
  const s = type === 'error'
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return (
    <div className={`mb-4 flex items-start gap-2 px-4 py-3 border rounded-lg text-sm ${s}`}>
      {type === 'error'
        ? <X className="w-4 h-4 mt-0.5 shrink-0" />
        : <Check className="w-4 h-4 mt-0.5 shrink-0" />}
      <span className="flex-1">{children}</span>
      {onClose && (
        <button onClick={onClose} className="cursor-pointer shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function Empty({ children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
      <p className="text-sm text-slate-500">{children}</p>
    </div>
  );
}

const COLORS = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600'    },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600'  },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600'   },
};

function StatCard({ icon: Icon, label, value, color = 'emerald' }) {
  const c = COLORS[color];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="text-2xl font-semibold text-slate-800 leading-tight">{value}</div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DashboardGestion({ onLogout }) {
  const user = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);

  const collegeId = user.college_id;

  const [college, setCollege]   = useState(null);
  const [classes, setClasses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Navigation : null = liste classes, objet = classe active
  const [activeClass, setActiveClass] = useState(null);
  const [students, setStudents]       = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ─── Chargement initial ──────────────────────────────────────────────────

  useEffect(() => {
    if (!collegeId) { setLoading(false); return; }
    (async () => {
      try {
        // getById et getByCollege en parallèle.
        // getById peut échouer si collegeRoutes est restreint admin-only —
        // dans ce cas on fallback sur les infos du user (nom college non dispo,
        // mais les classes chargent quand même).
        const [colResult, clsRes] = await Promise.allSettled([
          collegeAPI.getById(collegeId),
          classAPI.getByCollege(collegeId),
        ]);

        if (colResult.status === 'fulfilled') {
          setCollege(colResult.value.data);
        } else {
          // Fallback minimal depuis sessionStorage — le header affiche quand même le nom
          setCollege({ id: collegeId, nom: user.college_nom || '' });
        }

        if (clsRes.status === 'fulfilled') {
          setClasses(trierClasses(clsRes.value.data || []));
        } else {
          setError('Impossible de charger les classes.');
        }
      } catch {
        setError('Impossible de charger les données. Vérifiez votre connexion.');
      } finally {
        setLoading(false);
      }
    })();
  }, [collegeId]);

  const openClass = async (cls) => {
    setActiveClass(cls);
    setStudents([]);
    setStudentsLoading(true);
    try {
      const r = await studentAPI.getByClass(cls.id);
      setStudents(r.data?.students || r.data || []);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const goBack = () => {
    setActiveClass(null);
    setStudents([]);
  };

  // ─── Stats globales ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalEleves = classes.reduce((s, c) => s + (c.effectif ?? 0), 0);
    return {
      classes: classes.length,
      eleves: totalEleves,
    };
  }, [classes]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <IdCard className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-800 leading-tight truncate">
                {college?.nom || 'Espace gestion'}
              </h1>
              <p className="text-xs text-slate-500">
                {user.prenom} {user.nom}
                <span className="ml-1.5 text-slate-300">·</span>
                <span className="ml-1.5 capitalize">{user.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`mailto:assistance@fvs.bj?subject=Assistance - ${college?.nom || ''}`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Assistance
            </a>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Stats — visibles seulement sur la vue liste des classes */}
      {!activeClass && (
        <div className="bg-[#f7faf8] border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              <StatCard icon={School}  label="Classes" value={stats.classes} color="emerald" />
              <StatCard icon={Users}   label="Élèves"  value={stats.eleves}  color="cyan"    />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          {activeClass ? (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Classes
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-medium">{activeClass.code}</span>
            </>
          ) : (
            <span className="text-slate-700 font-medium">Classes</span>
          )}
        </div>

        {error && <Notice onClose={() => setError('')}>{error}</Notice>}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Chargement</span>
          </div>
        ) : (
          <>
            {!activeClass && (
              <ClassesView
                classes={classes}
                college={college}
                onOpen={openClass}
              />
            )}
            {activeClass && (
              <ClasseDetail
                cls={activeClass}
                students={students}
                loading={studentsLoading}
                college={college}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Vue liste des classes ────────────────────────────────────────────────────

function ClassesView({ classes, college, onOpen }) {
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };

  const q = search.trim().toLowerCase();
  const visibles = q ? classes.filter(c => (c.code || '').toLowerCase().includes(q)) : classes;

  const handleBrouillonCollege = async () => {
    setError('');
    setGenerating(true);
    try {
      const withStudents = [];
      for (const cls of classes) {
        const r = await studentAPI.getByClass(cls.id);
        withStudents.push({ classInfo: cls, students: r.data?.students || r.data || [] });
      }
      await generateCollegeBrouillonPDF(withStudents, college);
      flash('Brouillon téléchargé');
    } catch {
      setError('Erreur lors de la génération du brouillon');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {error  && <Notice onClose={() => setError('')}>{error}</Notice>}
      {notice && <Notice type="success" onClose={() => setNotice('')}>{notice}</Notice>}

      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative mr-auto">
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
          onClick={handleBrouillonCollege}
          disabled={generating || !classes.length}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generating ? 'Génération...' : 'Brouillon du collège'}
        </button>
      </div>

      {!visibles.length ? (
        <Empty>
          {q ? `Aucune classe ne correspond à « ${search} ».` : 'Aucune classe enregistrée.'}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibles.map(cls => (
            <button
              key={cls.id}
              onClick={() => onOpen(cls)}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-5 text-left cursor-pointer transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-base font-semibold text-slate-800 group-hover:text-emerald-700 transition">
                  {cls.code}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition mt-0.5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {cls.effectif ?? 0} élève{(cls.effectif ?? 0) > 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Détail d'une classe ──────────────────────────────────────────────────────

const CLASS_TABS = [
  { key: 'eleves',    label: 'Élèves',    icon: Users       },
  { key: 'brouillon', label: 'Brouillon', icon: FileText    },
  { key: 'observations', label: 'Observations', icon: MessageSquare },
];

function ClasseDetail({ cls, students, loading, college }) {
  const [tab, setTab] = useState('eleves');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {CLASS_TABS.map(t => {
          const Icon = t.icon;
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer ${
                on ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.key === 'eleves' && !loading && (
                <span className="text-xs text-slate-400">({students.length})</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Chargement des élèves</span>
        </div>
      ) : (
        <>
          {tab === 'eleves'        && <ElevesTab students={students} />}
          {tab === 'brouillon'     && <BrouillonTab cls={cls} students={students} college={college} />}
          {tab === 'observations'  && <ObservationsTab cls={cls} />}
        </>
      )}
    </div>
  );
}

// ─── Tab Élèves ───────────────────────────────────────────────────────────────

function ElevesTab({ students }) {
  const [search, setSearch] = useState('');

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      [s.matricule, s.nom, s.prenom].some(v => (v || '').toLowerCase().includes(q))
    );
  }, [students, search]);

  if (!students.length) return <Empty>Aucun élève dans cette classe.</Empty>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Matricule, nom, prénom"
            className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-400 ml-auto">
          {visibles.length} / {students.length} élève{students.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Matricule</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Prénom(s)</th>
              <th className="px-4 py-3">Sexe</th>
              <th className="px-4 py-3">Date de naissance</th>
              <th className="px-4 py-3">Lieu</th>
              <th className="px-4 py-3">Nationalité</th>
              <th className="px-4 py-3">Contact parent</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map(s => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="w-9 h-9 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {s.photo_path
                      ? <img src={photoUrl(s.photo_path)} alt={s.nom} className="w-full h-full object-cover" />
                      : <ImageIcon className="w-4 h-4 text-slate-300" />
                    }
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{s.matricule}</td>
                <td className="px-4 py-3 text-slate-700">{s.nom}</td>
                <td className="px-4 py-3 text-slate-700">{s.prenom}</td>
                <td className="px-4 py-3 text-slate-600">{s.sexe}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateFr(s.date_naissance) || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{s.lieu_naissance || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{s.nationalite || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{s.adresse || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab Brouillon ────────────────────────────────────────────────────────────

function BrouillonTab({ cls, students, college }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [notice, setNotice]         = useState('');

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };

  const avecPhoto    = students.filter(s => s.photo_path).length;
  const sansPhoto    = students.length - avecPhoto;

  const exportPDF = async () => {
    setError('');
    setGenerating(true);
    try {
      await generateBrouillonPDF(students, cls, college);
      flash('PDF téléchargé');
    } catch {
      setError('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {error  && <Notice onClose={() => setError('')}>{error}</Notice>}
      {notice && <Notice type="success" onClose={() => setNotice('')}>{notice}</Notice>}

      {/* Stats photos */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon={Users}     label="Élèves"      value={students.length} color="emerald" />
        <StatCard icon={Check}     label="Avec photo"  value={avecPhoto}       color="cyan"    />
        <StatCard icon={ImageIcon} label="Sans photo"  value={sansPhoto}       color={sansPhoto > 0 ? 'amber' : 'emerald'} />
      </div>

      {/* Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <p className="text-sm font-medium text-slate-800 mb-1">Exporter le brouillon</p>
        <p className="text-xs text-slate-500 mb-4">
          Liste complète A4 paysage — photo, matricule, nom, prénom, classe, date et lieu de naissance, nationalité, contact parent.
        </p>
        <button
          onClick={exportPDF}
          disabled={generating || !students.length}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium cursor-pointer"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generating ? 'Génération...' : 'Télécharger le PDF'}
        </button>
      </div>

      {/* Aperçu liste élèves */}
      {!students.length ? (
        <Empty>Aucun élève dans cette classe.</Empty>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {students.map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                {s.photo_path
                  ? <img src={photoUrl(s.photo_path)} alt={s.nom} className="w-full h-full object-cover" />
                  : <ImageIcon className="w-4 h-4 text-slate-300" />
                }
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-sm">
                <span className="font-medium text-slate-800 truncate">{s.nom} {s.prenom}</span>
                <span className="text-slate-500 text-xs">{s.matricule}</span>
                <span className="text-slate-500 text-xs">{formatDateFr(s.date_naissance) || '—'}</span>
                <span className="text-slate-500 text-xs">{s.nationalite || '—'}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                s.photo_path ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {s.photo_path ? 'Photo OK' : 'Sans photo'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab Observations ─────────────────────────────────────────────────────────

function ObservationsTab({ cls }) {
  return (
    <div className="max-w-2xl">
      <ObservationsPanel classId={cls.id} />
    </div>
  );
}
