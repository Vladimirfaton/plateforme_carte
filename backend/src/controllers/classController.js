import { Class } from '../models/Class.js';
import { Group } from '../models/Group.js';
import { College } from '../models/College.js';
import logger from '../config/logger.js';

export const createClass = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { code, niveau, effectif_previsionnel } = req.body;

    if (!code || !niveau) {
      return res.status(400).json({ error: 'Code et niveau requis' });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    const newClass = await Class.create(collegeId, {
      code,
      niveau,
      effectif_previsionnel,
    });

    // Créer les groupes A-G automatiquement
    await Group.createDefaultGroups(newClass.id);

    logger.info(`Class created: ${newClass.id} - ${code}`);
    res.status(201).json(newClass);
  } catch (error) {
    logger.error(`Error creating class: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la création de la classe' });
  }
};

export const getClassesByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    const classes = await Class.findByCollege(collegeId);
    res.json(classes);
  } catch (error) {
    logger.error(`Error fetching classes: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des classes' });
  }
};

export const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const groups = await Group.findByClass(classId);

    res.json({
      ...classData,
      groups,
    });
  } catch (error) {
    logger.error(`Error fetching class: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération de la classe' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const updatedClass = await Class.update(classId, req.body);
    logger.info(`Class updated: ${classId}`);
    res.json(updatedClass);
  } catch (error) {
    logger.error(`Error updating class: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la classe' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    await Class.delete(classId);
    logger.info(`Class deleted: ${classId}`);
    res.json({ message: 'Classe supprimée' });
  } catch (error) {
    logger.error(`Error deleting class: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la suppression de la classe' });
  }
};
