// Punto de entrada: inicia el servidor HTTP en el puerto configurado.
import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.port, () => {
  console.log(`MediAgenda API en http://localhost:${env.port}`);
});