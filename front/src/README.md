# src

Código fuente principal de la aplicación React.

## Archivos en la raíz de src

| Archivo | Descripción |
|---------|-------------|
| `main.tsx` | Punto de entrada. Monta React en el DOM con `StrictMode`. |
| `App.tsx` | Router principal, providers (`ThemeProvider`, `AuthProvider`) y rutas lazy-loaded. |
| `App.css` | Estilos legacy o específicos del componente App (si los hay). |
| `index.css` | Punto de entrada de estilos: importa Tailwind y los módulos de `styles/`. |

## Carpetas

| Carpeta | Descripción |
|---------|-------------|
| `api/` | Cliente HTTP y llamadas al backend. [README](./api/README.md) |
| `assets/` | Imágenes importadas por los componentes. [README](./assets/README.md) |
| `components/` | Componentes UI reutilizables. [README](./components/README.md) |
| `constants/` | Valores fijos (filtros, URLs de imágenes). [README](./constants/README.md) |
| `context/` | Estado global con React Context. [README](./context/README.md) |
| `hooks/` | Hooks personalizados de datos y UI. [README](./hooks/README.md) |
| `pages/` | Páginas completas asociadas a rutas. [README](./pages/README.md) |
| `styles/` | CSS modular (tema, utilidades, fuentes). [README](./styles/README.md) |
| `types/` | Interfaces TypeScript. [README](./types/README.md) |
| `utils/` | Funciones puras de ayuda. [README](./utils/README.md) |

## Arquitectura

```
pages → components → hooks → api → backend
         ↘ context ↗
```

Las páginas orquestan componentes; los hooks encapsulan fetching y estado; la capa `api/` centraliza las peticiones HTTP.
