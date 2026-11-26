# MediAgenda: Citas Médicas

Aplicación web para la gestión de citas médicas de un consultorio pequeño (caso simulado). La usa el personal de recepción para registrar pacientes y médicos y agendar citas. El paciente no ingresa al sistema.

Actividad AA-1 · Plataformas de Desarrollo de Software · Maestría en Ingeniería en Software · UTM

**Fuera del alcance:** inicio de sesión, historia clínica, pagos, notificaciones y despliegue en la nube.

## Equipo

| Integrante | Usuario GitHub | Responsabilidad |
|---|---|---|
| 1. Gustavo Conforme | gconforme2631 | Repositorio, estructura, conexión SQLite, formato de errores, Angular base, módulo Pacientes |
| 2. Diego Albuja | dfalbuja  | `schema.sql`, módulo Médicos, diseño responsive general |
| 3. Ricardo Sigcha | RickyLeo2016 | Datos de prueba iniciales, módulo Citas |

## Tecnologías

| Capa | Tecnología | Versión usada |
|---|---|---|
| Frontend | Angular (HttpClient, formularios reactivos, Router) | Angular CLI 22.2.7 |
| Backend | Node.js + Express (API REST) | Node 26.13.0 · Express 5 |
| Base de datos | SQLite con el módulo nativo `node:sqlite` | SQLite 3.54.0 |
| Pruebas | `node:test` | Incluido en Node |

Versiones mínimas: **Node 24** o superior y **Angular CLI 22**. `node:sqlite` puede mostrar un aviso `ExperimentalWarning` al arrancar la API. Es normal y no afecta el funcionamiento.

## Estructura

```
mediagenda/
├── api/                     Backend Express (puerto 3000)
│   ├── src/
│   │   ├── config/          env.js (configuración) y database.js (conexión SQLite)
│   │   ├── routes/          capa 1: recibe la petición HTTP
│   │   ├── validations/     capa 2: valida los datos
│   │   ├── services/        capa 3: reglas de negocio
│   │   ├── repositories/    capa 4: consultas SQL
│   │   ├── middlewares/     manejo de errores y validación de :id
│   │   ├── utils/           clases de error compartidas
│   │   ├── app.js           middlewares y registro de rutas
│   │   └── server.js        punto de entrada
│   ├── tests/               pruebas con node:test
│   └── .env.example
├── web/                     Frontend Angular (puerto 4200)
│   └── src/app/
│       ├── shared/          avisos, estado de la API, vista provisional
│       ├── pacientes/
│       ├── medicos/
│       └── citas/
└── db/
    └── schema.sql           tablas e índices (se aplica al arrancar la API)
```

## Instalación

```bash
git clone https://github.com/gconforme2631/mediagenda.git
cd mediagenda

# Backend
cd api
npm install
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env

# Frontend
cd ../web
npm install
```

### Variables de entorno (`api/.env`)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `DB_PATH` | `../db/mediagenda.db` | Archivo SQLite, relativo a la carpeta `api` |
| `CORS_ORIGIN` | `http://localhost:4200` | Origen permitido (Angular) |

`.env` y `mediagenda.db` no se suben al repositorio. La base de datos se crea sola al arrancar la API.

## Ejecución

Se necesitan dos terminales:

```bash
# Terminal 1: API
cd api
npm run dev          # se reinicia al guardar cambios (npm start sin reinicio)

# Terminal 2: frontend
cd web
ng serve
```

- Frontend: http://localhost:4200
- Estado de la API: http://localhost:3000/api/salud

### Datos de prueba

```bash
cd api
npm run seed
```

Carga 6 pacientes, 4 médicos y 10 citas (atendidas, programadas y canceladas, con fechas relativas al día de la carga). Se puede ejecutar varias veces sin duplicar. Los datos están en `db/seed.sql`.

## Pruebas

```bash
# Backend: 35 pruebas (Pacientes 22, Médicos 13)
cd api
npm test

# Frontend
cd ../web
ng test --watch=false
```

## API

### Formato común de respuestas

| Código | Uso | Cuerpo |
|---|---|---|
| 200 | Consulta o actualización correcta | Datos solicitados |
| 201 | Registro creado | Registro creado |
| 204 | Registro eliminado | Sin cuerpo |
| 400 | Datos inválidos | `{ "mensaje": "Datos inválidos", "errores": { "campo": "detalle" } }` |
| 404 | No encontrado | `{ "mensaje": "texto claro para el usuario" }` |
| 409 | Conflicto (duplicado o con datos relacionados) | `{ "mensaje": "texto claro para el usuario" }` |
| 500 | Error no previsto | `{ "mensaje": "Error interno del servidor" }` |
| 503 | API sin acceso a la base de datos | Respuesta de `/api/salud` |

### Endpoints

| Método | Ruta | Estado |
|---|---|---|
| GET | `/api/salud` | Disponible |
| GET, POST | `/api/pacientes` | Disponible |
| GET, PUT, DELETE | `/api/pacientes/:id` | Disponible |
| GET, POST | `/api/medicos` | Disponible |
| GET, PUT, DELETE | `/api/medicos/:id` | Disponible |
| — | `/api/citas` | En desarrollo |

### Reglas del módulo Pacientes

| Campo | Validación (cliente y servidor) |
|---|---|
| `cedula` | Obligatoria, cédula ecuatoriana válida: provincia 01-24 o 30, tercer dígito menor a 6 y dígito verificador (módulo 10). Única |
| `nombres`, `apellidos` | Obligatorios, solo letras (incluye tildes, ñ y ü) |
| `fecha_nacimiento` | Obligatoria, formato `YYYY-MM-DD`, no futura |
| `telefono` | Obligatorio, celular `09XXXXXXXX` |
| `correo` | Obligatorio, formato de correo; se guarda en minúsculas |

| Situación | Respuesta |
|---|---|
| Datos inválidos | 400 con el error de cada campo |
| Paciente no existe | 404 · *Paciente no encontrado* |
| Cédula registrada por otro paciente | 409 · *Ya existe un paciente con esa cédula* |
| Eliminar un paciente con citas | 409 · *No se puede eliminar un paciente con citas registradas* |

La lista se ordena por apellidos y nombres en español (Á junto a A, ñ después de n).
La validación de cédula para Angular está en `web/src/app/pacientes/paciente.validadores.ts` (`esCedulaValida`), por si otro módulo la necesita.

## Convenciones del proyecto

### Backend: cómo agregar un módulo

Cada módulo usa las cuatro capas, con un archivo por capa y el nombre del módulo como prefijo:

```
api/src/routes/medicos.routes.js
api/src/validations/medicos.validation.js
api/src/services/medicos.service.js
api/src/repositories/medicos.repository.js
api/tests/medicos.test.js
```

- **Conexión:** los repositorios usan `getDb()` de `config/database.js`.
- **Errores:** no se escribe `res.status(...)` para los errores. Se lanza la clase que corresponda de `utils/errores.js` y el middleware común genera la respuesta:
  - `ErrorValidacion({ campo: 'detalle' })` → 400
  - `ErrorNoEncontrado('Médico no encontrado')` → 404
  - `ErrorConflicto('No se puede eliminar un médico con citas registradas')` → 409
- **Rutas con `:id`:** usar el middleware `validarId` de `middlewares/validar-id.middleware.js`.
- **Registro:** agregar una línea en la sección *Rutas* de `app.js`, siempre antes del manejo de errores.

### Base de datos

- Todo cambio de tablas va en `db/schema.sql`, usando `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`, porque el esquema se ejecuta en cada arranque.
- Las claves foráneas están activadas en la conexión.
- Fechas en formato `YYYY-MM-DD` y horas en `HH:MM`.

### Frontend: cómo agregar un módulo

- Cada módulo tiene su carpeta y su archivo de rutas (`medicos/medicos.routes.ts`, `citas/citas.routes.ts`), que ya están creados. `app.routes.ts` no se modifica.
- Rutas de cada módulo: `''` (lista), `'nuevo'` y `':id/editar'`, con el mismo componente de formulario para crear y editar.
- La URL de la API se toma de `environment.apiUrl`. No se escribe a mano.
- Avisos de confirmación: `AvisoService` de `shared/aviso/aviso.service.ts` → `exito('...')` o `error('...')`.
- El mensaje de API caída funciona solo para todos los módulos.
- **Estilos:** usar las clases comunes de `src/styles.css` (`.pagina-encabezado`, `.btn`, `.buscador`, `.tabla`, `.tarjetas`, `.formulario`, `.campo`, `.campo__error`, `.vacio`, `.btn--agregar`, `.btn--flotante`) y las variables CSS (`--color-primario`, etc.). Si hace falta una clase nueva, se agrega en `styles.css` y se avisa al grupo.
- **Responsive:** cada lista lleva la `.tabla` y las `.tarjetas`. La tabla se ve en escritorio (más de 900 px); las tarjetas, en tablet (2 columnas) y celular (1 columna). En celular el botón de agregar pasa a ser el `.btn--flotante`. Ejemplos: `medicos/lista/` y `pacientes/lista/`.

### Código

- Comentario de cabecera en cada archivo, indicando qué es.
- Comentarios breves solo para separar secciones o aclarar valores.

### Git

- Una rama por integrante, creada desde `main` actualizado:
  ```bash
  git switch main
  git pull
  git switch -c nombre-apellido
  ```
- `main` está protegida: los cambios llegan solo por Pull Request.
- Mensajes de commit: `tipo(alcance): descripción`. Por ejemplo, `feat(api):




---

## Módulo de Gestión de Citas Médicas

### Información del desarrollo

- Desarrollador: Ricardo Sigcha
- Rama: `ricardo-sigcha`
- Fecha: 24/11/2026
- Módulo: Gestión y agendamiento de citas médicas

### Descripción

El módulo permite gestionar las citas médicas mediante una
interfaz web desarrollada en Angular, integrada con una API
REST desarrollada en Node.js, Express y SQLite.

El proceso contempla el registro, consulta, disponibilidad
de horarios y cancelación de citas médicas, garantizando
la integridad de la información y evitando conflictos
de horarios entre pacientes y médicos.

### Funcionalidades implementadas

#### Gestión de citas médicas

- Consulta inicial de citas según la fecha actual del sistema.
- Listado de citas ordenado por hora de atención.
- Consulta de citas por fecha.
- Navegación entre el día anterior y el día siguiente.
- Botón para consultar las citas del día actual.
- Búsqueda por nombres, apellidos y cédula del paciente.
- Búsqueda por médico y especialidad.
- Filtrado por estado de la cita.
- Indicadores dinámicos:
  - Total de citas.
  - Citas programadas.
  - Citas atendidas.
  - Citas canceladas.
- Actualización del listado de citas.
- Botón Nueva cita para acceder al formulario de agendamiento.
- Cancelación de citas mediante confirmación con SweetAlert2.

#### Agendamiento de citas médicas

- Selección del paciente.
- Selección del médico.
- Selección de la fecha de atención.
- Consulta dinámica de horarios disponibles.
- Visualización de horarios ocupados.
- Visualización de horarios transcurridos.
- Selección de horarios en intervalos de 30 minutos.
- Registro del motivo de consulta.
- Validación de campos obligatorios.
- Validación de fechas y horarios.
- Registro de citas con estado inicial programada.
- Botón Regresar para retornar a la gestión de citas.

#### Cancelación de citas médicas

- Cancelación de citas en estado programada.
- Confirmación de la operación mediante SweetAlert2.
- Actualización del estado de la cita a cancelada.
- Conservación del historial de citas médicas.
- Liberación automática del horario del médico y paciente,
  siempre que el horario no haya transcurrido.
- Actualización del listado e indicadores.
- Restricción de cancelación para citas atendidas.

### Reglas de negocio

1. No se permite registrar citas con fechas anteriores
   a la fecha actual del sistema.

2. No se permite seleccionar horarios que ya hayan
   transcurrido durante el día actual.

3. El horario de atención comprende desde las 08:00
   hasta las 17:00.

4. Las citas se registran en intervalos de 30 minutos.
   El último horario disponible es a las 16:30.

5. Un médico no puede tener dos citas activas en la
   misma fecha y hora.

6. Un paciente no puede tener dos citas activas en la
   misma fecha y hora.

7. Toda cita nueva se registra con estado programada.

8. Únicamente las citas programadas pueden cancelarse.

9. Las citas canceladas no se eliminan físicamente
   de la base de datos.

10. Los horarios cancelados pueden utilizarse nuevamente
    siempre que no hayan transcurrido.

11. Las validaciones de disponibilidad se realizan tanto
    en el frontend como en el backend.

### Estados de las citas

| Estado | Descripción |
|--------|-------------|
| programada | Cita registrada y pendiente de atención. |
| atendida | Cita cuya atención ha finalizado. |
| cancelada | Cita cancelada que conserva su historial. |

### Estados de disponibilidad de horarios

| Estado | Descripción |
|--------|-------------|
| Disponible | Horario habilitado para registrar una cita. |
| Ocupado | Horario reservado por el médico o paciente. |
| Transcurrido | Horario anterior o igual a la hora actual. |
| Seleccionado | Horario elegido para registrar la cita. |

### Arquitectura del módulo

El módulo mantiene una arquitectura por capas, separando
la presentación, lógica de negocio, validaciones y acceso
a datos.

#### Frontend - Angular

- Componentes standalone.
- Angular Signals.
- Computed Signals.
- Reactive Forms.
- FormsModule.
- HttpClient.
- Angular Router.
- RxJS.
- SweetAlert2.
- Font Awesome.
- Diseño responsive mediante CSS.

#### Backend - Node.js y Express

- API REST.
- Arquitectura por capas.
- Repositorios de acceso a datos.
- Servicios de lógica de negocio.
- Validaciones de entrada.
- Middleware para manejo de errores.
- Consultas parametrizadas.
- SQLite mediante el módulo nativo node:sqlite.

### Estructura de archivos

```text
mediagenda/
├── api/
│   └── src/
│       ├── repositories/
│       │   └── citas.repository.js
│       ├── routes/
│       │   └── citas.routes.js
│       ├── services/
│       │   └── citas.service.js
│       ├── validations/
│       │   └── citas.validation.js
│       └── app.js
│
├── db/
│   └── schema.sql
│
├── web/
│   └── src/
│       └── app/
│           └── citas/
│               ├── agendarcita/
│               │   ├── agendarcita.ts
│               │   ├── agendarcita.html
│               │   └── agendarcita.css
│               ├── gestioncitas/
│               │   ├── gestioncitas.ts
│               │   ├── gestioncitas.html
│               │   └── gestioncitas.css
│               ├── services/
│               │   └── citas.ts
│               └── citas.routes.ts
│
└── README.md
```

### Componentes desarrollados

| Componente | Responsabilidad |
|------------|-----------------|
| Gestioncitas | Consulta, filtrado y cancelación de citas. |
| Agendarcita | Registro de citas y selección de horarios. |
| Citas | Servicio de comunicación con la API REST. |

### Rutas del frontend

| Ruta | Descripción |
|------|-------------|
| /citas | Acceso principal al módulo de citas. |
| /citas/gestioncitas | Gestión y consulta de citas médicas. |
| /citas/agendarcita | Registro de una nueva cita médica. |

### Endpoints de la API REST

URL base:

```text
http://localhost:3000/api/citas
```

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/citas | Consultar todas las citas. |
| GET | /api/citas/:id | Consultar una cita por ID. |
| GET | /api/citas?fecha=YYYY-MM-DD | Consultar citas por fecha. |
| GET | /api/citas?paciente_id=1 | Consultar citas por paciente. |
| GET | /api/citas?medico_id=1 | Consultar citas por médico. |
| GET | /api/citas?estado=programada | Consultar citas por estado. |
| GET | /api/citas/disponibilidad | Consultar horarios disponibles. |
| POST | /api/citas | Registrar una nueva cita. |
| PUT | /api/citas/:id | Actualizar una cita programada. |
| PATCH | /api/citas/:id/estado | Cambiar el estado de una cita. |

#### Registrar una cita

```http
POST /api/citas
Content-Type: application/json
```

Ejemplo de solicitud:

```json
{
  "paciente_id": 1,
  "medico_id": 1,
  "fecha": "2026-11-25",
  "hora": "09:30",
  "motivo": "Consulta médica general",
  "estado": "programada"
}
```

#### Consultar disponibilidad de horarios

```http
GET /api/citas/disponibilidad?medico_id=1&paciente_id=1&fecha=2026-11-25
```

Ejemplo de respuesta:

```json
[
  {
    "hora": "08:00",
    "disponible": false,
    "transcurrido": false,
    "ocupado": true
  },
  {
    "hora": "08:30",
    "disponible": true,
    "transcurrido": false,
    "ocupado": false
  }
]
```

#### Cancelar una cita

```http
PATCH /api/citas/1/estado
Content-Type: application/json
```

Cuerpo de la solicitud:

```json
{
  "estado": "cancelada"
}
```

### Base de datos

Se utiliza la tabla `citas` existente en SQLite.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Identificador de la cita. |
| paciente_id | INTEGER | Identificador del paciente. |
| medico_id | INTEGER | Identificador del médico. |
| fecha | TEXT | Fecha de atención. |
| hora | TEXT | Hora de atención. |
| motivo | TEXT | Motivo de la consulta. |
| estado | TEXT | Estado de la cita. |

Se utilizan índices únicos parciales para evitar conflictos
de horarios entre médicos y pacientes.

Las citas canceladas se excluyen de las restricciones
de ocupación de horarios.

### Manejo de respuestas HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Operación realizada correctamente. |
| 201 | Cita registrada correctamente. |
| 400 | Solicitud o datos inválidos. |
| 404 | Recurso no encontrado. |
| 409 | Conflicto de horarios o estado de la cita. |
| 500 | Error interno del servidor. |

### Dependencias adicionales del frontend

Se incorporan las siguientes dependencias para mejorar
la experiencia de usuario:

```bash
npm install sweetalert2
npm install @fortawesome/fontawesome-free
```

Font Awesome debe estar referenciado globalmente en
el archivo `angular.json`:

```json
"styles": [
  "node_modules/@fortawesome/fontawesome-free/css/all.min.css",
  "src/styles.css"
]
```

### Ejecución del módulo

#### Backend

Desde la carpeta `api`:

```bash
npm install
npm run dev
```

URL del backend:

```text
http://localhost:3000
```

#### Frontend

Desde la carpeta `web`:

```bash
npm install
npm start
```

URL del módulo de citas:

```text
http://localhost:4200/citas
```

### Casos de prueba funcionales

| ID | Caso de prueba | Resultado esperado |
|----|----------------|--------------------|
| CP-01 | Ingresar al módulo de citas | Mostrar citas del día actual. |
| CP-02 | Cambiar la fecha de consulta | Mostrar citas de la fecha seleccionada. |
| CP-03 | Registrar una cita válida | Registrar correctamente la cita. |
| CP-04 | Seleccionar un horario ocupado | Impedir la selección. |
| CP-05 | Seleccionar un horario transcurrido | Impedir la selección. |
| CP-06 | Registrar una cita duplicada | Mostrar mensaje de conflicto. |
| CP-07 | Cancelar una cita programada | Actualizar su estado a cancelada. |
| CP-08 | Consultar una cita cancelada | Conservar el registro histórico. |
| CP-09 | Consultar un horario futuro liberado | Mostrarlo como disponible. |
| CP-10 | Cancelar una cita atendida | Impedir la operación. |
| CP-11 | Presionar Nueva cita | Abrir el formulario de agendamiento. |
| CP-12 | Presionar Regresar | Retornar a la gestión de citas. |
| CP-13 | Filtrar por paciente o médico | Mostrar registros coincidentes. |
| CP-14 | Filtrar por estado | Mostrar citas del estado seleccionado. |

### Mejoras futuras

- Incorporar la acción de atención de citas desde
  la pantalla de gestión.
- Implementar la reprogramación de citas médicas.
- Registrar el motivo de cancelación.
- Incorporar notificaciones y recordatorios de citas.
- Generar reportes de atención médica.
- Implementar actualización automática de disponibilidad
  de horarios mientras el formulario permanece abierto.

---

### Verificación de compilación del frontend

Se ejecutó la compilación del frontend Angular en modo
producción mediante el comando `ng build`, obteniendo
los siguientes resultados:

| Indicador | Resultado |
|-----------|-----------|
| Estado de compilación | Exitoso |
| Errores | 0 |
| Advertencias | 0 |
| Tiempo de compilación | 7.20 segundos |
| Tamaño inicial del bundle | 370.12 kB |
| Transferencia inicial estimada | 94.28 kB |

Los componentes de gestión y agendamiento de citas
médicas implementan carga diferida (Lazy Loading),
permitiendo cargar sus recursos cuando son requeridos.

Se ajustó el presupuesto de estilos CSS en angular.json
y se configuró SweetAlert2 como dependencia CommonJS
permitida.