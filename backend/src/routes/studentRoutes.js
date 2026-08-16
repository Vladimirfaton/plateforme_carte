import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createStudent,
  getStudentsByClass,
  getStudentById,
  updateStudent,
  updateStudentPhoto,
  deleteStudent,
  getStudentsByCollege,
} from '../controllers/studentController.js';
import {
  validateExcelFile,
  importStudents,
  downloadTemplate,
} from '../controllers/importController.js';
import { authenticate, checkAccountActive } from '../middleware/auth.js';
import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Seules les images PNG/JPEG sont autorisées'));
  },
});

const excelUpload = multer({
  dest: path.join(__dirname, '../../uploads/excel'),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Helper middleware : vérifie que la classe appartient au collège de l'utilisateur
const scopeClass = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const classId = req.params.classId;
  const cls = await Class.findById(classId).catch(() => null);
  if (!cls || cls.college_id !== req.user.college_id) {
    return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
  }
  next();
};

// Helper middleware : vérifie que l'élève appartient au collège de l'utilisateur
const scopeStudent = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const student = await Student.findById(req.params.studentId).catch(() => null);
  if (!student) return res.status(404).json({ error: 'Élève non trouvé' });
  const cls = await Class.findById(student.classe_id).catch(() => null);
  if (!cls || cls.college_id !== req.user.college_id) {
    return res.status(403).json({ error: 'Accès non autorisé à cet élève' });
  }
  next();
};

// Helper middleware : vérifie que le collegeId correspond au collège de l'utilisateur
const scopeCollege = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.params.collegeId !== req.user.college_id) {
    return res.status(403).json({ error: 'Accès non autorisé à ce collège' });
  }
  next();
};

// --- Template (public, pas d'auth nécessaire) ---
router.get('/import/template', downloadTemplate);

// --- Import Excel (admin uniquement) ---
router.post('/import/validate', authenticate, checkAccountActive, excelUpload.single('file'), validateExcelFile);

// --- Lecture scopée (directeur + secrétaire + admin) ---
router.get('/class/:classId', authenticate, checkAccountActive, scopeClass, getStudentsByClass);
router.get('/college/:collegeId', authenticate, checkAccountActive, scopeCollege, getStudentsByCollege);

// --- Écriture (admin uniquement dans DashboardAdmin, mais directeur/secrétaire sont bloqués
//     uniquement si on veut — pour l'instant on garde l'accès ouvert aux comptes actifs
//     de leur propre collège, cohérent avec les droits définis) ---
router.post('/:classId/students', authenticate, checkAccountActive, scopeClass, photoUpload.single('photo'), createStudent);
router.post('/:classId/import', authenticate, checkAccountActive, scopeClass, importStudents);

router.get('/:studentId', authenticate, checkAccountActive, scopeStudent, getStudentById);
router.put('/:studentId', authenticate, checkAccountActive, scopeStudent, updateStudent);
router.put('/:studentId/photo', authenticate, checkAccountActive, scopeStudent, photoUpload.single('photo'), updateStudentPhoto);
router.delete('/:studentId', authenticate, checkAccountActive, scopeStudent, deleteStudent);

export default router;