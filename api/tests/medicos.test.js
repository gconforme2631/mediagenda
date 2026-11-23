// Pruebas de la API de médicos con node:test y una base de datos en memoria.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { openDatabase, closeDatabase, getDb } from '../src/config/database.js';

const MEDICO = {
  nombres: 'Luis',
  apellidos: 'Mora',
  especialidad: 'Pediatría',
  telefono: '0987654321',
  correo: 'luis@correo.com',
};

let servidor;
let url;

async function pedir(metodo, ruta = '', cuerpo) {
  const respuesta = await fetch(`${url}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo && JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  return { status: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
}

async function crearMedico(datos = {}) {
  const { cuerpo } = await pedir('POST', '', { ...MEDICO, ...datos });
  return cuerpo;
}

function agregarCita(medicoId) {
  const db = getDb();
  const paciente = db
    .prepare(
      `INSERT INTO pacientes (cedula, nombres, apellidos, fecha_nacimiento, telefono, correo)
       VALUES ('1710034065', 'Eva', 'Paz', '1990-01-01', '0991234567', 'eva@correo.com')
       RETURNING id`,
    )
    .get();
  db.prepare(
    `INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo)
     VALUES (?, ?, '2026-12-01', '08:00', 'Control')`,
  ).run(paciente.id, medicoId);
}

before(async () => {
  openDatabase(':memory:');
  await new Promise((listo) => {
    servidor = createApp().listen(0, listo);
  });
  url = `http://localhost:${servidor.address().port}/api/medicos`;
});

after(() => {
  servidor.close();
  closeDatabase();
});

beforeEach(() => {
  getDb().exec(
    'DELETE FROM citas; DELETE FROM pacientes; DELETE FROM medicos;',
  );
});

describe('GET /api/medicos', () => {
  it('devuelve los médicos ordenados por apellidos', async () => {
    await crearMedico();
    await crearMedico({ apellidos: 'Alvarez', correo: 'ana@correo.com' });

    const { status, cuerpo } = await pedir('GET');

    assert.equal(status, 200);
    assert.deepEqual(
      cuerpo.map((medico) => medico.apellidos),
      ['Alvarez', 'Mora'],
    );
  });
});

describe('POST /api/medicos', () => {
  it('crea el médico con los datos normalizados', async () => {
    const { status, cuerpo } = await pedir('POST', '', {
      ...MEDICO,
      nombres: '  José   Luis ',
      correo: ' Luis@Correo.COM ',
    });

    assert.equal(status, 201);
    assert.deepEqual(cuerpo, {
      ...MEDICO,
      id: cuerpo.id,
      nombres: 'José Luis',
    });
  });

  it('responde 400 con el error de cada campo', async () => {
    const { status, cuerpo } = await pedir('POST', '', {});

    assert.equal(status, 400);
    assert.deepEqual(Object.keys(cuerpo.errores), Object.keys(MEDICO));
  });

  it('responde 409 si el correo ya existe, sin importar mayúsculas', async () => {
    await crearMedico();

    const { status } = await pedir('POST', '', {
      ...MEDICO,
      correo: 'LUIS@correo.com',
    });

    assert.equal(status, 409);
  });
});

describe('GET /api/medicos/:id', () => {
  it('devuelve el médico', async () => {
    const medico = await crearMedico();

    const { status, cuerpo } = await pedir('GET', `/${medico.id}`);

    assert.equal(status, 200);
    assert.deepEqual(cuerpo, medico);
  });

  it('responde 404 si no existe', async () => {
    const { status } = await pedir('GET', '/999');

    assert.equal(status, 404);
  });

  it('responde 400 si el id no es un entero positivo', async () => {
    const { status } = await pedir('GET', '/abc');

    assert.equal(status, 400);
  });
});

describe('PUT /api/medicos/:id', () => {
  it('actualiza el médico conservando su correo', async () => {
    const medico = await crearMedico();

    const { status, cuerpo } = await pedir('PUT', `/${medico.id}`, {
      ...MEDICO,
      especialidad: 'Cardiología',
    });

    assert.equal(status, 200);
    assert.equal(cuerpo.especialidad, 'Cardiología');
  });

  it('responde 409 si el correo pertenece a otro médico', async () => {
    const medico = await crearMedico();
    await crearMedico({ correo: 'ana@correo.com' });

    const { status } = await pedir('PUT', `/${medico.id}`, {
      ...MEDICO,
      correo: 'ana@correo.com',
    });

    assert.equal(status, 409);
  });

  it('responde 404 si no existe', async () => {
    const { status } = await pedir('PUT', '/999', MEDICO);

    assert.equal(status, 404);
  });
});

describe('DELETE /api/medicos/:id', () => {
  it('elimina el médico', async () => {
    const medico = await crearMedico();

    const eliminacion = await pedir('DELETE', `/${medico.id}`);
    const consulta = await pedir('GET', `/${medico.id}`);

    assert.equal(eliminacion.status, 204);
    assert.equal(consulta.status, 404);
  });

  it('responde 409 si el médico tiene citas', async () => {
    const medico = await crearMedico();
    agregarCita(medico.id);

    const { status } = await pedir('DELETE', `/${medico.id}`);

    assert.equal(status, 409);
  });

  it('responde 404 si no existe', async () => {
    const { status } = await pedir('DELETE', '/999');

    assert.equal(status, 404);
  });
});
