# InterClouder — Base (Fase 1)

Red social con identidad estilo `nombre#codigo` + apodo. Esta fase cubre
**cuenta, autenticación e identidad**. La voz/chat en tiempo real (Photon)
llega en la Fase 2.

## Qué incluye esta fase
- Registro con `nombre` + contraseña → se asigna un código de 5 cifras único (`Juan#04821`).
- Login con `nombre#codigo` + contraseña.
- Apodo cambiable que se muestra **por encima** del nombre (sin tag).
- Si se borra el apodo, vuelve a mostrarse `nombre#codigo`.
- Antispam de apodo: máx. 3 cambios por hora.
- Sesión con token JWT (7 días).

## Estructura
```
interclouder/
├── backend/        Node.js + Express + Supabase
│   ├── server.js       rutas: registro, login, /yo, /apodo
│   ├── identidad.js    reglas de nombre, código y antispam
│   ├── supabase.js     cliente Supabase
│   └── .env.example
├── frontend/
│   └── index.html      UI mínima (registro/login/apodo)
└── db/
    └── schema.sql      tablas para Supabase
```

## Puesta en marcha

### 1. Base de datos (Supabase)
1. Crea un proyecto en https://supabase.com
2. Ve a **SQL Editor** y pega/ejecuta el contenido de `db/schema.sql`.
3. En **Project Settings → API** copia la `URL` y la `service_role key`.

### 2. Backend
```bash
cd backend
cp .env.example .env     # rellena SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
npm install
npm start                # http://localhost:3000
```

### 3. Frontend
Abre `frontend/index.html` en el navegador (o sírvelo con cualquier
servidor estático). Si cambias el puerto/host del backend, edita la
constante `API` arriba del `<script>`.

## Endpoints
| Método | Ruta            | Descripción                          |
|--------|-----------------|--------------------------------------|
| POST   | `/api/registro` | Crear cuenta                         |
| POST   | `/api/login`    | Iniciar sesión (`tag` = nombre#cod)  |
| GET    | `/api/yo`       | Datos del usuario en sesión          |
| PUT    | `/api/apodo`    | Cambiar (o borrar con `null`) apodo  |

## Próxima fase (Photon)
- Integrar Photon Realtime/Voice para chat y voz.
- Autenticación personalizada: el token de InterClouder valida la entrada a Photon.
- Canales/salas y presencia (online/offline).
