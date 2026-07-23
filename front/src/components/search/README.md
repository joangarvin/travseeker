# search

Componentes del bloque de búsqueda en la página de inicio.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `HeroSearch.tsx` | Sección hero principal: titular editorial desalineado, ficha de búsqueda girada (con grapa y sello «revisado a mano») y panel de filtros. Orquesta `SearchBar` y `FilterPanel`. |
| `SearchBar.tsx` | Campo de búsqueda por texto libre con botón de envío. |
| `FilterPanel.tsx` | Filtros desplegables (presupuesto, masificación, ubicación, tipo de turismo, actividades) con botones Aplicar y Limpiar. |

## Flujo

`HeroSearch` recibe `onSearch` desde `Home` → `useDestinos` → `destinosApi.search()`.
