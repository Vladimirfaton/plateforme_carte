import { Observation } from '../models/Observation.js';
import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import logger from '../config/logger.js';

export const createObservation = async (req, res) => {
  try {
    const { classId } = req.params;
    const { contenu } = req.body;

    if (!contenu) return res.status(400).json({ error: 'Le contenu est requis' });

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ error: 'Classe non trouvée' });

    // Access control: admin can create for any college; director/secretary only for their college
    if (req.user.role !== 'admin' && req.user.college_id !== classData.college_id) {
      return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
    }

    const obs = await Observation.create({
      classe_id: classId,
      auteur_id: req.user.id,
      auteur_role: req.user.role,
      contenu,
    });

    logger.info(`Observation created for class ${classId} by ${req.user.email}`);
    res.status(201).json(obs);
  } catch (error) {
    logger.error(`createObservation error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la création de l\'observation' });
  }
};

export const listObservations = async (req, res) => {
  try {
    const { classId } = req.params;
    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ error: 'Classe non trouvée' });

    if (req.user.role !== 'admin' && req.user.college_id !== classData.college_id) {
      return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
    }

    const observations = await Observation.findByClass(classId);
    res.json(observations);
  } catch (error) {
    logger.error(`listObservations error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des observations' });
  }
};

export default { createObservation, listObservations };
