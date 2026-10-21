# Expansión: decisión de diseño

Se exploraron Mesa, Flujo y Territorio para las funcionalidades 1 (preparación y visibilidad) y 2 (contexto por país). Se eligió **Flujo** el 21 de octubre de 2026.

La superficie aislada de prototipos se ha retirado al integrar la propuesta elegida. El panel real está en `/admin`; los componentes están en `front/src/features/admin/publication/`.

Los estados acordados son En preparación · Oculto, Próximamente, Listo para publicar, Publicado y Oculto por país. La preparación y la intención de mostrar se guardan por separado. Los tipos de viaje y actividad son globales.

Véanse `IMPLEMENTATION.md`, `TUTORIAL_ADMIN.md` y `VALIDATION.md` para despliegue, uso y verificación.

Las funcionalidades públicas 3 y 4 combinan Mosaico en la home y Franja en la página de país. La elección y la integración están documentadas en PROTOTYPES_PUBLIC.md. Los prototipos retirados se conservan en el historial de Git.
