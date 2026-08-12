import { getDepartements, getCommunes } from '../utils/locationData.js';
import logger from '../config/logger.js';

export const getAllDepartements = (req, res) => {
  try {
    const departements = getDepartements();
    res.json(departements);
  } catch (error) {
    logger.error(`Error fetching departements: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des départements' });
  }
};

export const getCommunesByDepartement = (req, res) => {
  try {
    const { departement } = req.params;
    const communes = getCommunes(departement);

    if (!communes || communes.length === 0) {
      return res.status(404).json({ error: 'Département non trouvé' });
    }

    res.json(communes);
  } catch (error) {
    logger.error(`Error fetching communes: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des communes' });
  }
};
