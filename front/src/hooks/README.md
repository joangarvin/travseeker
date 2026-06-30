# hooks

Hooks personalizados que encapsulan lógica de datos, filtros y efectos de UI.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `useDestinos.ts` | Carga destinos destacados al inicio y ejecuta búsquedas con filtros. Gestiona loading, errores de conexión y cancelación con `AbortController`. |
| `useDestinoDetail.ts` | Obtiene el detalle de un destino por ID desde la API. |
| `useRelatedDestinos.ts` | Carga destinos relacionados para la página de detalle. |
| `useSearchFilters.ts` | Estado y lógica de los filtros de búsqueda (valores, contador activo, limpiar). |
| `useScrollReveal.ts` | Intersection Observer para detectar cuándo un elemento entra en viewport. Usado por `ScrollReveal`. |

## Patrón

Los hooks de datos devuelven `{ data, loading, error }` y cancelan peticiones pendientes al desmontar o cambiar dependencias.
