# prisma

Definición del modelo de datos y configuración de Prisma ORM.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `schema.prisma` | Schema de la base de datos. Define los modelos `Destino`, `Municipio`, `User` y `Favorito`, sus campos y relaciones. |

## Modelos

- **Destino** — Destino turístico con datos de masificación, presupuesto, ubicación, descripción e imagen.
- **Municipio** — Municipios asociados a un destino (precios, conexiones, tipo de turismo).
- **User** — Usuario registrado. Incluye campos extensibles (`preferences`, `metadata`, `role`, `locale`, etc.) para futuras funcionalidades.
- **Favorito** — Relación usuario–destino. Un usuario no puede duplicar el mismo destino en favoritos.

## Comandos útiles

```bash
npx prisma db push      # Sincronizar schema con la base de datos
npx prisma generate     # Regenerar el cliente Prisma
node seed.js            # Poblar datos desde CSV
npm run db:promote-admin -- otro@email.com   # Promover usuario a admin
```

El campo `User.role` admite valores como `user` (por defecto) y `admin`. Solo los administradores acceden a `/api/admin/*` y al panel `/admin` del frontend.

La URL de conexión se configura en `../prisma.config.ts` y `../.env`.

## Fichas de municipios

`Municipio` incluye descripción, fotografía y texto alternativo, ubicación, web oficial,
mejor época y consejos, además de las conexiones, precios y coordenadas existentes.
La ruta pública es `/municipio/:id` y solo muestra municipios publicados.

`Experience`, `Hotel` y `Restaurant` son catálogos reutilizables. Las tablas
`MunicipioExperience`, `MunicipioHotel` y `MunicipioRestaurant` guardan las asociaciones
con orden independiente por municipio. Desasociar conserva el registro del catálogo.
Las fichas se crean como borrador salvo publicación explícita desde administración.

Una experiencia puede reutilizar un `EssentialItem` existente mediante su identificador
único: los textos, imagen, duración y web se leen del original. La edición desde el
catálogo actualiza esos campos del original en la misma transacción. Un imprescindible
cuyo destino no esté publicado tampoco se muestra en una ficha pública de municipio.
El catálogo `Activity` sigue representando tipos de actividades, no planes concretos.

Aplicar la migración aditiva e idempotente (sin modificar contenido):

```bash
npm run db:migrate-municipality-guides
npx prisma generate
```

La migración SQL también está en `migrations/20261007000000_municipality_guides`.
No utilizar `migrate deploy` sin revisar antes el historial de instalaciones gestionadas
con `db:push`.

La comprobación optativa `node scripts/check-municipality-guides.js` ejecuta escritura,
asociación, reutilización y publicación dentro de una transacción que siempre se revierte;
requiere la API local en el puerto 3001 para verificar la protección de administración.

### Catálogo único de actividades

`npm run db:migrate-unified-activities` añade referencias opcionales de los imprescindibles a las actividades compartidas. No borra ni convierte las fichas actuales. El catálogo de administración muestra una sola vez cada actividad y su imprescindible de origen; una misma actividad puede destacarse en varios destinos y asociarse a varios municipios. Los enlaces antiguos de administración siguen funcionando.

Comprobación de reutilización, edición compartida, referencias estables y traducciones: `node scripts/check-unified-activities.js`. Todas las escrituras de la comprobación se revierten.
