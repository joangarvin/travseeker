# services

Lógica de negocio y acceso a datos con Prisma. Es la capa que los controladores consumen.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `destinoService.js` | Búsqueda con filtros dinámicos, detalle con municipios, destinos relacionados, destacados aleatorios y conteo total. |
| `authService.js` | Registro (hash de contraseña, valores por defecto en `preferences`/`metadata`), login (actualiza `lastLoginAt`) y obtención del perfil. |
| `favoritoService.js` | Listar favoritos con destino embebido, obtener IDs, añadir (idempotente si ya existe), eliminar y comprobar estado. |
| `adminService.js` | CRUD de destinos y municipios para el panel de administración. |

## Viajes y recomendaciones

`collectionService.js` coordina permisos y consultas de viajes. Las validaciones de fechas, viajeros y paradas están en `../domain/collectionPayload.js`; los permisos en `collectionAccess.js`, el orden en `collectionOrder.js` y la agenda en `itinerary.js`.

`recommendationService.js` obtiene los datos. `../domain/recommendations.js` calcula puntuaciones, motivos y orden sin depender de Prisma. El identificador de texto compartido por actividades y tipos de viaje está en `../utils/slugify.js`.

## Principios

- Los servicios lanzan errores con `error.status` para que los controladores respondan con el código HTTP correcto.
- Las contraseñas nunca salen de esta capa en texto plano; solo se guarda `passwordHash`.
