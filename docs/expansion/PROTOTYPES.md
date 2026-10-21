# Expansión: decisión de diseño

Se exploraron Mesa, Flujo y Territorio para las funcionalidades 1 (preparación y visibilidad) y 2 (contexto por país). Se eligió **Flujo** el 21 de octubre de 2026.

La superficie aislada de prototipos se ha retirado al integrar la propuesta elegida. El panel real está en `/admin`; los componentes están en `front/src/features/admin/publication/`.

Los estados acordados son En preparación · Oculto, Próximamente, Listo para publicar, Publicado y Oculto por país. La preparación y la intención de mostrar se guardan por separado. Los tipos de viaje y actividad son globales.

Véanse `IMPLEMENTATION.md`, `TUTORIAL_ADMIN.md` y `VALIDATION.md` para despliegue, uso y verificación.
