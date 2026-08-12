import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createCollege,
  getAllColleges,
  getCollegesByCommune,
  getCollegeById,
  updateCollege,
  deleteCollege,
  uploadSignature,
  getCollegeStats,
} from '../controllers/collegeController.js';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const signatureUpload = multer({
  dest: path.join(__dirname, '../../uploads/signatures'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images PNG/JPEG sont autorisées'));
    }
  },
});

router.get('/', authenticate, getAllColleges);
router.get('/commune', authenticate, getCollegesByCommune);
router.get('/:id/stats', authenticate, getCollegeStats);
router.get('/:id', authenticate, getCollegeById);

router.post('/', authenticate, createCollege);
router.put('/:id', authenticate, updateCollege);
router.delete('/:id', authenticate, deleteCollege);

router.post('/:id/signature', authenticate, signatureUpload.single('signature'), uploadSignature);

export default router;