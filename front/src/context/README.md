# context

Estado global de la aplicación con React Context API.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `ThemeContext.tsx` | Tema claro/oscuro. Persiste en `localStorage` (`travseeker-theme`) y aplica `data-theme` en `<html>`. Exporta `ThemeProvider` y `useTheme()`. |
| `AuthContext.tsx` | Sesión de usuario: token JWT, perfil, IDs de favoritos, login/registro/logout y `toggleFavorite`. Persiste el token en `localStorage`. Exporta `AuthProvider` y `useAuth()`. |

## Uso

Los providers se montan en `App.tsx` envolviendo el router:

```
ThemeProvider → AuthProvider → Router
```
