import { Group } from '../models/Group.js';
import { Class } from '../models/Class.js';
import logger from '../config/logger.js';

export const getGroupsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const groups = await Group.findByClass(classId);
    res.json(groups);
  } catch (error) {
    logger.error(`Error fetching groups: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des groupes' });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    res.json(group);
  } catch (error) {
    logger.error(`Error fetching group: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération du groupe' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    await Group.delete(groupId);
    logger.info(`Group deleted: ${groupId}`);
    res.json({ message: 'Groupe supprimé' });
  } catch (error) {
    logger.error(`Error deleting group: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la suppression du groupe' });
  }
};
