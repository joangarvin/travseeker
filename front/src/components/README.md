# components

Componentes React reutilizables, organizados por dominio funcional.

## Carpetas

| Carpeta | Descripción |
|---------|-------------|
| `auth/` | Componentes de autenticación y menú de usuario. [README](./auth/README.md) |
| `destinations/` | Tarjetas, hero, gráficos y listados de destinos. [README](./destinations/README.md) |
| `layout/` | Estructura global: cabecera y pie. [README](./layout/README.md) |
| `search/` | Hero de búsqueda, barra y panel de filtros. [README](./search/README.md) |
| `ui/` | Componentes genéricos de interfaz. [README](./ui/README.md) |

## Convenciones

- Cada componente vive en su propio archivo `.tsx`.
- Los componentes de listado usan `memo()` cuando el renderizado puede ser costoso.
- Los estilos usan clases de Tailwind y variables CSS de `styles/theme.css`.
