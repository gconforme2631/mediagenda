// Conexión única a SQLite: activa claves foráneas y aplica db/schema.sql.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env } from './env.js';

const API_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCHEMA_PATH = fileURLToPath(new URL('../../../db/schema.sql', import.meta.url));

let db = null;

// ':memory:' crea una base temporal (pruebas)
export function openDatabase(filename = env.dbPath) {
  if (db) return db;

  const location = filename === ':memory:' ? filename : path.resolve(API_ROOT, filename);

  db = new DatabaseSync(location);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'));

  return db;
}

export function getDb() {
  return db ?? openDatabase();
}

export function closeDatabase() {
  db?.close();
  db = null;
}