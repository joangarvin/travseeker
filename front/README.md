# front

Aplicación web de Travseeker. **React 19 + Vite + TypeScript + Tailwind CSS v4**.

## Arranque

```bash
cd front
npm run dev
```

La app se sirve en `http://localhost:5173`. En desarrollo, las peticiones a `/api/*` se redirigen al backend (`vite.config.ts` → puerto 3001).

## Archivos en la raíz

| Archivo | Descripción |
|---------|-------------|
| `index.html` | HTML base. Punto de montaje de React (`#root`) y metadatos de la página. |
| `package.json` | Dependencias y scripts (`dev`, `build`, `preview`, `lint`). |
| `package-lock.json` | Versiones exactas de dependencias. |
| `vite.config.ts` | Configuración de Vite: React, Tailwind, proxy `/api` y code splitting del vendor. |
| `eslint.config.js` | Reglas de linting para TypeScript/React. |
| `tsconfig.json` | Configuración TypeScript raíz del proyecto. |
| `tsconfig.app.json` | Configuración TS específica del código de la app (`src/`). |
| `tsconfig.node.json` | Configuración TS para archivos de tooling (Vite, etc.). |

## Carpetas

| Carpeta | Descripción |
|---------|-------------|
| `public/` | Archivos estáticos servidos tal cual. [README](./public/README.md) |
| `src/` | Código fuente de la aplicación. [README](./src/README.md) |

## Rutas de la app

| Ruta | Página |
|------|--------|
| `/` | Inicio con búsqueda y destinos |
| `/sobre-nosotros` | Información sobre Travseeker |
| `/destino/:id` | Detalle de un destino |
| `/auth` | Login y registro |
| `/favoritos` | Destinos guardados del usuario |
