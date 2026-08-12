import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);

  const status = err.status || 500;
  const message = err.message || 'Erreur serveur interne';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res) => {
  logger.warn(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route non trouvée' });
};
