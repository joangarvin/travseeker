# Despliegue de TravSeeker

Guía para publicar la aplicación en internet. **No necesitas dos repositorios en GitHub**: puedes usar **un solo repo** (monorepo) con las carpetas `backend/` y `front/`, que es lo más sencillo para este proyecto.

## Arquitectura en producción

```
Usuario
   │
   ▼
┌─────────────────────┐     HTTPS      ┌─────────────────────┐
│  Frontend (estático) │  ──────────►  │  Backend (Node.js)   │
│  Vercel / Netlify    │   API calls   │  Railway / Render    │
│  tudominio.com       │               │  api.tudominio.com   │
└─────────────────────┘                └──────────┬──────────┘
                                                  │
                                                  ▼
                                       ┌─────────────────────┐
                                       │  PostgreSQL          │
                                       │  Neon / Supabase     │
                                       └─────────────────────┘
```

| Pieza | Qué es | Dónde desplegarlo |
|-------|--------|-------------------|
| **Frontend** | HTML/JS/CSS generado por `vite build` | Vercel, Netlify, Cloudflare Pages |
| **Backend** | API Express en Node.js | Railway, Render, Fly.io |
| **Base de datos** | PostgreSQL | Neon (gratis), Supabase, Railway Postgres |

---

## ¿Un repo o dos repos en GitHub?

### Opción A — Un solo repositorio (recomendado)

```
travseeker/          ← un repo en GitHub
├── backend/
├── front/
├── README.md
└── DEPLOY.md
```

Ventajas: un solo lugar, historial unificado, más fácil de mantener.

Cada plataforma apunta a su subcarpeta:
- Railway/Render → **Root directory**: `backend`
- Vercel/Netlify → **Root directory**: `front`

### Opción B — Dos repositorios

Solo si quieres equipos o permisos separados:

- `travseeker-api` → carpeta `backend/`
- `travseeker-web` → carpeta `front/`

Funciona igual, pero hay que sincronizar versiones y variables de entorno en dos sitios.

---

## Paso 0 — Subir el código a GitHub

Desde la raíz del proyecto (`TravSeeker/`):

```bash
git init
git add .
git commit -m "Initial commit: TravSeeker full-stack"
```

Crea un repo vacío en GitHub (sin README) y enlázalo:

```bash
git remote add origin https://github.com/TU_USUARIO/travseeker.git
git branch -M main
git push -u origin main
```

**Importante:** `.env` está en `.gitignore` y **no debe subirse**. Usa los archivos `.env.example` como plantilla.

---

## Paso 1 — Base de datos PostgreSQL (Neon)

1. Crea cuenta en [neon.tech](https://neon.tech).
2. **New Project** → copia la **connection string** (`postgresql://...`).
3. Guárdala como `DATABASE_URL` en el backend.

### Aplicar el esquema

En local (con la URL de Neon en `backend/.env`):

```bash
cd backend
npx prisma db push
node seed.js   # opcional: datos iniciales de destinos
```

---

## Paso 2 — Desplegar el backend

### Railway (recomendado)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Selecciona tu repo.
3. **Settings** → **Root Directory** → `backend`.
4. **Variables**:

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string de Neon |
| `JWT_SECRET` | String aleatorio largo (32+ caracteres) |
| `NODE_ENV` | `production` |
| `APP_URL` | URL del frontend (p. ej. `https://travseeker.vercel.app`) |
| `FRONTEND_URL` | Igual que `APP_URL` (CORS) |

5. **Deploy**. Copia la URL pública, p. ej. `https://travseeker-api.up.railway.app`.

### Render (alternativa)

1. **Root Directory**: `backend`
2. **Build Command**: `npm install && npx prisma generate`
3. **Start Command**: `npm start`
4. **Health Check Path**: `/api/health`

---

## Paso 3 — Desplegar el frontend

### Vercel (recomendado)

1. [vercel.com](https://vercel.com) → importa el repo de GitHub.
2. **Root Directory** → `front`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variable**:

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | URL del backend (sin barra final) |

### SPA routing (React Router)

Crea `front/vercel.json` para evitar 404 al recargar rutas:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Para Netlify, crea `front/public/_redirects`:

```
/*    /index.html   200
```

---

## Paso 4 — Ajustes finales

1. Actualiza `APP_URL` y `FRONTEND_URL` en el backend con la URL real del front.
2. Redeploy del backend.
3. Prueba `https://tu-api.../api/health` → `{ "ok": true }`.

---

## Cloudinary (imágenes)

1. Crea cuenta en [cloudinary.com](https://cloudinary.com) (plan gratuito suficiente para empezar).
2. En **Settings → API Keys** copia:
   - **Cloud name**
   - **API Key**
   - **API Secret** (solo backend; nunca en Vercel front ni en el repo)
3. Añade en Render (backend):

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=tu_secreto
CLOUDINARY_FOLDER=travseeker
```

4. Reinicia el backend. Comprueba `GET /api/upload/status` → `{ "configured": true }`.

**Rendimiento:** las URLs de Cloudinary se sirven con `f_auto,q_auto` (WebP/AVIF y calidad adaptativa) y anchos según contexto (tarjeta, hero, avatar). No hace falta configurar nada más en el front.

**Migración:** los destinos con enlaces Unsplash/Wix siguen funcionando. Las nuevas fotos subidas desde el panel admin o el perfil se guardan en `travseeker/destinos/` y `travseeker/avatars/`.

---

## Variables de entorno — resumen

### Backend

| Variable | Prod | Descripción |
|----------|------|-------------|
| `DATABASE_URL` | Sí | PostgreSQL |
| `JWT_SECRET` | Sí | Firma JWT |
| `APP_URL` | Sí | URL front (emails) |
| `FRONTEND_URL` | Sí | CORS |
| `SMTP_*` | No | Email real |
| `CLOUDINARY_CLOUD_NAME` | No* | Cuenta Cloudinary |
| `CLOUDINARY_API_KEY` | No* | API key (solo backend) |
| `CLOUDINARY_API_SECRET` | No* | API secret (solo backend, nunca en el front) |
| `CLOUDINARY_FOLDER` | No | Carpeta raíz (`travseeker` por defecto) |

\* Sin Cloudinary, las subidas desde el panel admin y el perfil no funcionan; las URLs externas y las ya guardadas siguen mostrándose.

### Frontend

| Variable | Prod | Descripción |
|----------|------|-------------|
| `VITE_API_URL` | Sí | URL del backend |

---

## Desarrollo local

```bash
# Terminal 1
cd backend && npm run dev    # http://localhost:3001

# Terminal 2
cd front && npm run dev      # http://localhost:5173
```

En local no hace falta `VITE_API_URL`: Vite hace proxy de `/api` al backend.

---

## Problemas frecuentes

**CORS** → `FRONTEND_URL` debe coincidir exactamente con la URL del front.

**API a localhost en prod** → Falta `VITE_API_URL` en Vercel. Redeploy.

**404 al recargar rutas** → Falta `vercel.json` o `_redirects`.

**DB vacía** → `npx prisma db push` + `node seed.js` en la DB de producción.

**No veo el panel admin** → El usuario debe tener `role = 'admin'` en la **misma base de datos** que usa el backend desplegado. En tu máquina, con el `DATABASE_URL` de producción en `backend/.env`:

```bash
cd backend
npm run db:promote-admin -- tu@email.com
```

Luego cierra sesión en la web y vuelve a entrar.
