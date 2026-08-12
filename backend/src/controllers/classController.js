import { Class } from '../models/Class.js';
import { College } from '../models/College.js';
import logger from '../config/logger.js';

export const createClass = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { niveau, serie } = req.body;

    if (!niveau || !serie) {
      return res.status(400).json({ error: 'Niveau et série requis' });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    const duplicate = await Class.findDuplicate(collegeId, niveau, serie);
    if (duplicate) {
      return res.status(409).json({
        error: `La classe ${Class.buildCode(niveau, serie)} existe déjà dans ce collège`,
      });
    }

    const newClass = await Class.create(collegeId, { niveau, serie });
    logger.info(`Class created: ${newClass.id} - ${newClass.code}`);
    res.status(201).json({ ...newClass, effectif: 0 });
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
    const classData = await Class.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }
    res.json(classData);
  } catch (error) {
    logger.error(`Error fetching class: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération de la classe' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { niveau, serie } = req.body;

    if (!niveau || !serie) {
      return res.status(400).json({ error: 'Niveau et série requis' });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const duplicate = await Class.findDuplicate(classData.college_id, niveau, serie, classId);
    if (duplicate) {
      return res.status(409).json({
        error: `La classe ${Class.buildCode(niveau, serie)} existe déjà dans ce collège`,
      });
    }

    const updated = await Class.update(classId, { niveau, serie });
    logger.info(`Class updated: ${classId}`);
    res.json(updated);
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