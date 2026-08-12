import ExcelJS from 'exceljs';
import { Student } from '../models/Student.js';
import { Group } from '../models/Group.js';
import { Class } from '../models/Class.js';
import logger from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'date-fns';

export const validateExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'Aucune feuille trouvée dans le fichier' });
    }

    const rows = [];
    const errors = [];
    let rowIndex = 2; // Commencer à la ligne 2 (après header)

    worksheet.eachRow((row, index) => {
      if (index === 1) return; // Ignorer la ligne d'en-tête

      const values = row.values;
      if (!values || values.filter(v => v).length === 0) return; // Ignorer les lignes vides

      // Format: photo | matricule | nom | prenom | né(e) le | sexe | nationalité | adresse | classe
      const studentData = {
        photo: values[1] || null,
        matricule: values[2]?.toString().trim() || '',
        nom: values[3]?.toString().trim() || '',
        prenom: values[4]?.toString().trim() || '',
        date_naissance: values[5] || '',
        sexe: values[6]?.toString().trim() || '',
        nationalite: values[7]?.toString().trim() || '',
        adresse: values[8]?.toString().trim() || '',
        classe: values[9]?.toString().trim() || '',
      };

      // Valider les données obligatoires
      const rowErrors = [];
      if (!studentData.matricule) rowErrors.push(`Ligne ${index}: Matricule manquant`);
      if (!studentData.nom) rowErrors.push(`Ligne ${index}: Nom manquant`);
      if (!studentData.prenom) rowErrors.push(`Ligne ${index}: Prénom manquant`);
      if (!studentData.classe) rowErrors.push(`Ligne ${index}: Classe manquante`);
      if (!studentData.sexe) rowErrors.push(`Ligne ${index}: Sexe manquant`);
      if (!studentData.nationalite) rowErrors.push(`Ligne ${index}: Nationalité manquante`);

      // Valider et parser la date
      if (studentData.date_naissance) {
        try {
          // Format JJ/MM/YYYY
          const parsedDate = parse(
            studentData.date_naissance.toString(),
            'dd/MM/yyyy',
            new Date()
          );
          if (!isNaN(parsedDate.getTime())) {
            studentData.date_naissance = parsedDate.toISOString().split('T')[0];
          } else {
            rowErrors.push(`Ligne ${index}: Date invalide (format attendu: JJ/MM/YYYY)`);
          }
        } catch (err) {
          rowErrors.push(`Ligne ${index}: Date invalide`);
        }
      } else {
        rowErrors.push(`Ligne ${index}: Date de naissance manquante`);
      }

      if (rowErrors.length === 0) {
        rows.push(studentData);
      } else {
        errors.push(...rowErrors);
      }
    });

    // Vérifier les doublons de matricule
    const matricules = new Set();
    for (const row of rows) {
      if (matricules.has(row.matricule)) {
        errors.push(`Matricule en doublon: ${row.matricule}`);
      }
      matricules.add(row.matricule);
    }

    res.json({
      valid: errors.length === 0,
      data: rows,
      errors,
      totalRows: rows.length,
    });
  } catch (error) {
    logger.error(`Excel validation error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la validation du fichier Excel' });
  }
};

export const importStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Aucun élève à importer' });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const errors = [];
    const imported = [];

    // Parser les classes au format "6ème-A"
    const classFormat = classData.code; // ex: "6ème"

    for (const studentData of students) {
      try {
        // Extraire la lettre du groupe de la classe fournie
        // Format: "6ème-A" -> "A"
        const groupeLetter = studentData.classe.split('-')[1]?.trim() || 'A';

        // Trouver le groupe correspondant
        const groups = await Group.findByClass(classId);
        const group = groups.find(g => g.lettre === groupeLetter);

        if (!group) {
          errors.push(`${studentData.nom} ${studentData.prenom}: Groupe ${groupeLetter} non trouvé`);
          continue;
        }

        // Vérifier si matricule existe
        const existing = await Student.findByMatricule(studentData.matricule);
        if (existing) {
          errors.push(`${studentData.nom} ${studentData.prenom}: Matricule ${studentData.matricule} existe déjà`);
          continue;
        }

        const student = await Student.create(group.id, {
          matricule: studentData.matricule,
          nom: studentData.nom,
          prenom: studentData.prenom,
          date_naissance: studentData.date_naissance,
          sexe: studentData.sexe,
          nationalite: studentData.nationalite,
          adresse: studentData.adresse,
          telephone: studentData.telephone || null,
          photo_path: null,
        });

        imported.push(student);
      } catch (error) {
        errors.push(`${studentData.nom} ${studentData.prenom}: ${error.message}`);
      }
    }

    logger.info(`Imported ${imported.length} students to class ${classId}`);

    res.json({
      imported: imported.length,
      errors,
      students: imported,
    });
  } catch (error) {
    logger.error(`Import error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de l\'import des élèves' });
  }
};

export const downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Élèves');

    // Ajouter les en-têtes
    worksheet.columns = [
      { header: 'Photo (matricule)', key: 'photo', width: 20 },
      { header: 'Matricule', key: 'matricule', width: 15 },
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom', key: 'prenom', width: 20 },
      { header: 'Né(e) le (JJ/MM/YYYY)', key: 'date_naissance', width: 18 },
      { header: 'Sexe (M/F)', key: 'sexe', width: 12 },
      { header: 'Nationalité', key: 'nationalite', width: 15 },
      { header: 'Adresse + Tél', key: 'adresse', width: 30 },
      { header: 'Classe (Ex: 6ème-A)', key: 'classe', width: 15 },
    ];

    // Ajouter une ligne d'exemple
    worksheet.addRow({
      photo: 'MAT001.jpg',
      matricule: 'MAT001',
      nom: 'HOUNDNJE',
      prenom: 'Oswell Séwanu',
      date_naissance: '01/02/2009',
      sexe: 'M',
      nationalite: 'BENINOISE',
      adresse: '95961070',
      classe: '6ème-B',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_eleves.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Template download error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors du téléchargement du template' });
  }
};
