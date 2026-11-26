-- Datos de prueba de MediAgenda. Idempotente: puede ejecutarse varias veces sin duplicar registros.
-- Las fechas de las citas son relativas al día de la carga.

BEGIN;

-- Pacientes (cédulas ecuatorianas válidas)
INSERT OR IGNORE INTO pacientes (cedula, nombres, apellidos, fecha_nacimiento, telefono, correo) VALUES
  ('0104567896', 'María José',    'Muñoz Peña',      '1995-02-28', '0991234567', 'maria.munoz@correo.com'),
  ('0912345675', 'Luis Alberto',  'Álava Ortiz',     '1988-03-15', '0987654321', 'luis.alava@correo.com'),
  ('1319876544', 'Ñusta',         'Güemes Quishpe',  '2001-12-01', '0998887766', 'nusta.guemes@correo.com'),
  ('1701234567', 'Carlos Andrés', 'Zambrano Vera',   '1970-07-20', '0961112233', 'carlos.zambrano@correo.com'),
  ('1805554449', 'Ana Lucía',     'Paredes Toapanta','1999-09-09', '0974445566', 'ana.paredes@correo.com'),
  ('2405678901', 'Jorge',         'Cedeño Macías',   '1965-01-30', '0952223344', 'jorge.cedeno@correo.com');

-- Médicos
INSERT OR IGNORE INTO medicos (nombres, apellidos, especialidad, telefono, correo) VALUES
  ('Elena',   'Ríos Castillo',  'Medicina General', '0991110001', 'elena.rios@mediagenda.ec'),
  ('Patricio','Andrade Loor',   'Pediatría',        '0991110002', 'patricio.andrade@mediagenda.ec'),
  ('Sofía',   'Benítez Mora',   'Cardiología',      '0991110003', 'sofia.benitez@mediagenda.ec'),
  ('Raúl',    'Íñiguez Salazar','Dermatología',     '0991110004', 'raul.iniguez@mediagenda.ec');

-- Citas: (cédula del paciente, correo del médico, días desde hoy, hora, motivo, estado)
WITH datos (cedula, correo, dias, hora, motivo, estado) AS (
  VALUES
    ('0104567896', 'elena.rios@mediagenda.ec',       -2, '09:00', 'Control general',            'atendida'),
    ('0912345675', 'sofia.benitez@mediagenda.ec',    -1, '10:30', 'Revisión de presión arterial','atendida'),
    ('1319876544', 'raul.iniguez@mediagenda.ec',     -1, '11:00', 'Consulta por alergia',       'cancelada'),
    ('0104567896', 'elena.rios@mediagenda.ec',        1, '08:00', 'Resultados de laboratorio',  'programada'),
    ('1701234567', 'sofia.benitez@mediagenda.ec',     1, '08:30', 'Electrocardiograma',         'programada'),
    ('1805554449', 'patricio.andrade@mediagenda.ec',  1, '09:00', 'Control pediátrico',         'programada'),
    ('2405678901', 'elena.rios@mediagenda.ec',        1, '14:00', 'Dolor de espalda',           'cancelada'),
    ('0912345675', 'raul.iniguez@mediagenda.ec',      2, '10:00', 'Revisión de lunares',        'programada'),
    ('1319876544', 'elena.rios@mediagenda.ec',        2, '15:30', 'Certificado médico',         'programada'),
    ('2405678901', 'sofia.benitez@mediagenda.ec',     3, '16:30', 'Seguimiento cardiológico',   'programada')
)
INSERT OR IGNORE INTO citas (paciente_id, medico_id, fecha, hora, motivo, estado)
SELECT p.id, m.id, date('now', 'localtime', d.dias || ' days'), d.hora, d.motivo, d.estado
FROM datos d
JOIN pacientes p ON p.cedula = d.cedula
JOIN medicos m ON m.correo = d.correo
WHERE NOT EXISTS (
  SELECT 1 FROM citas c
  WHERE c.paciente_id = p.id
    AND c.medico_id = m.id
    AND c.fecha = date('now', 'localtime', d.dias || ' days')
    AND c.hora = d.hora
);

COMMIT;