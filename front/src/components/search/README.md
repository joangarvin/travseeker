# search

Componentes del bloque de búsqueda en la página de inicio.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `HeroSearch.tsx` | Sección hero principal: título, subtítulo, barra de búsqueda y panel de filtros. Orquesta `HeroBackground`, `SearchBar` y `FilterPanel`. |
| `HeroBackground.tsx` | Fondo decorativo del hero: gradiente mesh, blobs animados y watermark del logo. |
| `SearchBar.tsx` | Campo de búsqueda por texto libre con botón de envío. |
| `FilterPanel.tsx` | Filtros desplegables (presupuesto, masificación, ubicación, tipo de turismo, actividades) con botones Aplicar y Limpiar. |

## Flujo

`HeroSearch` recibe `onSearch` desde `Home` → `useDestinos` → `destinosApi.search()`.
