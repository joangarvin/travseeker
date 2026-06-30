# styles

Hojas de estilo CSS modularizadas. Se importan desde `index.css`.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `fonts.css` | Declaraciones `@font-face` para las tipografías de la marca. |
| `theme.css` | Variables CSS (`--color-brand`, `--color-primary`, etc.) para modo claro y oscuro. |
| `base.css` | Estilos base: reset parcial, tipografía global, scroll y fondos. |
| `utilities.css` | Clases utilitarias personalizadas: glass, blobs, animaciones, prose-premium, card-shine, etc. |

## Integración con Tailwind

`index.css` importa primero `@import "tailwindcss"` y luego estos módulos. Las variables de `theme.css` se usan en componentes con `var(--color-*)`.
