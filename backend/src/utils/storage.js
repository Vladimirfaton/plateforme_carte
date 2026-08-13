import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { supabase, STORAGE_BUCKET } from '../config/supabaseStorage.js';
import logger from '../config/logger.js';

const extFromMimetype = (mimetype) => {
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') return '.jpg';
  return '';
};

/**
 * Envoie un fichier (buffer en memoire, via multer.memoryStorage) vers Supabase
 * Storage et retourne son URL publique. C'est cette URL qui est stockee telle
 * quelle en DB (colonnes photo_path / signature_path).
 *
 * @param {string} folder - 'photos' ou 'signatures'
 * @param {{ buffer: Buffer, mimetype: string, originalname: string }} file - req.file (multer)
 */
export const uploadBuffer = async (folder, file) => {
  const ext = extFromMimetype(file.mimetype) || path.extname(file.originalname || '') || '';
  const key = `${folder}/${uuidv4()}${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(key, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) {
    logger.error(`Erreur upload Supabase Storage (${key}): ${error.message}`);
    throw new Error("Erreur lors de l'envoi du fichier vers le stockage");
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
};

/**
 * Supprime un fichier a partir de son URL publique complete. Ne fait rien si
 * l'URL ne correspond pas au bucket configure -- notamment le cas des anciens
 * chemins locaux (pre-migration), qu'on ignore silencieusement plutot que de
 * planter dessus.
 */
export const deleteByPublicUrl = async (publicUrl) => {
  if (!publicUrl) return;

  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // pas une URL Supabase Storage -> probablement un ancien fichier local, on ignore

  const key = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([key]);
  if (error) {
    logger.warn(`Impossible de supprimer ${key} du storage: ${error.message}`);
  }
};