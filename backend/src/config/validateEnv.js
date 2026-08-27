import logger from './logger.js';

// Variables sans lesquelles l'app ne doit PAS démarrer.
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'CRON_SECRET',
  'KKIAPAY_PRIVATE_KEY',
  'KKIAPAY_PUBLIC_KEY',
  'KKIAPAY_SECRET_KEY',
  'KKIAPAY_WEBHOOK_SECRET',
  'KKIAPAY_SANDBOX', // volontairement obligatoire : absence = mode PROD silencieux, trop risqué
  'BREVO_API_KEY',
  'SENDER_EMAIL',
];

// Variables optionnelles : un défaut existe déjà dans le code, ou l'impact
// d'une absence est mineur (juste un avertissement en log).
const OPTIONAL_WITH_DEFAULT = [
  { name: 'FRONTEND_URL', fallback: 'http://localhost:3000' },
  { name: 'RENEWAL_PRICE_XOF', fallback: '15000' },
  { name: 'CORS_ORIGIN', fallback: '*' },
  { name: 'PORT', fallback: '3001' },
  { name: 'LOG_LEVEL', fallback: 'info' },
  { name: 'LOG_FILE', fallback: '(non défini — logs console uniquement)' },
  { name: 'SENDER_NAME', fallback: '(non défini)' },
  { name: 'SUPABASE_STORAGE_BUCKET', fallback: '(à confirmer si requis)' },
  { name: 'NODE_ENV', fallback: 'development' },
];

export function validateEnv() {
  const missing = REQUIRED.filter((name) => !process.env[name] || process.env[name].trim() === '');
  const isProd = process.env.NODE_ENV === 'production';

  if (missing.length > 0) {
    if (isProd) {
      logger.error('❌ Démarrage impossible — variables d\'environnement requises manquantes :');
      missing.forEach((name) => logger.error(`   - ${name}`));
      logger.error('Vérifiez la configuration Render.');
      process.exit(1);
    } else {
      logger.warn('⚠️  Variables d\'environnement manquantes (toléré en dev, sera bloquant en production) :');
      missing.forEach((name) => logger.warn(`   - ${name}`));
    }
  }

  OPTIONAL_WITH_DEFAULT.forEach(({ name, fallback }) => {
    if (!process.env[name] || process.env[name].trim() === '') {
      logger.warn(`⚠️  ${name} non définie — valeur par défaut utilisée : ${fallback}`);
    }
  });

  // Garde-fou explicite : on force à voir clairement si on tourne en mode
  // production réel de paiement, pour éviter une confusion coûteuse.
if (process.env.KKIAPAY_SANDBOX === 'true') {
  logger.info('💳 KKiaPay en mode SANDBOX (aucun paiement réel ne sera traité)');
} else if (process.env.KKIAPAY_SANDBOX === 'false') {
  logger.warn('💳 KKiaPay en mode PRODUCTION — les paiements réels seront traités.');
} else {
  logger.warn('💳 KKIAPAY_SANDBOX non définie — comportement par défaut du SDK incertain, à vérifier avant tout test de paiement.');
}

  logger.info('✅ Variables d\'environnement validées.');
}