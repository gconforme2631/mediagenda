// Construcción de la aplicación Express: middlewares, rutas y manejo de errores.
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import saludRoutes from './routes/salud.routes.js';
import pacientesRoutes from './routes/pacientes.routes.js';
import medicosRoutes from './routes/medicos.routes.js';
import citasRoutes from './routes/citas.routes.js';
import { rutaNoEncontrada, manejadorErrores } from './middlewares/errores.middleware.js';

export function createApp() {
  const app = express();

  // Middlewares
  app.use(cors({ origin: env.corsOrigin })); // solo admite peticiones del frontend
  app.use(express.json());

  // Rutas
  app.use('/api/salud', saludRoutes);
  app.use('/api/pacientes', pacientesRoutes);
  app.use('/api/medicos', medicosRoutes);

   app.use('/api/citas', citasRoutes);

  // Manejo de errores (siempre al final)
  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}