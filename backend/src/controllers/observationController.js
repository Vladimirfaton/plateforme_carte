import { Observation } from '../models/Observation.js';
import { Class } from '../models/Class.js';
import logger from '../config/logger.js';

export const createObservation = async (req, res) => {
  try {
    const { classId } = req.params;
    const { contenu, eleve_id } = req.body;

    if (!contenu) return res.status(400).json({ error: 'Le contenu est requis' });

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ error: 'Classe non trouvée' });

    if (['directeur', 'secretaire'].includes(req.user.role) && req.user.college_id !== classData.college_id) {
      return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
    }

    const obs = await Observation.create({
      classe_id: classId,
      auteur_id: req.user.id,
      auteur_role: req.user.role,
      contenu,
      eleve_id: eleve_id || null,
    });

    logger.info(`Observation created for class ${classId} by ${req.user.email}`);
    res.status(201).json(obs);
  } catch (error) {
    logger.error(`createObservation error: ${error.message}`);
    res.status(500).json({ error: "Erreur lors de la création de l'observation" });
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

// Admin uniquement — toutes les observations non lues (toutes classes confondues)
export const getUnreadObservations = async (req, res) => {
  try {
    const observations = await Observation.findUnread(20);
    const count = await Observation.countUnread();
    res.json({ count, observations });
  } catch (error) {
    logger.error(`getUnreadObservations error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des observations' });
  }
};

// Admin uniquement — marque toutes comme lues
export const markObservationsAsRead = async (req, res) => {
  try {
    const updated = await Observation.markAllAsRead();
    res.json({ updated });
  } catch (error) {
    logger.error(`markObservationsAsRead error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

// Auteur (dans les 30 min) ou admin (sans limite)
export const deleteObservation = async (req, res) => {
  try {
    const { observationId } = req.params;

    const obs = await Observation.findById(observationId);
    if (!obs) return res.status(404).json({ error: 'Observation non trouvée' });

    if (req.user.role !== 'admin') {
      // Doit être l'auteur
      if (obs.auteur_id !== req.user.id) {
        return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres observations' });
      }
      // Délai 30 minutes
      const diffMs = Date.now() - new Date(obs.created_at).getTime();
      if (diffMs > 30 * 60 * 1000) {
        return res.status(403).json({
          error: 'Délai de suppression dépassé (30 minutes après création)',
          code: 'DELETE_DELAY_EXCEEDED',
        });
      }
    }

    await Observation.deleteById(observationId);
    logger.info(`Observation ${observationId} deleted by ${req.user.email}`);
    res.json({ deleted: true });
  } catch (error) {
    logger.error(`deleteObservation error: ${error.message}`);
    res.status(500).json({ error: "Erreur lors de la suppression de l'observation" });
  }
};

export default { createObservation, listObservations, getUnreadObservations, markObservationsAsRead, deleteObservation };