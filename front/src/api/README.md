# api

Capa de comunicación con el backend. Centraliza `fetch`, manejo de errores y cabeceras de autenticación.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `config.ts` | `API_BASE`: en desarrollo usa rutas relativas (proxy de Vite); en producción apunta a `http://127.0.0.1:3001`. |
| `client.ts` | `apiFetch`: wrapper de `fetch` con soporte para método, body JSON, token Bearer y `AbortSignal`. Define la clase `ApiError`. |
| `destinos.ts` | API de destinos: destacados, búsqueda con filtros, detalle y relacionados. |
| `auth.ts` | API de autenticación: registro, login y perfil (`/api/auth/me`). |
| `favoritos.ts` | API de favoritos: listar, obtener IDs, añadir y eliminar. |

## Uso típico

```ts
import { apiFetch } from './client';

// GET con cancelación
apiFetch<Destino[]>('/api/destacados', { signal });

// POST autenticado
apiFetch('/api/favoritos/abc-123', { method: 'POST', token });
```
