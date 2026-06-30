# auth

Componentes relacionados con la sesión del usuario.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `UserMenu.tsx` | Menú desplegable del header: nombre del usuario, enlace a favoritos, cerrar sesión. Si no hay sesión, muestra enlace a `/auth`. |

## Dependencias

Usa `useAuth()` de `context/AuthContext.tsx` para leer el usuario y ejecutar `logout`.
