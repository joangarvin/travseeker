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
```

La URL de conexión se configura en `../prisma.config.ts` y `../.env`.
