import ExcelJS from 'exceljs';
import { Student } from '../models/Student.js';
import { Class } from '../models/Class.js';
import logger from '../config/logger.js';

const toISODate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = value.toString().trim();

  const fr = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (fr) {
    const [, d, m, y] = fr;
    const day = Number(d);
    const month = Number(m);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return null;
};

const cell = (v) => (v == null ? '' : v.toString().trim());

export const validateExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'Aucune feuille trouvée' });
    }

    const rows = [];
    const errors = [];

    worksheet.eachRow((row, index) => {
      if (index === 1) return;

      const v = row.values;
      if (!v || v.filter(Boolean).length === 0) return;

      const student = {
        matricule: cell(v[1]),
        nom: cell(v[2]),
        prenom: cell(v[3]),
        sexe: cell(v[4]).toUpperCase(),
        date_naissance: toISODate(v[5]),
        lieu_naissance: cell(v[6]),
        nationalite: cell(v[7]),
        adresse: cell(v[8]),
      };

      const rowErrors = [];
      if (!student.matricule) rowErrors.push(`Ligne ${index}: matricule manquant`);
      if (!student.nom) rowErrors.push(`Ligne ${index}: nom manquant`);
      if (!student.prenom) rowErrors.push(`Ligne ${index}: prénom manquant`);
      if (!['M', 'F'].includes(student.sexe)) rowErrors.push(`Ligne ${index}: sexe doit être M ou F`);
      if (!student.date_naissance) rowErrors.push(`Ligne ${index}: date invalide (JJ/MM/AAAA)`);

      if (rowErrors.length) errors.push(...rowErrors);
      else rows.push(student);
    });

    const seen = new Set();
    for (const r of rows) {
      if (seen.has(r.matricule)) errors.push(`Matricule en doublon: ${r.matricule}`);
      seen.add(r.matricule);
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
    const students = req.body.students || req.body.data;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Aucun élève à importer' });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const errors = [];
    const imported = [];

    for (const s of students) {
      try {
        const existing = await Student.findByMatricule(s.matricule);
        if (existing) {
          errors.push(`${s.matricule}: matricule déjà utilisé`);
          continue;
        }

        const student = await Student.create(classId, { ...s, photo_path: null });
        imported.push(student);
      } catch (err) {
        errors.push(`${s.matricule}: ${err.message}`);
      }
    }

    logger.info(`Imported ${imported.length} students to class ${classId}`);
    res.json({ imported: imported.length, errors, students: imported });
  } catch (error) {
    logger.error(`Import error: ${error.message}`);
    res.status(500).json({ error: "Erreur lors de l'import des élèves" });
  }
};

export const downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Élèves');

    worksheet.columns = [
      { header: 'Matricule', key: 'matricule', width: 15 },
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom(s)', key: 'prenom', width: 24 },
      { header: 'Sexe (M/F)', key: 'sexe', width: 12 },
      { header: 'Date de naissance (JJ/MM/AAAA)', key: 'date_naissance', width: 28 },
      { header: 'Lieu de naissance', key: 'lieu_naissance', width: 22 },
      { header: 'Nationalité', key: 'nationalite', width: 16 },
      { header: 'Contact parent', key: 'adresse', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    worksheet.addRow({
      matricule: '001',
      nom: 'XXXXXXX',
      prenom: 'AAAAA BBBBBB',
      sexe: 'M',
      date_naissance: '01/02/2009',
      lieu_naissance: 'Cotonou',
      nationalite: 'BENINOISE',
      adresse: '0156435678',
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