# Travseeker

Aplicación web full-stack para descubrir destinos turísticos en España con información de masificación, presupuesto y municipios. Migrada desde Wix a un stack propio y escalable.

## Stack

| Capa | Tecnologías |
|------|-------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, Prisma |
| Base de datos | PostgreSQL |

## Estructura del repositorio

```
TravSeeker/
├── Logo/          → Recursos gráficos originales de la marca
├── backend/       → API REST y base de datos
└── front/         → Interfaz web React
```

Cada carpeta tiene su propio `README.md` con la descripción de archivos y subcarpetas.

## Documentación por carpeta

### Raíz y marca
- [Logo/README.md](./Logo/README.md)

### Backend
- [backend/README.md](./backend/README.md)
- [backend/prisma/README.md](./backend/prisma/README.md)
- [backend/src/README.md](./backend/src/README.md)
- [backend/src/config/README.md](./backend/src/config/README.md)
- [backend/src/constants/README.md](./backend/src/constants/README.md)
- [backend/src/controllers/README.md](./backend/src/controllers/README.md)
- [backend/src/middleware/README.md](./backend/src/middleware/README.md)
- [backend/src/routes/README.md](./backend/src/routes/README.md)
- [backend/src/services/README.md](./backend/src/services/README.md)
- [backend/src/utils/README.md](./backend/src/utils/README.md)

### Frontend
- [front/README.md](./front/README.md)
- [front/public/README.md](./front/public/README.md)
- [front/src/README.md](./front/src/README.md)
- [front/src/api/README.md](./front/src/api/README.md)
- [front/src/assets/README.md](./front/src/assets/README.md)
- [front/src/components/README.md](./front/src/components/README.md)
- [front/src/context/README.md](./front/src/context/README.md)
- [front/src/hooks/README.md](./front/src/hooks/README.md)
- [front/src/pages/README.md](./front/src/pages/README.md)
- [front/src/styles/README.md](./front/src/styles/README.md)
- [front/src/types/README.md](./front/src/types/README.md)
- [front/src/utils/README.md](./front/src/utils/README.md)

## Arranque local

Necesitas **dos terminales**: una para el backend y otra para el frontend.

### Backend (puerto 3001)

```bash
cd backend
node index.js
```

### Frontend (puerto 5173)

```bash
cd front
npm run dev
```

Abre `http://localhost:5173` en el navegador.

### Parar los servidores

En cada terminal: `Ctrl + C`

## Variables de entorno

Copia las plantillas y rellena tus valores:

```bash
cp backend/.env.example backend/.env
cp front/.env.example front/.env   # solo necesario en producción/build
```

En `backend/.env` (desarrollo):

```
DATABASE_URL="postgresql://postgres@localhost:5432/travseeker?schema=public"
JWT_SECRET="tu-secreto-seguro"
APP_URL="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"
```

## Despliegue en producción

**No hace falta crear dos repos en GitHub.** Lo habitual es un monorepo con `backend/` y `front/`, y desplegar cada carpeta en su plataforma.

Guía completa paso a paso: **[DEPLOY.md](./DEPLOY.md)**

Resumen rápido:

| Pieza | Plataforma sugerida |
|-------|---------------------|
| PostgreSQL | Neon |
| Backend API | Railway o Render |
| Frontend React | Vercel o Netlify |

## Funcionalidades

- Búsqueda y filtrado de destinos
- Detalle con municipios, masificación e imprescindibles
- Modo claro/oscuro
- Registro, login y sesión con JWT
- Guardar destinos en favoritos (`/favoritos`)
- Colecciones / itinerarios de viaje (`/colecciones`)
- Comparador de destinos (`/comparar`)
- Recomendaciones personalizadas ("Para ti")
- Mapa interactivo, reseñas y mejor época para viajar
