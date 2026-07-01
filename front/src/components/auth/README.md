# auth

Componentes relacionados con la sesión del usuario.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `UserMenu.tsx` | Menú desplegable del header: favoritos, colecciones, configuración, panel admin (si `role === 'admin'`) y cerrar sesión. |
| `AdminRoute.tsx` | Protege rutas admin: redirige a `/auth` o `/` si no hay sesión o no es administrador. |

## Dependencias

Usa `useAuth()` de `context/AuthContext.tsx` para leer el usuario y ejecutar `logout`.
