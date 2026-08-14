import express from 'express';
import multer from 'multer';
import {
  createCollege,
  getAllColleges,
  getCollegesByCommune,
  getCollegeById,
  updateCollege,
  deleteCollege,
  uploadSignature,
  getCollegeStats,
  getCollegeCardInfoPage,
  createManagementAccounts,
  getManagementAccounts,
} from '../controllers/collegeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Signature : en memoire (buffer) -> envoyee vers Supabase Storage dans le controller,
// jamais ecrite sur le disque du serveur (voir utils/storage.js).
const signatureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images PNG/JPEG sont autorisées'));
    }
  },
});

// Page publique affichee au scan du QR code (verso de la carte) — PAS d'authentification :
// doit rester consultable par quiconque scanne une carte perdue/retrouvee.
router.get('/:id/carte-info', getCollegeCardInfoPage);

router.get('/', authenticate, getAllColleges);
router.get('/commune', authenticate, getCollegesByCommune);
router.get('/:id/stats', authenticate, getCollegeStats);
router.get('/:id', authenticate, getCollegeById);

router.post('/', authenticate, authorize(['admin']), createCollege);
router.put('/:id', authenticate, authorize(['admin']), updateCollege);
router.delete('/:id', authenticate, authorize(['admin']), deleteCollege);

router.post('/:id/signature', authenticate, authorize(['admin']), signatureUpload.single('signature'), uploadSignature);

// Comptes de gestion (directeur/secrétaire) — création réservée à l'admin
router.post('/:id/comptes-gestion', authenticate, authorize(['admin']), createManagementAccounts);
router.get('/:id/comptes-gestion', authenticate, authorize(['admin']), getManagementAccounts);

export default router;