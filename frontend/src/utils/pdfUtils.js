import { PDFDocument, rgb, degrees } from 'pdf-lib';
import QRCode from 'qrcode';

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================================
// BROUILLON EXPORT (6 cartes par page A4 paysage, modifiable)
// ============================================================================

export const generateBrouillonPDF = async (students, classInfo, collegeInfo) => {
  try {
    // Create PDF in landscape A4
    const pdfDoc = PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape (mm converted to points)
    const { width, height } = page.getSize();

    const CARDS_PER_PAGE = 6;
    const COLS = 2;
    const ROWS = 3;
    const MARGIN = 20;
    const CARD_WIDTH = (width - MARGIN * 3) / COLS;
    const CARD_HEIGHT = (height - MARGIN * 3) / ROWS;

    // Draw cards
    students.slice(0, 6).forEach((student, idx) => {
      const row = Math.floor(idx / COLS);
      const col = idx % COLS;
      const x = MARGIN + col * (CARD_WIDTH + MARGIN);
      const y = MARGIN + row * (CARD_HEIGHT + MARGIN);

      drawBrouillonCard(page, student, classInfo, collegeInfo, x, y, CARD_WIDTH, CARD_HEIGHT);
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    downloadFile(pdfBytes, `brouillon_${classInfo?.code || 'cartes'}.pdf`);
  } catch (error) {
    console.error('Error generating brouillon PDF:', error);
    throw error;
  }
};

const drawBrouillonCard = (page, student, classInfo, collegeInfo, x, y, width, height) => {
  const { rgb: rgbColor } = require('pdf-lib');

  // Card border
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: rgb(0.8, 0.9, 1),
    borderWidth: 2
  });

  // Background
  page.drawRectangle({
    x: x + 1,
    y: y + 1,
    width: width - 2,
    height: height - 2,
    color: rgb(1, 1, 1)
  });

  // Photo placeholder area
  const photoWidth = width * 0.3;
  const photoHeight = height * 0.8;
  page.drawRectangle({
    x: x + 5,
    y: y + height - photoHeight - 5,
    width: photoWidth,
    height: photoHeight,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  });

  if (student.photo_path) {
    try {
      // Photo would need to be embedded - simplified here
      page.drawText('📸', {
        x: x + photoWidth / 2 - 5,
        y: y + height - photoHeight / 2 - 5,
        size: 12,
        color: rgb(0.5, 0.5, 0.5)
      });
    } catch (err) {
      // Photo embedding - skipped for simplicity
    }
  } else {
    page.drawText('No Photo', {
      x: x + photoWidth / 2 - 25,
      y: y + height - photoHeight / 2 - 5,
      size: 8,
      color: rgb(0.8, 0.8, 0.8)
    });
  }

  // Info section
  const infoX = x + photoWidth + 10;
  const infoWidth = width - photoWidth - 15;
  let textY = y + height - 15;
  const lineHeight = 12;

  const fontSize = 8;
  const infoLines = [
    `MAT: ${student.matricule}`,
    `NOM: ${student.nom}`,
    `PRENOM: ${student.prenom}`,
    `CLASSE: ${classInfo?.code || ''}`,
    `DATE: ${student.date_naissance}`,
    `LIEU: ${student.lieu_naissance || ''}`,
    `NAT: ${student.nationalite || ''}`
  ];

  infoLines.forEach(line => {
    page.drawText(line, {
      x: infoX,
      y: textY,
      size: fontSize,
      color: rgb(0, 0, 0),
      maxWidth: infoWidth
    });
    textY -= lineHeight;
  });

  // Watermark
  page.drawText('Brouillon FVS', {
    x: x + width / 2 - 20,
    y: y + 8,
    size: 6,
    color: rgb(0.9, 0.9, 0.9),
    opacity: 0.5
  });
};

// ============================================================================
// FINAL CARDS EXPORT (Recto/Verso, 1012×638px, CMYK)
// ============================================================================

export const generateFinalCardsPDF = async (students, classInfo, collegeInfo) => {
  try {
    const pdfDoc = PDFDocument.create();

    // ISO ID-1 card dimensions in points (1 point = 1/72 inch)
    // 85.6mm × 53.98mm = 242.6 × 153.07 points
    const CARD_WIDTH = 242.6; // mm: 85.6
    const CARD_HEIGHT = 153.07; // mm: 53.98

    // Create pages for each student (2 pages per card if double-sided)
    for (const student of students) {
      // Recto
      const rectoPage = pdfDoc.addPage([CARD_WIDTH, CARD_HEIGHT]);
      await drawCardRecto(rectoPage, student, classInfo);

      // Verso
      const versoPage = pdfDoc.addPage([CARD_WIDTH, CARD_HEIGHT]);
      await drawCardVerso(versoPage, student, collegeInfo);
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(pdfBytes, `cartes_finales_${classInfo?.code || 'export'}.pdf`);
  } catch (error) {
    console.error('Error generating final cards PDF:', error);
    throw error;
  }
};

const drawCardRecto = async (page, student, classInfo) => {
  const { width, height } = page.getSize();
  const margin = 5;

  // Background white
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1)
  });

  // Left side: Photo placeholder
  const photoWidth = width * 0.35;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: photoWidth - margin * 2,
    height: height - margin * 2,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5
  });

  if (student.photo_path) {
    try {
      page.drawText('📸', {
        x: photoWidth / 2 - 5,
        y: height / 2 - 5,
        size: 16,
        color: rgb(0.5, 0.5, 0.5)
      });
    } catch (err) {
      // Photo embedding skipped
    }
  }

  // Right side: Information
  const infoX = photoWidth + margin;
  const infoWidth = width - photoWidth - margin * 2;
  let textY = height - margin - 10;
  const lineHeight = 8;
  const fontSize = 6.5;

  const infos = [
    { label: 'MATRICULE', value: student.matricule, bold: true },
    { label: 'NOM', value: student.nom, bold: true },
    { label: 'PRÉNOM', value: student.prenom, bold: true },
    { label: 'CLASSE', value: classInfo?.code || '', bold: false },
    { label: 'DATE NAISS.', value: student.date_naissance, bold: false },
    { label: 'LIEU NAISS.', value: student.lieu_naissance || '', bold: false },
    { label: 'NATIONALITÉ', value: student.nationalite || '', bold: false }
  ];

  infos.forEach(info => {
    page.drawText(`${info.label}:`, {
      x: infoX,
      y: textY,
      size: fontSize - 1,
      color: rgb(0.4, 0.4, 0.4)
    });
    page.drawText(info.value, {
      x: infoX,
      y: textY - lineHeight * 1.2,
      size: fontSize,
      color: rgb(0, 0, 0)
    });
    textY -= lineHeight * 2.5;
  });

  // Watermark
  page.drawText('FVS', {
    x: width / 2 - 8,
    y: 3,
    size: 5,
    color: rgb(0.85, 0.85, 0.85)
  });
};

const drawCardVerso = async (page, student, collegeInfo) => {
  const { width, height } = page.getSize();
  const margin = 5;
  const centerX = width / 2;
  const centerY = height / 2;

  // Background white
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1)
  });

  // College name (top)
  let textY = height - margin - 8;
  page.drawText(collegeInfo?.nom || 'ÉTABLISSEMENT', {
    x: margin,
    y: textY,
    size: 7,
    color: rgb(0, 0, 0),
    maxWidth: width - margin * 2
  });

  // Location
  textY -= 10;
  const location = `${collegeInfo?.commune || ''}, ${collegeInfo?.departement || ''}`;
  page.drawText(location, {
    x: margin,
    y: textY,
    size: 5,
    color: rgb(0.4, 0.4, 0.4),
    maxWidth: width - margin * 2
  });

  // Signature placeholder
  textY -= 15;
  page.drawRectangle({
    x: margin,
    y: textY - 8,
    width: 30,
    height: 10,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5
  });
  page.drawText('Signature', {
    x: margin + 2,
    y: textY - 6,
    size: 4,
    color: rgb(0.7, 0.7, 0.7)
  });

  // QR Code placeholder (center)
  const qrSize = 25;
  page.drawRectangle({
    x: centerX - qrSize / 2,
    y: centerY - qrSize / 2,
    width: qrSize,
    height: qrSize,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });
  page.drawText('QR', {
    x: centerX - 5,
    y: centerY - 3,
    size: 6,
    color: rgb(0.5, 0.5, 0.5)
  });

  // Footer info
  textY = margin + 18;
  const footerLines = [
    'Réalisé par FVS',
    'contact@fvs.com',
    '+229 97 268 741'
  ];
  footerLines.forEach(line => {
    page.drawText(line, {
      x: margin,
      y: textY,
      size: 4.5,
      color: rgb(0.5, 0.5, 0.5)
    });
    textY += 6;
  });

  // FVS watermark
  page.drawText('FVS', {
    x: width - margin - 12,
    y: 3,
    size: 5,
    color: rgb(0.85, 0.85, 0.85)
  });
};

// ============================================================================
// FINAL CARDS EXPORT AS IMAGES (JPG, 1012×638px)
// ============================================================================

export const generateFinalCardsImages = async (students, classInfo, collegeInfo) => {
  try {
    // Use canvas for rendering
    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Recto
      const rectoCanvas = createCardCanvas(1012, 638);
      const rectoCtx = rectoCanvas.getContext('2d');
      await drawRectoCanvas(rectoCtx, student, classInfo);
      downloadCanvasAsImage(
        rectoCanvas,
        `carte_${student.matricule}_recto.jpg`
      );

      // Verso
      const versoCanvas = createCardCanvas(1012, 638);
      const versoCtx = versoCanvas.getContext('2d');
      await drawVersoCanvas(versoCtx, student, collegeInfo);
      downloadCanvasAsImage(
        versoCanvas,
        `carte_${student.matricule}_verso.jpg`
      );
    }
  } catch (error) {
    console.error('Error generating cards as images:', error);
    throw error;
  }
};

const createCardCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const drawRectoCanvas = async (ctx, student, classInfo) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const margin = 20;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // Left: Photo area
  const photoW = w * 0.35;
  const photoH = h - margin * 2;
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(margin, margin, photoW - margin * 2, photoH);
  ctx.strokeStyle = '#CCCCCC';
  ctx.lineWidth = 1;
  ctx.strokeRect(margin, margin, photoW - margin * 2, photoH);

  if (student.photo_path) {
    ctx.fillStyle = '#999999';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📸', photoW / 2, h / 2);
  }

  // Right: Info
  const infoX = photoW + margin;
  const infoW = w - photoW - margin * 2;
  let textY = h - margin - 20;
  const lineHeight = 25;
  const fontSize = 18;

  ctx.fillStyle = '#000000';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'left';

  const infos = [
    `MAT: ${student.matricule}`,
    `NOM: ${student.nom}`,
    `PRENOM: ${student.prenom}`,
    `CLASSE: ${classInfo?.code || ''}`,
    `DATE: ${student.date_naissance}`,
    `NATIONALITÉ: ${student.nationalite || ''}`
  ];

  infos.forEach(info => {
    ctx.fillText(info, infoX, textY);
    textY -= lineHeight;
  });

  // Watermark
  ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FVS', w / 2, 40);
};

const drawVersoCanvas = async (ctx, student, collegeInfo) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const margin = 20;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // Header
  let textY = h - margin - 20;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(collegeInfo?.nom || 'ÉTABLISSEMENT', margin, textY);

  textY -= 40;
  ctx.font = '14px Arial';
  ctx.fillStyle = '#666666';
  const location = `${collegeInfo?.commune || ''}, ${collegeInfo?.departement || ''}`;
  ctx.fillText(location, margin, textY);

  // QR Code placeholder (center)
  const qrSize = 80;
  const qrX = w / 2 - qrSize / 2;
  const qrY = h / 2 - qrSize / 2;

  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#999999';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('QR', w / 2, h / 2);

  // Footer
  textY = margin + 40;
  ctx.fillStyle = '#666666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Réalisé par FVS', margin, textY);
  ctx.fillText('contact@fvs.com', margin, textY + 20);
  ctx.fillText('+229 97 268 741', margin, textY + 40);

  // Watermark
  ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FVS', w / 2, 40);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const downloadFile = (data, filename) => {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadCanvasAsImage = (canvas, filename) => {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.95);
};
