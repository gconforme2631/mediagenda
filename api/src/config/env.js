// Configuración de la API leída desde .env, con valores por defecto.
export const env = Object.freeze({
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? '../db/mediagenda.db', // relativa a la carpeta api
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
});