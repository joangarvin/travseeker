# constants

Constantes compartidas del backend, principalmente selects de Prisma para no repetir qué campos devolver en cada consulta.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `selects.js` | Define `LIST_SELECT` (campos públicos de un destino en listados) y `USER_PUBLIC_SELECT` (campos del usuario sin datos sensibles como `passwordHash`). |

## Uso

Los servicios importan estos objetos en las consultas `findMany`, `findUnique` y `create` de Prisma para mantener respuestas consistentes y seguras.
