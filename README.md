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