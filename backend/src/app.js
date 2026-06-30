require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const destinoRoutes = require('./routes/destinoRoutes');
const authRoutes = require('./routes/authRoutes');
const favoritoRoutes = require('./routes/favoritoRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const destinoController = require('./controllers/destinoController');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'travseeker-api' });
});

app.get('/api/destacados', destinoController.getDestacados);
app.get('/api/stats', destinoController.getStats);
app.get('/api/mapa', destinoController.getMapa);
app.use('/api/auth', authRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/colecciones', collectionRoutes);
app.use('/api/recomendaciones', recommendationRoutes);
app.use('/api/destinos/:destinoId/reviews', reviewRoutes);
app.use('/api/destinos', destinoRoutes);

app.use(errorHandler);

module.exports = app;
