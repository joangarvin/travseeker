# utils

Funciones auxiliares reutilizables sin lógica de negocio específica de un dominio.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `buildWhereClause.js` | Construye el objeto `where` de Prisma a partir de query params de búsqueda (texto libre, presupuesto, masificación, ubicación, tipo de turismo, actividades). |
| `jwt.js` | Firma y verifica tokens JWT con `JWT_SECRET` y expiración configurable (`JWT_EXPIRES_IN`, por defecto 7 días). |
| `password.js` | Hash y comparación de contraseñas con `bcryptjs`. |
