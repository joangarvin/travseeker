# middleware

Funciones intermedias de Express que se ejecutan antes de llegar al controlador.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `auth.js` | `requireAuth`: verifica el token JWT del header `Authorization: Bearer <token>`, carga el usuario activo y lo adjunta en `req.user`. |
| `errorHandler.js` | Middleware global de errores. Captura excepciones no manejadas y devuelve una respuesta JSON uniforme. |

## Uso de autenticación

Las rutas de `/api/favoritos` y `GET /api/auth/me` usan `requireAuth`. Si el token falta, es inválido o el usuario está desactivado, responde con `401`.
