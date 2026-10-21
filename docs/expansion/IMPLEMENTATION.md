# Integración de Flujo: países y publicación

Rama `new/expansion`. Se integra la variante Flujo. Los editores completos existentes siguen disponibles desde «Crear o editar fichas» y «Abrir ficha completa».

## Preparación de una instalación

1. Hacer copia de seguridad de su base de datos.
2. En backend, instalar dependencias y ejecutar `npx prisma generate`.
3. Ejecutar `npm run db:migrate-country-publication` con la DATABASE_URL de esa instalación.
4. Reiniciar backend y desplegar el frontend de la misma revisión.

La migración es transaccional e idempotente. Crea España visible y Portugal, Francia y Marruecos ocultos. Asigna inicialmente los registros existentes a España y conserva su visibilidad previa. Repetirla no vuelve a publicar registros ocultados posteriormente. No se ha ejecutado contra la base compartida durante el desarrollo.

## Modelo

Preparación y Mostrar son campos separados. Las fichas nuevas empiezan ocultas. Las taxonomías son globales. El país condiciona la exposición de todos sus registros. Las localidades conservan también su control histórico de acceso a la guía para no habilitar accidentalmente guías incompletas anteriores.

Los cambios de visibilidad invalidan la caché del servidor y las respuestas públicas requieren revalidación en el navegador. Las API públicas filtran también registros relacionados: localidades, lugares, actividades y alojamientos. Los anuncios Próximamente solo exponen nombres y ubicaciones mínimas, sin abrir fichas incompletas.

## Administración

`/admin` abre el panel Flujo. La selección territorial se mantiene en la sesión del navegador. Listado, búsqueda, contadores y paginación se calculan en el servidor; las modificaciones están limitadas a administradores autenticados. El tutorial incluye un ejercicio independiente sin efectos sobre los datos.

El panel de publicación modifica los estados y la asignación territorial; el contenido y las traducciones se editan en la ficha completa. La creación hereda el contexto territorial activo.

## Revisión aislada

Las pruebas de integración solo aceptan `EXPANSION_TEST_DATABASE_URL=postgresql://joan@127.0.0.1:55439/postgres`. No deben utilizar una base compartida. El script `scripts/seed-publication-review.js` tiene la misma restricción y crea únicamente registros identificados como demostración y una cuenta de revisión local.
