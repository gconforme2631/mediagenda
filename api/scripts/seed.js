// Carga los datos de prueba de db/seed.sql en la base configurada en .env.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openDatabase, closeDatabase } from '../src/config/database.js';

const SEED_PATH = fileURLToPath(new URL('../../db/seed.sql', import.meta.url));

const db = openDatabase();
db.exec(readFileSync(SEED_PATH, 'utf8'));

const total = (tabla) => db.prepare(`SELECT COUNT(*) AS total FROM ${tabla}`).get().total;
console.log(
  `Datos de prueba cargados: ${total('pacientes')} pacientes, ${total('medicos')} médicos, ${total('citas')} citas`,
);

closeDatabase();