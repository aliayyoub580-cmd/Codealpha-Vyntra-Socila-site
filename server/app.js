import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import followRoutes from './routes/followRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import postRoutes from './routes/postRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import repostRoutes from './routes/repostRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { getPublicConfig } from './controllers/authController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 180,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'Vyntra Social', tagline: 'Connect. Share. Grow.' });
});

app.get('/api/config/public', getPublicConfig);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes);
app.use('/api/posts', likeRoutes);
app.use('/api/posts', shareRoutes);
app.use('/api/posts', repostRoutes);
app.use('/api/users', followRoutes);

app.use(express.static(publicDir));

const pageFiles = {
  '/': 'index.html',
  '/home': 'index.html',
  '/explore': 'index.html',
  '/feed': 'index.html',
  '/login': 'login.html',
  '/register': 'register.html',
  '/profile': 'profile.html',
  '/post': 'post.html',
  '/create': 'create-post.html',
  '/settings': 'edit-profile.html'
};

Object.entries(pageFiles).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(publicDir, file));
  });
});

app.use('/api', notFoundHandler);

app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

app.use(errorHandler);

export default app;
