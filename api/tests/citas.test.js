// Pruebas de la API de citas médicas con node:test
// y una base de datos SQLite en memoria.

import {
  describe,
  it,
  before,
  after,
  beforeEach
} from 'node:test';

import assert from 'node:assert/strict';

import { createApp } from '../src/app.js';

import {
  openDatabase,
  closeDatabase,
  getDb
} from '../src/config/database.js';


//#region VARIABLES

let servidor;
let url;

let pacienteId;
let medicoId;

let segundoPacienteId;
let segundoMedicoId;

//#endregion


//#region DATOS DE PRUEBA

const PACIENTE = {
  cedula: '1710034065',
  nombres: 'Eva',
  apellidos: 'Paz',
  fecha_nacimiento: '1990-01-01',
  telefono: '0991234567',
  correo: 'eva@correo.com'
};

const MEDICO = {
  nombres: 'Luis',
  apellidos: 'Mora',
  especialidad: 'Pediatría',
  telefono: '0987654321',
  correo: 'luis@correo.com'
};

//#endregion


//#region FUNCIONES AUXILIARES

function obtenerFecha(dias = 0) {

  const fecha = new Date();

  fecha.setDate(fecha.getDate() + dias);

  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, '0');

  const dia = String(
    fecha.getDate()
  ).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;

}


function obtenerDatosCita(datos = {}) {

  return {

    paciente_id: pacienteId,

    medico_id: medicoId,

    fecha: obtenerFecha(1),

    hora: '09:30',

    motivo: 'Consulta médica general',

    estado: 'programada',

    ...datos

  };

}


async function pedir(
  metodo,
  ruta = '',
  cuerpo
) {

  const respuesta = await fetch(
    `${url}${ruta}`,
    {
      method: metodo,

      headers: {
        'Content-Type': 'application/json'
      },

      body: cuerpo === undefined
        ? undefined
        : JSON.stringify(cuerpo)
    }
  );

  const texto = await respuesta.text();

  return {

    status: respuesta.status,

    cuerpo: texto
      ? JSON.parse(texto)
      : null

  };

}


async function crearCita(datos = {}) {

  const { status, cuerpo } = await pedir(

    'POST',

    '',

    obtenerDatosCita(datos)

  );

  assert.equal(
    status,
    201,
    JSON.stringify(cuerpo)
  );

  return cuerpo;

}


function agregarPaciente(datos = {}) {

  const paciente = {

    ...PACIENTE,

    ...datos

  };

  return getDb()
    .prepare(`
      INSERT INTO pacientes (
        cedula,
        nombres,
        apellidos,
        fecha_nacimiento,
        telefono,
        correo
      )
      VALUES (
        :cedula,
        :nombres,
        :apellidos,
        :fecha_nacimiento,
        :telefono,
        :correo
      )
      RETURNING id
    `)
    .get(paciente)
    .id;

}


function agregarMedico(datos = {}) {

  const medico = {

    ...MEDICO,

    ...datos

  };

  return getDb()
    .prepare(`
      INSERT INTO medicos (
        nombres,
        apellidos,
        especialidad,
        telefono,
        correo
      )
      VALUES (
        :nombres,
        :apellidos,
        :especialidad,
        :telefono,
        :correo
      )
      RETURNING id
    `)
    .get(medico)
    .id;

}


async function consultarDisponibilidad(
  datos = {}
) {

  const parametros = new URLSearchParams({

    medico_id: String(medicoId),

    paciente_id: String(pacienteId),

    fecha: obtenerFecha(1),

    ...datos

  });

  return pedir(

    'GET',

    `/disponibilidad?${parametros}`

  );

}

//#endregion


//#region CONFIGURACION DE PRUEBAS

before(async () => {

  openDatabase(':memory:');

  await new Promise((listo, rechazar) => {

    servidor = createApp().listen(0, listo);

    servidor.once('error', rechazar);

  });

  url =
    `http://localhost:${servidor.address().port}/api/citas`;

});


after(async () => {

  try {

    if (servidor) {

      await new Promise((listo, rechazar) => {

        servidor.close(error => {

          if (error) {
            rechazar(error);
          } else {
            listo();
          }

        });

      });

    }

  } finally {

    closeDatabase();

  }

});


beforeEach(() => {

  getDb().exec(`
    DELETE FROM citas;
    DELETE FROM pacientes;
    DELETE FROM medicos;
  `);

  pacienteId = agregarPaciente();

  medicoId = agregarMedico();

  segundoPacienteId = agregarPaciente({

    cedula: '1710034073',

    nombres: 'Carlos',

    apellidos: 'Torres',

    correo: 'carlos@correo.com'

  });

  segundoMedicoId = agregarMedico({

    nombres: 'Ana',

    apellidos: 'Alvarez',

    especialidad: 'Cardiología',

    correo: 'ana@correo.com'

  });

});

//#endregion


//#region CONSULTAR CITAS

describe('GET /api/citas', () => {

  it('devuelve una lista vacía cuando no existen citas',
    async () => {

      const { status, cuerpo } =
        await pedir('GET');

      assert.equal(status, 200);

      assert.deepEqual(cuerpo, []);

    }
  );


  it('devuelve las citas ordenadas por fecha y hora',
    async () => {

      await crearCita({

        hora: '10:30'

      });

      await crearCita({

        hora: '08:00'

      });

      await crearCita({

        fecha: obtenerFecha(2),

        hora: '08:30'

      });

      const { status, cuerpo } =
        await pedir('GET');

      assert.equal(status, 200);

      assert.equal(cuerpo.length, 3);

      assert.deepEqual(

        cuerpo.map(cita => cita.hora),

        ['08:00', '10:30', '08:30']

      );

    }
  );


  it('devuelve las citas filtradas por fecha',
    async () => {

      const fecha = obtenerFecha(1);

      await crearCita({ fecha });

      await crearCita({

        fecha: obtenerFecha(2)

      });

      const { status, cuerpo } =
        await pedir('GET', `?fecha=${fecha}`);

      assert.equal(status, 200);

      assert.equal(cuerpo.length, 1);

      assert.equal(cuerpo[0].fecha, fecha);

    }
  );


  it('devuelve las citas filtradas por paciente',
    async () => {

      await crearCita();

      await crearCita({

        paciente_id: segundoPacienteId,

        hora: '10:00'

      });

      const { status, cuerpo } =
        await pedir(
          'GET',
          `?paciente_id=${pacienteId}`
        );

      assert.equal(status, 200);

      assert.equal(cuerpo.length, 1);

      assert.equal(
        cuerpo[0].paciente_id,
        pacienteId
      );

    }
  );


  it('devuelve las citas filtradas por médico',
    async () => {

      await crearCita();

      await crearCita({

        medico_id: segundoMedicoId,

        hora: '10:00'

      });

      const { status, cuerpo } =
        await pedir(
          'GET',
          `?medico_id=${medicoId}`
        );

      assert.equal(status, 200);

      assert.equal(cuerpo.length, 1);

      assert.equal(
        cuerpo[0].medico_id,
        medicoId
      );

    }
  );


  it('devuelve las citas filtradas por estado',
    async () => {

      const cita = await crearCita();

      const cancelacion = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(cancelacion.status, 200);

      await crearCita();

      const { status, cuerpo } =
        await pedir(
          'GET',
          '?estado=cancelada'
        );

      assert.equal(status, 200);

      assert.equal(cuerpo.length, 1);

      assert.equal(
        cuerpo[0].estado,
        'cancelada'
      );

    }
  );


  it('responde 400 cuando el filtro de fecha es inválido',
    async () => {

      const { status } =
        await pedir(
          'GET',
          '?fecha=fecha-invalida'
        );

      assert.equal(status, 400);

    }
  );

});

//#endregion


//#region REGISTRAR CITAS

describe('POST /api/citas', () => {

  it('registra correctamente una cita médica',
    async () => {

      const datos = obtenerDatosCita();

      const { status, cuerpo } =
        await pedir('POST', '', datos);

      assert.equal(status, 201);

      assert.ok(cuerpo.id > 0);

      assert.deepEqual(cuerpo, {

        id: cuerpo.id,

        ...datos

      });

    }
  );


  it('registra una cita con estado inicial programada',
    async () => {

      const datos = obtenerDatosCita();

      delete datos.estado;

      const { status, cuerpo } =
        await pedir('POST', '', datos);

      assert.equal(status, 201);

      assert.equal(
        cuerpo.estado,
        'programada'
      );

    }
  );


  it('normaliza el motivo de la consulta',
    async () => {

      const cita = await crearCita({

        motivo: '  Consulta   médica general  '

      });

      assert.equal(

        cita.motivo,

        'Consulta médica general'

      );

    }
  );


  it('responde 400 cuando faltan campos obligatorios',
    async () => {

      const { status, cuerpo } =
        await pedir('POST', '', {});

      assert.equal(status, 400);

      assert.ok(cuerpo.errores.paciente_id);

      assert.ok(cuerpo.errores.medico_id);

      assert.ok(cuerpo.errores.fecha);

      assert.ok(cuerpo.errores.hora);

      assert.ok(cuerpo.errores.motivo);

    }
  );


  it('responde 404 cuando el paciente no existe',
    async () => {

      const { status } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          paciente_id: 999999

        })

      );

      assert.equal(status, 404);

    }
  );


  it('responde 404 cuando el médico no existe',
    async () => {

      const { status } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          medico_id: 999999

        })

      );

      assert.equal(status, 404);

    }
  );


  it('responde 400 cuando la fecha es anterior a la actual',
    async () => {

      const { status } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          fecha: obtenerFecha(-1)

        })

      );

      assert.equal(status, 400);

    }
  );


  it('responde 400 cuando la fecha no existe en el calendario',
    async () => {

      const { status } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          fecha: '2027-02-30'

        })

      );

      assert.equal(status, 400);

    }
  );


  it('responde 400 cuando la hora está fuera del horario de atención',
    async () => {

      const { status, cuerpo } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          hora: '17:00'

        })

      );

      assert.equal(status, 400);

      assert.ok(cuerpo.errores.hora);

    }
  );


  it('responde 400 cuando la hora no corresponde a un intervalo de 30 minutos',
    async () => {

      const { status, cuerpo } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          hora: '09:15'

        })

      );

      assert.equal(status, 400);

      assert.ok(cuerpo.errores.hora);

    }
  );


  it('responde 400 cuando el motivo está vacío',
    async () => {

      const { status, cuerpo } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          motivo: '   '

        })

      );

      assert.equal(status, 400);

      assert.ok(cuerpo.errores.motivo);

    }
  );


  it('responde 409 cuando el médico tiene otra cita en el mismo horario',
    async () => {

      await crearCita();

      const { status } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          paciente_id: segundoPacienteId

        })

      );

      assert.equal(status, 409);

    }
  );


  it('responde 409 cuando el paciente tiene otra cita en el mismo horario',
    async () => {

      await crearCita();

      const { status } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          medico_id: segundoMedicoId

        })

      );

      assert.equal(status, 409);

    }
  );


  it('permite registrar citas simultáneas con diferentes médicos y pacientes',
    async () => {

      await crearCita();

      const cita = await crearCita({

        paciente_id: segundoPacienteId,

        medico_id: segundoMedicoId

      });

      assert.equal(
        cita.estado,
        'programada'
      );

    }
  );


  it('permite utilizar nuevamente el horario de una cita cancelada',
    async () => {

      const cita = await crearCita();

      const cancelacion = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(cancelacion.status, 200);

      const nuevaCita = await crearCita();

      assert.notEqual(
        nuevaCita.id,
        cita.id
      );

      assert.equal(
        nuevaCita.estado,
        'programada'
      );

    }
  );


  it('impide registrar dos solicitudes simultáneas para el mismo horario',
    async () => {

      const datos = obtenerDatosCita();

      const respuestas = await Promise.all([

        pedir('POST', '', datos),

        pedir('POST', '', datos)

      ]);

      const estados = respuestas
        .map(respuesta => respuesta.status)
        .sort((a, b) => a - b);

      assert.deepEqual(

        estados,

        [201, 409]

      );

      const consulta = await pedir('GET');

      assert.equal(consulta.status, 200);

      assert.equal(consulta.cuerpo.length, 1);

    }
  );

});

//#endregion


//#region CONSULTAR CITA POR ID

describe('GET /api/citas/:id', () => {

  it('devuelve la cita con información del paciente y médico',
    async () => {

      const cita = await crearCita();

      const { status, cuerpo } =
        await pedir('GET', `/${cita.id}`);

      assert.equal(status, 200);

      assert.equal(cuerpo.id, cita.id);

      assert.equal(
        cuerpo.paciente_nombres,
        PACIENTE.nombres
      );

      assert.equal(
        cuerpo.paciente_apellidos,
        PACIENTE.apellidos
      );

      assert.equal(
        cuerpo.paciente_cedula,
        PACIENTE.cedula
      );

      assert.equal(
        cuerpo.medico_nombres,
        MEDICO.nombres
      );

      assert.equal(
        cuerpo.medico_apellidos,
        MEDICO.apellidos
      );

      assert.equal(
        cuerpo.medico_especialidad,
        MEDICO.especialidad
      );

    }
  );


  it('responde 404 cuando la cita no existe',
    async () => {

      const { status } =
        await pedir('GET', '/999999');

      assert.equal(status, 404);

    }
  );


  it('responde 400 cuando el identificador es inválido',
    async () => {

      const { status } =
        await pedir('GET', '/abc');

      assert.equal(status, 400);

    }
  );

});

//#endregion


//#region DISPONIBILIDAD DE HORARIOS

describe('GET /api/citas/disponibilidad', () => {

  it('devuelve los 18 horarios de atención',
    async () => {

      const { status, cuerpo } =
        await consultarDisponibilidad();

      assert.equal(status, 200);

      assert.equal(cuerpo.length, 18);

      assert.equal(cuerpo[0].hora, '08:00');

      assert.equal(cuerpo[17].hora, '16:30');

    }
  );


  it('devuelve todos los horarios disponibles cuando no existen citas',
    async () => {

      const { status, cuerpo } =
        await consultarDisponibilidad();

      assert.equal(status, 200);

      assert.ok(

        cuerpo.every(horario =>

          horario.disponible === true &&

          horario.ocupado === false &&

          horario.transcurrido === false

        )

      );

    }
  );


  it('identifica los horarios ocupados por el médico',
    async () => {

      await crearCita({

        paciente_id: segundoPacienteId,

        hora: '09:30'

      });

      const { status, cuerpo } =
        await consultarDisponibilidad();

      assert.equal(status, 200);

      const horario = cuerpo.find(
        item => item.hora === '09:30'
      );

      assert.deepEqual(horario, {

        hora: '09:30',

        disponible: false,

        transcurrido: false,

        ocupado: true

      });

    }
  );


  it('identifica los horarios ocupados por el paciente',
    async () => {

      await crearCita({

        medico_id: segundoMedicoId,

        hora: '10:00'

      });

      const { status, cuerpo } =
        await consultarDisponibilidad();

      assert.equal(status, 200);

      const horario = cuerpo.find(
        item => item.hora === '10:00'
      );

      assert.equal(horario.disponible, false);

      assert.equal(horario.ocupado, true);

    }
  );


  it('no bloquea horarios de otros médicos y pacientes',
    async () => {

      await crearCita({

        paciente_id: segundoPacienteId,

        medico_id: segundoMedicoId,

        hora: '09:30'

      });

      const { status, cuerpo } =
        await consultarDisponibilidad();

      assert.equal(status, 200);

      const horario = cuerpo.find(
        item => item.hora === '09:30'
      );

      assert.equal(horario.disponible, true);

      assert.equal(horario.ocupado, false);

    }
  );


  it('libera el horario cuando la cita es cancelada',
    async () => {

      const cita = await crearCita();

      const cancelacion = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(cancelacion.status, 200);

      const { status, cuerpo } =
        await consultarDisponibilidad();

      assert.equal(status, 200);

      const horario = cuerpo.find(
        item => item.hora === cita.hora
      );

      assert.equal(horario.disponible, true);

      assert.equal(horario.ocupado, false);

    }
  );


  it('responde 400 cuando la fecha es anterior a la actual',
    async () => {

      const { status } =
        await consultarDisponibilidad({

          fecha: obtenerFecha(-1)

        });

      assert.equal(status, 400);

    }
  );


  it('responde 400 cuando faltan parámetros obligatorios',
    async () => {

      const { status, cuerpo } =
        await pedir(
          'GET',
          '/disponibilidad'
        );

      assert.equal(status, 400);

      assert.ok(cuerpo.errores.paciente_id);

      assert.ok(cuerpo.errores.medico_id);

      assert.ok(cuerpo.errores.fecha);

    }
  );


  it('responde 404 cuando el médico no existe',
    async () => {

      const { status } =
        await consultarDisponibilidad({

          medico_id: '999999'

        });

      assert.equal(status, 404);

    }
  );


  it('responde 404 cuando el paciente no existe',
    async () => {

      const { status } =
        await consultarDisponibilidad({

          paciente_id: '999999'

        });

      assert.equal(status, 404);

    }
  );

});

//#endregion


//#region VALIDACION DE HORARIOS TRANSCURRIDOS

describe('Validación de horarios transcurridos', () => {

  it('identifica los horarios transcurridos del día actual',
    async (t) => {

      // Simular las 11:15 del día actual.

      const fechaSimulada = new Date();

      fechaSimulada.setHours(11, 15, 0, 0);

      t.mock.timers.enable({

        apis: ['Date'],

        now: fechaSimulada

      });

      const { status, cuerpo } =
        await consultarDisponibilidad({

          fecha: obtenerFecha()

        });

      assert.equal(status, 200);

      const horarioAnterior = cuerpo.find(
        item => item.hora === '11:00'
      );

      const horarioPosterior = cuerpo.find(
        item => item.hora === '11:30'
      );

      assert.equal(

        horarioAnterior.transcurrido,

        true

      );

      assert.equal(

        horarioAnterior.disponible,

        false

      );

      assert.equal(

        horarioPosterior.transcurrido,

        false

      );

      assert.equal(

        horarioPosterior.disponible,

        true

      );

    }
  );


  it('impide registrar una cita en un horario transcurrido',
    async (t) => {

      const fechaSimulada = new Date();

      fechaSimulada.setHours(11, 15, 0, 0);

      t.mock.timers.enable({

        apis: ['Date'],

        now: fechaSimulada

      });

      const { status, cuerpo } = await pedir(

        'POST',

        '',

        obtenerDatosCita({

          fecha: obtenerFecha(),

          hora: '09:30'

        })

      );

      assert.equal(status, 400);

      assert.ok(cuerpo.errores.hora);

    }
  );


  it('permite registrar una cita en un horario posterior a la hora actual',
    async (t) => {

      const fechaSimulada = new Date();

      fechaSimulada.setHours(11, 15, 0, 0);

      t.mock.timers.enable({

        apis: ['Date'],

        now: fechaSimulada

      });

      const cita = await crearCita({

        fecha: obtenerFecha(),

        hora: '11:30'

      });

      assert.equal(cita.hora, '11:30');

      assert.equal(cita.estado, 'programada');

    }
  );


  it('considera transcurrido un horario igual a la hora actual',
    async (t) => {

      const fechaSimulada = new Date();

      fechaSimulada.setHours(11, 30, 0, 0);

      t.mock.timers.enable({

        apis: ['Date'],

        now: fechaSimulada

      });

      const { status, cuerpo } =
        await consultarDisponibilidad({

          fecha: obtenerFecha()

        });

      assert.equal(status, 200);

      const horario = cuerpo.find(
        item => item.hora === '11:30'
      );

      assert.equal(horario.transcurrido, true);

      assert.equal(horario.disponible, false);

    }
  );

});

//#endregion


//#region ACTUALIZAR CITAS

describe('PUT /api/citas/:id', () => {

  it('actualiza una cita programada',
    async () => {

      const cita = await crearCita();

      const { status, cuerpo } = await pedir(

        'PUT',

        `/${cita.id}`,

        obtenerDatosCita({

          hora: '11:30',

          motivo: 'Consulta de seguimiento'

        })

      );

      assert.equal(status, 200);

      assert.equal(cuerpo.id, cita.id);

      assert.equal(cuerpo.hora, '11:30');

      assert.equal(

        cuerpo.motivo,

        'Consulta de seguimiento'

      );

    }
  );


  it('permite actualizar una cita conservando su horario',
    async () => {

      const cita = await crearCita();

      const { status, cuerpo } = await pedir(

        'PUT',

        `/${cita.id}`,

        obtenerDatosCita({

          motivo: 'Control médico'

        })

      );

      assert.equal(status, 200);

      assert.equal(cuerpo.hora, cita.hora);

      assert.equal(

        cuerpo.motivo,

        'Control médico'

      );

    }
  );


  it('responde 409 cuando el nuevo horario está ocupado',
    async () => {

      const cita = await crearCita({

        hora: '09:30'

      });

      await crearCita({

        paciente_id: segundoPacienteId,

        hora: '10:00'

      });

      const { status } = await pedir(

        'PUT',

        `/${cita.id}`,

        obtenerDatosCita({

          hora: '10:00'

        })

      );

      assert.equal(status, 409);

    }
  );


  it('responde 409 cuando se intenta actualizar una cita cancelada',
    async () => {

      const cita = await crearCita();

      const cancelacion = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(cancelacion.status, 200);

      const { status } = await pedir(

        'PUT',

        `/${cita.id}`,

        obtenerDatosCita({

          hora: '11:00'

        })

      );

      assert.equal(status, 409);

    }
  );


  it('responde 404 cuando la cita no existe',
    async () => {

      const { status } = await pedir(

        'PUT',

        '/999999',

        obtenerDatosCita()

      );

      assert.equal(status, 404);

    }
  );

});

//#endregion


//#region CANCELACION Y CAMBIO DE ESTADO

describe('PATCH /api/citas/:id/estado', () => {

  it('cancela correctamente una cita programada',
    async () => {

      const cita = await crearCita();

      const { status, cuerpo } = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(status, 200);

      assert.equal(cuerpo.id, cita.id);

      assert.equal(cuerpo.estado, 'cancelada');

    }
  );


  it('conserva el registro histórico de una cita cancelada',
    async () => {

      const cita = await crearCita();

      const cancelacion = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(cancelacion.status, 200);

      const { status, cuerpo } =
        await pedir('GET', `/${cita.id}`);

      assert.equal(status, 200);

      assert.equal(cuerpo.id, cita.id);

      assert.equal(cuerpo.estado, 'cancelada');

      assert.equal(cuerpo.fecha, cita.fecha);

      assert.equal(cuerpo.hora, cita.hora);

      assert.equal(cuerpo.motivo, cita.motivo);

    }
  );


  it('permite marcar una cita programada como atendida',
    async () => {

      const cita = await crearCita();

      const { status, cuerpo } = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'atendida' }

      );

      assert.equal(status, 200);

      assert.equal(cuerpo.estado, 'atendida');

    }
  );


  it('responde 409 cuando se intenta cancelar una cita atendida',
    async () => {

      const cita = await crearCita();

      const atencion = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'atendida' }

      );

      assert.equal(atencion.status, 200);

      const { status } = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(status, 409);

    }
  );


  it('responde 409 cuando se intenta reactivar una cita cancelada',
    async () => {

      const cita = await crearCita();

      const cancelacion = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(cancelacion.status, 200);

      const { status } = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'programada' }

      );

      assert.equal(status, 409);

    }
  );


  it('mantiene el estado cuando se cancela nuevamente una cita cancelada',
    async () => {

      const cita = await crearCita();

      const primera = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      const segunda = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'cancelada' }

      );

      assert.equal(primera.status, 200);

      assert.equal(segunda.status, 200);

      assert.equal(

        segunda.cuerpo.estado,

        'cancelada'

      );

    }
  );


  it('responde 400 cuando el estado no es válido',
    async () => {

      const cita = await crearCita();

      const { status, cuerpo } = await pedir(

        'PATCH',

        `/${cita.id}/estado`,

        { estado: 'eliminada' }

      );

      assert.equal(status, 400);

      assert.ok(cuerpo.errores.estado);

    }
  );


  it('responde 404 cuando la cita no existe',
    async () => {

      const { status } = await pedir(

        'PATCH',

        '/999999/estado',

        { estado: 'cancelada' }

      );

      assert.equal(status, 404);

    }
  );

});

//#endregion