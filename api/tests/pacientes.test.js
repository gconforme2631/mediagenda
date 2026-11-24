// Pruebas del módulo Pacientes: validaciones y API con node:test y una base de datos en memoria.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { openDatabase, closeDatabase, getDb } from '../src/config/database.js';
import { validarCedula, validarPaciente } from '../src/validations/pacientes.validation.js';

const PACIENTE = {
  cedula: '1312345679',
  nombres: 'María José',
  apellidos: 'Muñoz Peña',
  fecha_nacimiento: '1995-02-28',
  telefono: '0991234567',
  correo: 'maria@correo.com',
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

async function crearPaciente(datos = {}) {
  const { cuerpo } = await pedir('POST', '', { ...PACIENTE, ...datos });
  return cuerpo;
}

function agregarCita(pacienteId) {
  const db = getDb();
  const medico = db
    .prepare(
      `INSERT INTO medicos (nombres, apellidos, especialidad, telefono, correo)
       VALUES ('Luis', 'Mora', 'Pediatría', '0987654321', 'luis@correo.com')
       RETURNING id`,
    )
    .get();
  db.prepare(
    `INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo)
     VALUES (?, ?, '2026-12-01', '08:00', 'Control')`,
  ).run(pacienteId, medico.id);
}

function fechaISO(diasDesdeHoy) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

before(async () => {
  openDatabase(':memory:');
  await new Promise((listo) => {
    servidor = createApp().listen(0, listo);
  });
  url = `http://localhost:${servidor.address().port}/api/pacientes`;
});

after(() => {
  servidor.close();
  closeDatabase();
});

beforeEach(() => {
  getDb().exec('DELETE FROM citas; DELETE FROM pacientes; DELETE FROM medicos;');
});

// ===== Validaciones =====

describe('validarCedula', () => {
  it('acepta cédulas ecuatorianas válidas', () => {
    for (const cedula of ['1312345679', '1712345675', '0923456784']) {
      assert.equal(validarCedula(cedula), true, cedula);
    }
  });

  it('rechaza un dígito verificador incorrecto', () => {
    assert.equal(validarCedula('1312345678'), false);
  });

  it('rechaza provincia inexistente y tercer dígito mayor o igual a 6', () => {
    assert.equal(validarCedula('2512345678'), false);
    assert.equal(validarCedula('1362345678'), false);
  });

  it('rechaza longitudes distintas de 10 y caracteres no numéricos', () => {
    for (const cedula of ['131234567', '13123456790', '13123456a9', '']) {
      assert.equal(validarCedula(cedula), false, cedula);
    }
  });
});

describe('validarPaciente', () => {
  it('normaliza espacios y correo', () => {
    const paciente = validarPaciente({
      ...PACIENTE,
      cedula: ' 1312345679 ',
      nombres: '  María   José ',
      correo: ' Maria@Correo.COM ',
    });

    assert.deepEqual(paciente, PACIENTE);
  });

  it('rechaza una fecha de nacimiento futura', () => {
    assert.throws(() => validarPaciente({ ...PACIENTE, fecha_nacimiento: fechaISO(1) }), {
      name: 'ErrorValidacion',
      errores: { fecha_nacimiento: 'La fecha de nacimiento no puede ser futura' },
    });
  });

  it('acepta la fecha de hoy y rechaza fechas inexistentes', () => {
    assert.doesNotThrow(() => validarPaciente({ ...PACIENTE, fecha_nacimiento: fechaISO(0) }));
    assert.throws(() => validarPaciente({ ...PACIENTE, fecha_nacimiento: '2025-02-30' }), {
      errores: { fecha_nacimiento: 'La fecha no es válida' },
    });
  });

  it('rechaza nombres y apellidos con números o símbolos', () => {
    assert.throws(() => validarPaciente({ ...PACIENTE, nombres: 'Ana2', apellidos: 'Pérez-' }), {
      errores: { nombres: 'Solo se permiten letras', apellidos: 'Solo se permiten letras' },
    });
  });
});

// ===== API =====

describe('GET /api/pacientes', () => {
  it('devuelve los pacientes ordenados por apellidos', async () => {
    await crearPaciente();
    await crearPaciente({ cedula: '1712345675', apellidos: 'Álava', correo: 'ana@correo.com' });

    const { status, cuerpo } = await pedir('GET');

    assert.equal(status, 200);
    assert.deepEqual(
      cuerpo.map((paciente) => paciente.cedula),
      ['1712345675', '1312345679'],
    );
  });
});

describe('POST /api/pacientes', () => {
  it('crea el paciente con los datos normalizados', async () => {
    const { status, cuerpo } = await pedir('POST', '', {
      ...PACIENTE,
      nombres: '  María   José ',
      correo: ' Maria@Correo.COM ',
    });

    assert.equal(status, 201);
    assert.deepEqual(cuerpo, { ...PACIENTE, id: cuerpo.id });
  });

  it('responde 400 con el error de cada campo', async () => {
    const { status, cuerpo } = await pedir('POST', '', {});

    assert.equal(status, 400);
    assert.equal(cuerpo.mensaje, 'Datos inválidos');
    assert.deepEqual(Object.keys(cuerpo.errores).sort(), Object.keys(PACIENTE).sort());
  });

  it('responde 400 si la cédula no es válida', async () => {
    const { status, cuerpo } = await pedir('POST', '', { ...PACIENTE, cedula: '1312345678' });

    assert.equal(status, 400);
    assert.equal(cuerpo.errores.cedula, 'La cédula no es válida');
  });

  it('responde 409 si la cédula ya existe', async () => {
    await crearPaciente();

    const { status, cuerpo } = await pedir('POST', '', { ...PACIENTE, correo: 'otra@correo.com' });

    assert.equal(status, 409);
    assert.equal(cuerpo.mensaje, 'Ya existe un paciente con esa cédula');
  });
});

describe('GET /api/pacientes/:id', () => {
  it('devuelve el paciente', async () => {
    const paciente = await crearPaciente();

    const { status, cuerpo } = await pedir('GET', `/${paciente.id}`);

    assert.equal(status, 200);
    assert.deepEqual(cuerpo, paciente);
  });

  it('responde 404 si no existe', async () => {
    const { status, cuerpo } = await pedir('GET', '/999');

    assert.equal(status, 404);
    assert.equal(cuerpo.mensaje, 'Paciente no encontrado');
  });

  it('responde 400 si el id no es un entero positivo', async () => {
    for (const id of ['abc', '0', '-5']) {
      const { status } = await pedir('GET', `/${id}`);
      assert.equal(status, 400, id);
    }
  });
});

describe('PUT /api/pacientes/:id', () => {
  it('actualiza el paciente conservando su cédula', async () => {
    const paciente = await crearPaciente();

    const { status, cuerpo } = await pedir('PUT', `/${paciente.id}`, {
      ...PACIENTE,
      telefono: '0987654321',
    });

    assert.equal(status, 200);
    assert.equal(cuerpo.telefono, '0987654321');
  });

  it('responde 409 si la cédula pertenece a otro paciente', async () => {
    const paciente = await crearPaciente();
    await crearPaciente({ cedula: '1712345675', correo: 'ana@correo.com' });

    const { status } = await pedir('PUT', `/${paciente.id}`, { ...PACIENTE, cedula: '1712345675' });

    assert.equal(status, 409);
  });

  it('responde 404 si no existe', async () => {
    const { status } = await pedir('PUT', '/999', PACIENTE);

    assert.equal(status, 404);
  });
});

describe('DELETE /api/pacientes/:id', () => {
  it('elimina el paciente', async () => {
    const paciente = await crearPaciente();

    const eliminacion = await pedir('DELETE', `/${paciente.id}`);
    const consulta = await pedir('GET', `/${paciente.id}`);

    assert.equal(eliminacion.status, 204);
    assert.equal(consulta.status, 404);
  });

  it('responde 409 si el paciente tiene citas', async () => {
    const paciente = await crearPaciente();
    agregarCita(paciente.id);

    const { status, cuerpo } = await pedir('DELETE', `/${paciente.id}`);

    assert.equal(status, 409);
    assert.equal(cuerpo.mensaje, 'No se puede eliminar un paciente con citas registradas');
  });

  it('responde 404 si no existe', async () => {
    const { status } = await pedir('DELETE', '/999');

    assert.equal(status, 404);
  });
});