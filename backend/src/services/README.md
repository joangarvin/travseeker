# services

Lógica de negocio y acceso a datos con Prisma. Es la capa que los controladores consumen.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `destinoService.js` | Búsqueda con filtros dinámicos, detalle con municipios, destinos relacionados, destacados aleatorios y conteo total. |
| `authService.js` | Registro (hash de contraseña, valores por defecto en `preferences`/`metadata`), login (actualiza `lastLoginAt`) y obtención del perfil. |
| `favoritoService.js` | Listar favoritos con destino embebido, obtener IDs, añadir (idempotente si ya existe), eliminar y comprobar estado. |

## Principios

- Los servicios lanzan errores con `error.status` para que los controladores respondan con el código HTTP correcto.
- Las contraseñas nunca salen de esta capa en texto plano; solo se guarda `passwordHash`.
