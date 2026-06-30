# src

Código fuente de la API. Sigue una arquitectura en capas: rutas → controladores → servicios → base de datos.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `app.js` | Configuración de Express: middleware (CORS, JSON), registro de rutas y arranque del servidor en el puerto 3001. |

## Carpetas

| Carpeta | Descripción |
|---------|-------------|
| `config/` | Conexión a PostgreSQL y cliente Prisma. [README](./config/README.md) |
| `constants/` | Selects reutilizables de Prisma. [README](./constants/README.md) |
| `controllers/` | Manejo de peticiones HTTP y respuestas. [README](./controllers/README.md) |
| `middleware/` | Autenticación JWT y manejo global de errores. [README](./middleware/README.md) |
| `routes/` | Definición de rutas de la API. [README](./routes/README.md) |
| `services/` | Lógica de negocio y consultas a la base de datos. [README](./services/README.md) |
| `utils/` | Utilidades compartidas (JWT, contraseñas, filtros SQL). [README](./utils/README.md) |

## Flujo de una petición

```
Cliente → routes → controller → service → Prisma → PostgreSQL
                ↘ middleware (auth) ↗
```
