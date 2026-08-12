import { Student } from '../models/Student.js';
import { Group } from '../models/Group.js';
import { Class } from '../models/Class.js';
import logger from '../config/logger.js';
import fs from 'fs/promises';

export const createStudent = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { matricule, nom, prenom, date_naissance, sexe, nationalite, adresse, telephone } = req.body;

    if (!matricule || !nom || !prenom) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Vérifier si matricule existe déjà
    const existing = await Student.findByMatricule(matricule);
    if (existing) {
      return res.status(409).json({ error: 'Ce matricule existe déjà' });
    }

    const photoPath = req.file ? req.file.path : null;

    const student = await Student.create(groupId, {
      matricule,
      nom,
      prenom,
      date_naissance,
      sexe,
      nationalite,
      adresse,
      telephone,
      photo_path: photoPath,
    });

    logger.info(`Student created: ${student.id} - ${nom} ${prenom}`);
    res.status(201).json(student);
  } catch (error) {
    logger.error(`Error creating student: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la création de l\'élève' });
  }
};

export const getStudentsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    const students = await Student.findByGroup(groupId);
    res.json(students);
  } catch (error) {
    logger.error(`Error fetching students: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des élèves' });
  }
};

export const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const students = await Student.findByClass(classId);
    res.json(students);
  } catch (error) {
    logger.error(`Error fetching students by class: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des élèves' });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    res.json(student);
  } catch (error) {
    logger.error(`Error fetching student: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'élève' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const updatedStudent = await Student.update(studentId, req.body);
    logger.info(`Student updated: ${studentId}`);
    res.json(updatedStudent);
  } catch (error) {
    logger.error(`Error updating student: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'élève' });
  }
};

export const updateStudentPhoto = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucune photo fournie' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // Supprimer ancienne photo si elle existe
    if (student.photo_path) {
      try {
        await fs.unlink(student.photo_path);
      } catch (err) {
        logger.warn(`Could not delete old photo: ${student.photo_path}`);
      }
    }

    const updatedStudent = await Student.updatePhoto(studentId, req.file.path);
    logger.info(`Photo updated for student: ${studentId}`);
    res.json(updatedStudent);
  } catch (error) {
    logger.error(`Error updating photo: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors du mise à jour de la photo' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // Supprimer photo si elle existe
    if (student.photo_path) {
      try {
        await fs.unlink(student.photo_path);
      } catch (err) {
        logger.warn(`Could not delete photo: ${student.photo_path}`);
      }
    }

    await Student.delete(studentId);
    logger.info(`Student deleted: ${studentId}`);
    res.json({ message: 'Élève supprimé' });
  } catch (error) {
    logger.error(`Error deleting student: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'élève' });
  }
};

export const getStudentsByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    const students = await Student.findAllByCollege(collegeId);
    res.json(students);
  } catch (error) {
    logger.error(`Error fetching students by college: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des élèves' });
  }
};
