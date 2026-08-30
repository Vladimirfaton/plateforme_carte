import { College } from '../models/College.js';
import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import { AccessKey } from '../models/AccessKey.js';
import logger from '../config/logger.js';
import { uploadBuffer, deleteByPublicUrl } from '../utils/storage.js';
import { splitFullName, generateUsernameSuggestion } from '../utils/username.js';
import { sendActivationEmail } from '../utils/email.js';

const sendManagementActivationSafe = async ({ email, role, college, suggestedUsername, plainKey }) => {
  const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const activationBaseUrl = `${frontendBaseUrl}/activation-compte`;

  try {
    await sendActivationEmail(email, {
      role,
      collegeName: college.nom,
      suggestedUsername,
      accessKey: plainKey,
      activationUrl: `${activationBaseUrl}?email=${encodeURIComponent(email)}&key=${encodeURIComponent(plainKey)}&username=${encodeURIComponent(suggestedUsername || '')}`,
    });

    logger.info(`Activation email sent successfully for ${role} (${email})`);
    return { email, role, sent: true };
  } catch (error) {
    logger.error(`Activation email failed for ${role} (${email}): ${error.message}`);
    return { email, role, sent: false, error: error.message };
  }
};

export const createCollege = async (req, res) => {
  try {
    const {
      nom,
      commune,
      departement,
      directeur_nom,
      directeur_prenom,
      directeur_contact,
      email,
      telephone,
      slogan,
      secretaire_nom,
      secretaire_prenom,
      secretaire_telephone,
      secretaire_email,
    } = req.body;

    if (!nom || !commune || !departement) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const college = await College.create({
      nom,
      commune,
      departement,
      directeur_nom,
      directeur_prenom,
      directeur_contact,
      email,
      telephone,
      slogan,
      secretaire_nom,
      secretaire_prenom,
      secretaire_telephone,
      secretaire_email,
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

    if (college.signature_path) {
      await deleteByPublicUrl(college.signature_path);
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

    const newSignatureUrl = await uploadBuffer('signatures', req.file);

    if (college.signature_path) {
      await deleteByPublicUrl(college.signature_path);
    }

    const updatedCollege = await College.uploadSignature(id, newSignatureUrl);

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

// ============================================================================
// COMPTES DE GESTION (directeur / secrétaire) — écoles "prêtes à payer"
// ============================================================================

// POST /:id/comptes-gestion — admin sélectionne le collège, déclenche la création
// des 2 comptes. Si les infos secrétaire ne sont pas encore sur le collège,
// elles doivent être fournies dans le body de cette requête (formulaire "infos
// supplémentaires" côté frontend).
export const createManagementAccounts = async (req, res) => {
  try {
    const { id } = req.params;
    const { secretaire_nom, secretaire_prenom, secretaire_telephone, secretaire_email } = req.body;

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    const directeurEmail = (college.directeur_contact || '').trim() || (college.email || '').trim();
    if (!college.directeur_nom || !directeurEmail) {
      return res.status(400).json({
        error: 'Informations du directeur incomplètes sur ce collège (nom et email requis)',
      });
    }

    const existingAccounts = await User.findByCollege(id);
    if (existingAccounts.length > 0) {
      return res.status(409).json({ error: 'Des comptes de gestion existent déjà pour ce collège' });
    }

    // normaliser / tronquer les numéros pour respecter VARCHAR(20)
    const sanitizePhone = (p) => {
      if (!p) return null;
      const s = p.toString().trim().replace(/[^\d+]/g, '');
      return s.slice(0, 30);
    };

    let secretaireInfo = {
      nom: college.secretaire_nom,
      prenom: college.secretaire_prenom,
      telephone: sanitizePhone(college.secretaire_telephone),
      email: college.secretaire_email,
    };

    if (!secretaireInfo.nom || !secretaireInfo.prenom || !secretaireInfo.email) {
      if (!secretaire_nom || !secretaire_prenom || !secretaire_email) {
        return res.status(400).json({
          error: 'Informations de la secrétaire requises (nom, prénom, email)',
          code: 'SECRETAIRE_INFO_REQUIRED',
        });
      }
      await College.update(id, { secretaire_nom, secretaire_prenom, secretaire_telephone: sanitizePhone(secretaire_telephone), secretaire_email });
      secretaireInfo = {
        nom: secretaire_nom,
        prenom: secretaire_prenom,
        telephone: sanitizePhone(secretaire_telephone),
        email: secretaire_email,
      };
    }

    // Préférer le champ `directeur_prenom` si présent (on prend le premier prénom)
    let directeurPrenom = '';
    let directeurNom = '';
    if (college.directeur_prenom) {
      directeurPrenom = college.directeur_prenom.trim().split(/\s+/)[0];
      directeurNom = college.directeur_nom || '';
    } else {
      const split = splitFullName(college.directeur_nom);
      directeurPrenom = split.prenom;
      directeurNom = split.nom;
    }


      // Réserver immédiatement les usernames suggérés pour éviter les collisions
      const directeurSuggested = await User.suggestUniqueUsername(directeurPrenom, directeurNom);
      const secretaireSuggested = await User.suggestUniqueUsername(secretaireInfo.prenom, secretaireInfo.nom);

      const directeurAccount = await User.createManagementAccount({
        collegeId: id,
        role: 'directeur',
        nom: directeurNom,
        prenom: directeurPrenom,
        telephone: sanitizePhone(college.directeur_contact),
        email: directeurEmail,
        username: directeurSuggested,
      });

      const secretaireAccount = await User.createManagementAccount({
        collegeId: id,
        role: 'secretaire',
        nom: secretaireInfo.nom,
        prenom: secretaireInfo.prenom,
        telephone: secretaireInfo.telephone,
        email: secretaireInfo.email,
        username: secretaireSuggested,
      });

      const { plainKey } = await AccessKey.createPending(id, 'free');

      const emailResults = await Promise.all([
        sendManagementActivationSafe({
          email: directeurAccount.email,
          role: 'directeur',
          college,
          suggestedUsername: directeurSuggested,
          plainKey,
        }),
        sendManagementActivationSafe({
          email: secretaireAccount.email,
          role: 'secretaire',
          college,
          suggestedUsername: secretaireSuggested,
          plainKey,
        }),
      ]);

      const failedEmails = emailResults.filter((result) => !result.sent);
      logger.info(`Management accounts created for college ${id}`);

      res.status(201).json({
        directeur: directeurAccount,
        secretaire: secretaireAccount,
        emailStatus: {
          sent: emailResults.filter((result) => result.sent).length,
          failed: failedEmails,
        },
      });
  } catch (error) {
    logger.error(`Error creating management accounts: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la création des comptes de gestion' });
  }
};

export const getManagementAccounts = async (req, res) => {
  try {
    const { id } = req.params;
    const accounts = await User.findByCollege(id);
    res.json(accounts);
  } catch (error) {
    logger.error(`Error fetching management accounts: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
};

export const resendManagementActivationEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: 'Collège non trouvé' });
    }

    const accounts = await User.findByCollege(id);
    const pendingAccounts = accounts.filter((user) => user.status === 'pending_activation');
    if (!pendingAccounts.length) {
      return res.status(400).json({ error: 'Aucun compte en attente d’activation pour ce collège' });
    }

    const { plainKey: keyToSend } = await AccessKey.createPending(id, 'free');

    const emailResults = await Promise.all(
      pendingAccounts.map(async (account) => {
        const suggestedUsername = account.username || `${(account.prenom || '').trim()}${(account.nom || '').trim()}`.toLowerCase().replace(/\s+/g, '') || 'utilisateur';

        try {
          await sendActivationEmail(account.email, {
            role: account.role,
            collegeName: college.nom,
            suggestedUsername,
            accessKey: keyToSend,
            activationUrl: `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/activation-compte?email=${encodeURIComponent(account.email)}&key=${encodeURIComponent(keyToSend)}&username=${encodeURIComponent(suggestedUsername || '')}`,
          });

          logger.info(`Activation email resent successfully for ${account.role} (${account.email})`);
          return { email: account.email, role: account.role, sent: true };
        } catch (error) {
          logger.error(`Activation email resend failed for ${account.role} (${account.email}): ${error.message}`);
          return { email: account.email, role: account.role, sent: false, error: error.message };
        }
      })
    );

    const failedEmails = emailResults.filter((result) => !result.sent);
    logger.info(`Activation emails resent for college ${id}`);
    res.json({
      sent: emailResults.filter((result) => result.sent).length,
      failed: failedEmails,
      accounts: pendingAccounts.map((a) => ({ id: a.id, email: a.email, role: a.role })),
    });
  } catch (error) {
    logger.error(`Error resending management activation emails: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de l’envoi des liens d’activation' });
  }
};

// ============================================================================
// PAGE PUBLIQUE AFFICHEE AU SCAN DU QR CODE (verso de la carte d'identite scolaire)
// Pas d'authentification : cette page doit etre consultable par quiconque scanne
// une carte retrouvee (parent, bonne volonte, forces de l'ordre, etc.)
// ============================================================================

const escapeHtml = (value) =>
  (value ?? '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Meme regle que cote frontend (annee scolaire demarre en septembre)
const getSchoolYear = (date = new Date()) => {
  const y = date.getFullYear();
  return date.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const cardInfoPageLayout = ({ title, body }) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px 20px;
    background: #f7faf8;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif;
    color: #1e293b;
    display: flex; justify-content: center;
  }
  .card {
    width: 100%; max-width: 420px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 28px 24px;
    text-align: center;
  }
  .college-nom {
    font-size: 20px; font-weight: 700; color: #0f172a;
    margin: 0 0 4px;
    line-height: 1.25;
  }
  .college-loc {
    font-size: 13px; color: #64748b; margin: 0 0 20px;
  }
  .titre-carte {
    font-size: 13px; font-weight: 700; letter-spacing: .02em;
    color: #059669; text-transform: uppercase;
    margin: 0 0 20px;
  }
  .message {
    font-size: 15px; line-height: 1.55; color: #334155;
    margin: 0 0 18px;
  }
  .contact-box {
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 10px; padding: 14px 16px; margin: 0 0 20px;
  }
  .contact-label {
    font-size: 11px; text-transform: uppercase; letter-spacing: .04em;
    color: #059669; font-weight: 700; margin: 0 0 4px;
  }
  .contact-value {
    font-size: 17px; font-weight: 700; color: #0f172a;
  }
  .bande { display: flex; height: 5px; border-radius: 3px; overflow: hidden; margin: 0 0 16px; }
  .bande div { flex: 1; }
  .footer { font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="card">
    ${body}
    <div class="bande">
      <div style="background:#00873E"></div>
      <div style="background:#FCD900"></div>
      <div style="background:#E31C24"></div>
    </div>
    <div class="footer">Réalisé par FVS</div>
  </div>
</body>
</html>`;

const renderCardInfoPage = (college) => {
  const nom = escapeHtml(college.nom || 'Établissement');
  const loc = escapeHtml([college.commune, college.departement].filter(Boolean).join(', '));
  const annee = getSchoolYear();
  const telephone = college.telephone ? escapeHtml(college.telephone) : null;

  const body = `
    <p class="college-nom">${nom}</p>
    ${loc ? `<p class="college-loc">${loc}</p>` : ''}
    <p class="titre-carte">Carte d'identité scolaire — ${annee}</p>
    <p class="message">Le titulaire de cette carte est élève au ${nom}.</p>
    <p class="message" style="margin-bottom:8px;">En cas de perte, merci de bien vouloir contacter :</p>
    <div class="contact-box">
      <div class="contact-label">Contact de l'établissement</div>
      <div class="contact-value">${telephone || 'Voir avec l\u2019établissement'}</div>
    </div>
  `;

  return cardInfoPageLayout({ title: `${college.nom || 'Établissement'} — Carte d'identité scolaire`, body });
};

const renderNotFoundPage = () =>
  cardInfoPageLayout({
    title: 'Carte introuvable',
    body: `
      <p class="college-nom">Carte non reconnue</p>
      <p class="message">Cette carte ne correspond à aucun établissement enregistré sur la plateforme FVS.</p>
    `,
  });

const renderErrorPage = () =>
  cardInfoPageLayout({
    title: 'Erreur',
    body: `
      <p class="college-nom">Page indisponible</p>
      <p class="message">Une erreur est survenue. Merci de réessayer plus tard.</p>
    `,
  });

export const getCollegeCardInfoPage = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);

    if (!college) {
      res.status(404).set('Content-Type', 'text/html; charset=utf-8').send(renderNotFoundPage());
      return;
    }

    res.set('Content-Type', 'text/html; charset=utf-8').send(renderCardInfoPage(college));
  } catch (error) {
    logger.error(`Error rendering card info page: ${error.message}`);
    res.status(500).set('Content-Type', 'text/html; charset=utf-8').send(renderErrorPage());
  }
};