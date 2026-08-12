import { College } from '../models/College.js';
import { Class } from '../models/Class.js';
import logger from '../config/logger.js';
import path from 'path';
import fs from 'fs/promises';

export const createCollege = async (req, res) => {
  try {
    const {
      nom,
      commune,
      departement,
      directeur_nom,
      directeur_contact,
      email,
      telephone,
    } = req.body;

    if (!nom || !commune || !departement) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const college = await College.create({
      nom,
      commune,
      departement,
      directeur_nom,
      directeur_contact,
      email,
      telephone,
    });

    logger.info(`College created: ${college.id} - ${nom}`);
    res.status(201).json(college);
  } catch (error) {
    logger.error(`Error creating college: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la création du collège' });
  }
};

export const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.findAll();
    res.json(colleges);
  } catch (error) {
    logger.error(`Error fetching colleges: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des collèges' });
  }
};

export const getCollegesByCommune = async (req, res) => {
  try {
    const { commune, departement } = req.query;

    if (!commune || !departement) {
      return res.status(400).json({ error: 'Commune et département requis' });
    }

    const colleges = await College.findByCommune(commune, departement);
    res.json(colleges);
  } catch (error) {
    logger.error(`Error fetching colleges by commune: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des collèges' });
  }
};

export const getCollegeById = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);

    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    res.json(college);
  } catch (error) {
    logger.error(`Error fetching college: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération du collège' });
  }
};

export const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);

    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    const updatedCollege = await College.update(id, req.body);
    logger.info(`College updated: ${id}`);
    res.json(updatedCollege);
  } catch (error) {
    logger.error(`Error updating college: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du collège' });
  }
};

export const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);

    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    // Supprimer signature si elle existe
    if (college.signature_path) {
      try {
        await fs.unlink(college.signature_path);
      } catch (err) {
        logger.warn(`Could not delete signature file: ${college.signature_path}`);
      }
    }

    await College.delete(id);
    logger.info(`College deleted: ${id}`);
    res.json({ message: 'Collège supprimé' });
  } catch (error) {
    logger.error(`Error deleting college: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la suppression du collège' });
  }
};

export const uploadSignature = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    // Supprimer ancienne signature si elle existe
    if (college.signature_path) {
      try {
        await fs.unlink(college.signature_path);
      } catch (err) {
        logger.warn(`Could not delete old signature: ${college.signature_path}`);
      }
    }

    const signaturePath = req.file.path;
    const updatedCollege = await College.uploadSignature(id, signaturePath);

    logger.info(`Signature uploaded for college: ${id}`);
    res.json(updatedCollege);
  } catch (error) {
    logger.error(`Error uploading signature: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors du upload de la signature' });
  }
};

export const getCollegeStats = async (req, res) => {
  try {
    const { id } = req.params;

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    const classes = await Class.findByCollege(id);

    res.json({
      college,
      stats: {
        total_classes: classes.length,
        total_students: classes.reduce((sum, c) => sum + (c.effectif_previsionnel || 0), 0),
      },
    });
  } catch (error) {
    logger.error(`Error fetching college stats: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};
