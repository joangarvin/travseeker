# routes

Definición de rutas HTTP y su vinculación con controladores.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `destinoRoutes.js` | `GET /` (búsqueda), `GET /:id` (detalle), `GET /:id/relacionados`. Montado en `/api/destinos`. |
| `authRoutes.js` | `POST /register`, `POST /login`, `GET /me` (protegida). Montado en `/api/auth`. |
| `favoritoRoutes.js` | Todas las rutas requieren autenticación. `GET /`, `GET /ids`, `GET /check/:destinoId`, `POST /:destinoId`, `DELETE /:destinoId`. Montado en `/api/favoritos`. |
| `adminRoutes.js` | CRUD de destinos y municipios. Requiere JWT + `role = 'admin'`. Montado en `/api/admin`. |

## Rutas adicionales

`GET /api/destacados` y `GET /api/stats` se registran directamente en `app.js`, no en un router separado.
