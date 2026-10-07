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
| `GET` | `/api/destinos` | Búsqueda y filtrado paginado de destinos |
| `GET` | `/api/destinos/:id` | Detalle de un destino |
| `GET` | `/api/destinos/:id/relacionados` | Destinos relacionados |
| `GET` | `/api/destacados` | Destinos destacados |
| `GET` | `/api/stats` | Estadísticas generales |
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión y limpiar la cookie HttpOnly |
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

La búsqueda admite `limit` (1–100), `offset` y `meta=1`. Con `meta=1` devuelve
`{ items, total, hasMore }`; sin ese parámetro conserva una lista compatible con clientes anteriores.

## Scripts útiles

```bash
npm run db:push          # Sincronizar schema Prisma
npm run db:seed          # Importar destinos desde CSV
npm run db:coords        # Rellenar coordenadas del mapa
npm run db:merge-municipios # Revisar duplicados (sin modificar datos)
npm run db:merge-municipios -- --apply # Fusionar con copia previa y verificar enlaces
npm run db:promote-admin -- otro@email.com   # Dar rol admin a un usuario
```

La fusión de municipios conserva la ficha publicada más completa, priorizando los
campos rellenados y el texto de conexiones más detallado. Completa los campos
vacíos con las otras versiones y conserva traducciones. Cuando hay valores
distintos, mantiene los de la ficha elegida; las alternativas quedan en la copia
previa de `backend/backups/` (excluida de Git). También corrige las variantes
auditadas Mondoñero/Mondoñedo y Santillana de Mar/Santillana del Mar.
El script reasigna los enlaces de destinos y los municipios base de itinerarios
en una transacción, verifica los enlaces antes de confirmar y rechaza coordenadas
incompatibles. El nombre por sí solo no acredita la identidad geográfica: revisa
la vista previa antes de aplicarlo a nuevas importaciones. Este script no impide
que el administrador o una importación creen nuevos duplicados.

## Cuenta administrador

1. El usuario debe existir (registrarse en la app).
2. Ejecutar con el `DATABASE_URL` correcto (local o producción):

```bash
cd backend
npm run db:promote-admin -- otro@email.com
```

3. Cerrar sesión en la web y volver a entrar para ver `/admin` en el menú.
