-- Esquema de la base de datos de MediAgenda (SQLite).
CREATE TABLE IF NOT EXISTS pacientes (
  id               INTEGER PRIMARY KEY,
  cedula           TEXT    NOT NULL UNIQUE CHECK (length(cedula) = 10 AND cedula NOT GLOB '*[^0-9]*'),
  nombres          TEXT    NOT NULL CHECK (trim(nombres) <> ''),
  apellidos        TEXT    NOT NULL CHECK (trim(apellidos) <> ''),
  fecha_nacimiento TEXT    NOT NULL CHECK (date(fecha_nacimiento) IS fecha_nacimiento),
  telefono         TEXT    NOT NULL CHECK (telefono GLOB '09[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
  correo           TEXT    NOT NULL CHECK (correo LIKE '%_@_%._%')
) STRICT;

CREATE TABLE IF NOT EXISTS medicos (
  id           INTEGER PRIMARY KEY,
  nombres      TEXT    NOT NULL CHECK (trim(nombres) <> ''),
  apellidos    TEXT    NOT NULL CHECK (trim(apellidos) <> ''),
  especialidad TEXT    NOT NULL CHECK (trim(especialidad) <> ''),
  telefono     TEXT    NOT NULL CHECK (telefono GLOB '09[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
  correo       TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (correo LIKE '%_@_%._%')
) STRICT;

CREATE TABLE IF NOT EXISTS citas (
  id          INTEGER PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes (id) ON DELETE RESTRICT,
  medico_id   INTEGER NOT NULL REFERENCES medicos (id) ON DELETE RESTRICT,
  fecha       TEXT    NOT NULL CHECK (date(fecha) IS fecha),
  hora        TEXT    NOT NULL CHECK (
                strftime('%H:%M', hora) IS hora
                AND substr(hora, 4, 2) IN ('00', '30')
                AND hora BETWEEN '08:00' AND '16:30'
              ),
  motivo      TEXT    NOT NULL CHECK (trim(motivo) <> ''),
  estado      TEXT    NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'atendida', 'cancelada'))
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_citas_medico_horario
  ON citas (medico_id, fecha, hora) WHERE estado <> 'cancelada';

CREATE UNIQUE INDEX IF NOT EXISTS ux_citas_paciente_horario
  ON citas (paciente_id, fecha, hora) WHERE estado <> 'cancelada';

CREATE INDEX IF NOT EXISTS idx_citas_medico ON citas (medico_id, fecha);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas (fecha, hora);