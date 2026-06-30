# config

Configuración de la conexión a la base de datos.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `database.js` | Crea el pool de conexiones `pg`, el adaptador `PrismaPg` y exporta la instancia singleton de `PrismaClient` usada en toda la API. |

## Variables de entorno

Requiere `DATABASE_URL` definida en `backend/.env`, por ejemplo:

```
DATABASE_URL="postgresql://postgres@localhost:5432/travseeker?schema=public"
```
