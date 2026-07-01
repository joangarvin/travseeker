# middleware

Funciones intermedias de Express que se ejecutan antes de llegar al controlador.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `auth.js` | `requireAuth`: verifica el token JWT del header `Authorization: Bearer <token>`, carga el usuario activo y lo adjunta en `req.user`. `requireAdmin`: exige `req.user.role === 'admin'` (403 si no). |
| `errorHandler.js` | Middleware global de errores. Captura excepciones no manejadas y devuelve una respuesta JSON uniforme. |

## Uso de autenticación

Las rutas de `/api/favoritos`, `GET /api/auth/me` y `/api/admin/*` usan `requireAuth`. Las rutas admin añaden `requireAdmin`.
