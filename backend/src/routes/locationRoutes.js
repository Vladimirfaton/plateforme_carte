import express from 'express';
import { getAllDepartements, getCommunesByDepartement } from '../controllers/locationController.js';

const router = express.Router();

router.get('/departements', getAllDepartements);
router.get('/communes/:departement', getCommunesByDepartement);

export default router;
