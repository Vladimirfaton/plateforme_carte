import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createStudent,
  getStudentsByGroup,
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
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer pour les photos et Excel
const photoUpload = multer({
  dest: path.join(__dirname, '../../uploads/photos'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images PNG/JPEG sont autorisées'));
    }
  },
});

const excelUpload = multer({
  dest: path.join(__dirname, '../../uploads/excel'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel sont autorisés'));
    }
  },
});

// Routes créer élève
router.post('/:groupId/students', authenticate, photoUpload.single('photo'), createStudent);

// Routes récupérer élèves
router.get('/group/:groupId', authenticate, getStudentsByGroup);
router.get('/class/:classId', authenticate, getStudentsByClass);
router.get('/college/:collegeId', authenticate, getStudentsByCollege);
router.get('/:studentId', authenticate, getStudentById);

// Routes modifier élève
router.put('/:studentId', authenticate, updateStudent);
router.put('/:studentId/photo', authenticate, photoUpload.single('photo'), updateStudentPhoto);

// Routes supprimer élève
router.delete('/:studentId', authenticate, deleteStudent);

// Import/Export Excel
router.post('/import/validate', authenticate, excelUpload.single('file'), validateExcelFile);
router.post('/:classId/import', authenticate, importStudents);
router.get('/import/template', downloadTemplate);

export default router;
