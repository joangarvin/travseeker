# Backend

API REST de Travseeker. Servidor **Node.js + Express** que expone destinos, autenticación de usuarios y favoritos, conectándose a **PostgreSQL** mediante **Prisma**.

## Arranque

```bash
cd backend
node index.js
```

El servidor escucha en `http://localhost:3001` (configurable con `PORT` en `.env`).

## Archivos en la raíz

| Archivo | Descripción |
|---------|-------------|
| `index.js` | Punto de entrada. Carga y ejecuta `src/app.js`. |
| `package.json` | Dependencias y metadatos del proyecto Node. |
| `package-lock.json` | Versiones exactas de dependencias instaladas. |
| `prisma.config.ts` | Configuración del CLI de Prisma 7: ruta del schema, migraciones y `DATABASE_URL`. |
| `seed.js` | Script para poblar la base de datos leyendo CSVs e insertando destinos y municipios. |
| `scripts/promote-admin.js` | Promueve un usuario a `role = 'admin'`. Ver [Cuenta administrador](#cuenta-administrador). |
| `scripts/coords.js` | Asigna coordenadas curadas a destinos para el mapa. |
| `.env` | Variables de entorno (`DATABASE_URL`, `JWT_SECRET`, etc.). No se sube a git. |
| `.gitignore` | Archivos y carpetas ignorados por git. |

## Carpetas

| Carpeta | Descripción |
|---------|-------------|
| `prisma/` | Schema de la base de datos. Ver [prisma/README.md](./prisma/README.md). |
| `src/` | Código fuente de la API. Ver [src/README.md](./src/README.md). |

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/destinos` | Búsqueda y filtrado de destinos |
| `GET` | `/api/destinos/:id` | Detalle de un destino |
| `GET` | `/api/destinos/:id/relacionados` | Destinos relacionados |
| `GET` | `/api/destacados` | Destinos aleatorios destacados |
| `GET` | `/api/stats` | Estadísticas generales |
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado |
| `GET` | `/api/favoritos` | Lista de favoritos del usuario |
| `POST` | `/api/favoritos/:destinoId` | Añadir favorito |
| `DELETE` | `/api/favoritos/:destinoId` | Quitar favorito |
| `GET` | `/api/admin/destinos` | Lista destinos (solo admin) |
| `POST` | `/api/admin/destinos` | Crear destino (solo admin) |
| `PUT` | `/api/admin/destinos/:id` | Actualizar destino (solo admin) |
| `DELETE` | `/api/admin/destinos/:id` | Eliminar destino (solo admin) |
| `POST` | `/api/admin/destinos/:id/municipios` | Crear municipio (solo admin) |
| `PUT` | `/api/admin/municipios/:id` | Actualizar municipio (solo admin) |
| `DELETE` | `/api/admin/municipios/:id` | Eliminar municipio (solo admin) |

## Scripts útiles

```bash
npm run db:push          # Sincronizar schema Prisma
npm run db:seed          # Importar destinos desde CSV
npm run db:coords        # Rellenar coordenadas del mapa
npm run db:promote-admin -- otro@email.com   # Dar rol admin a un usuario
```

## Cuenta administrador

1. El usuario debe existir (registrarse en la app).
2. Ejecutar con el `DATABASE_URL` correcto (local o producción):

```bash
cd backend
npm run db:promote-admin -- otro@email.com
```

3. Cerrar sesión en la web y volver a entrar para ver `/admin` en el menú.
