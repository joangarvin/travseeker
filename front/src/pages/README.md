# pages

Páginas completas asociadas a rutas en `App.tsx`. Cada una compone layout, componentes y hooks.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `Home.tsx` | Página de inicio (`/`): header, hero de búsqueda, grid de destinos y footer. |
| `About.tsx` | Página sobre nosotros (`/sobre-nosotros`): misión, valores y presentación de la marca. |
| `DestinationDetail.tsx` | Detalle de destino (`/destino/:id`): hero, descripción, gráfico de masificación, imprescindibles, municipios y relacionados. |
| `Auth.tsx` | Login y registro (`/auth`): formulario con pestañas, validación y redirección a favoritos. |
| `Favoritos.tsx` | Lista de destinos guardados (`/favoritos`). Si no hay sesión, invita a iniciar sesión. |
| `AdminPanel.tsx` | Panel de administración (`/admin`). Orquesta layout; la lógica vive en `hooks/useAdminPanel` y `components/admin/`. |

## Carga diferida

Todas las páginas se importan con `React.lazy()` en `App.tsx` para reducir el bundle inicial.
