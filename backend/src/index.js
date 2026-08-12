import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import collegeRoutes from './routes/collegeRoutes.js';
import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static('./uploads'));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/locations', locationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;