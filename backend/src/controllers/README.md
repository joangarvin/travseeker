# controllers

Capa que recibe las peticiones HTTP, valida datos básicos y delega en los servicios. Devuelve JSON o códigos de error.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `destinoController.js` | Endpoints de destinos: búsqueda con filtros, detalle por ID, relacionados, destacados y estadísticas. |
| `authController.js` | Registro (`register`), login y perfil (`me`). Valida email/contraseña antes de llamar al servicio. |
| `favoritoController.js` | CRUD de favoritos: listar, obtener IDs, comprobar si es favorito, añadir y eliminar. Requiere usuario autenticado. |

## Responsabilidad

Los controladores no contienen lógica de base de datos. Solo parsean `req`, llaman al servicio correspondiente y formatean `res` con el código HTTP adecuado.
