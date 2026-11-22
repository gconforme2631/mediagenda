// Construcción de la aplicación Express: middlewares y registro de rutas.
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import saludRoutes from './routes/salud.routes.js';

export function createApp() {
  const app = express();

  // Middlewares
  app.use(cors({ origin: env.corsOrigin })); // solo admite peticiones del frontend
  app.use(express.json());

  // Rutas
  app.use('/api/salud', saludRoutes);

  return app;
}