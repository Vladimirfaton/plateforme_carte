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
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const photoUpload = multer({
  dest: path.join(__dirname, '../../uploads/photos'),
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

router.get('/import/template', downloadTemplate);
router.post('/import/validate', authenticate, excelUpload.single('file'), validateExcelFile);

router.get('/class/:classId', authenticate, getStudentsByClass);
router.get('/college/:collegeId', authenticate, getStudentsByCollege);

router.post('/:classId/students', authenticate, photoUpload.single('photo'), createStudent);
router.post('/:classId/import', authenticate, importStudents);

router.get('/:studentId', authenticate, getStudentById);
router.put('/:studentId', authenticate, updateStudent);
router.put('/:studentId/photo', authenticate, photoUpload.single('photo'), updateStudentPhoto);
router.delete('/:studentId', authenticate, deleteStudent);

export default router;