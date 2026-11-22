// Punto de entrada: abre la base de datos e inicia el servidor HTTP.
import { createApp } from './app.js';
import { env } from './config/env.js';
import { openDatabase } from './config/database.js';

openDatabase();

createApp().listen(env.port, () => {
  console.log(`MediAgenda API en http://localhost:${env.port}`);
});