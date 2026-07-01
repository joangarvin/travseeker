# types

Interfaces y tipos TypeScript compartidos en toda la app.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `index.ts` | Tipos de dominio de destinos: `Destino` (listado), `Municipio` y `DestinoDetail` (detalle completo). |
| `user.ts` | Tipos de usuario y autenticación: `User`, `AuthResponse` y `Favorito` (con destino embebido). |
| `admin.ts` | Tipos del panel admin: destinos, municipios, formulario y payload API. |

## Uso

Importar desde `'../types'` o `'../types/user'` según el módulo. Mantener sincronizados con las respuestas del backend y los selects de Prisma.
