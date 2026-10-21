# Validación de la integración del flujo

## Comprobaciones automáticas

- Frontend: 47 pruebas correctas, lint completo y build con TypeScript correctos.
- Backend: 148 pruebas correctas; la integración aislada se omite sin su variable explícita.
- PostgreSQL local desechable: 7 pruebas correctas de migración idempotente, conservación de visibilidad, consultas públicas, catálogos anidados, edición sin perder estados y permisos HTTP.
- Las pruebas de integración rechazan cualquier base distinta de la instancia local de revisión.

## Comprobaciones en navegador

- Panel real conectado a API real con registros sintéticos en http://localhost:5177/admin?lang=es.
- Escritorio y móvil de 390 y 320 px. Sin desbordamiento horizontal del documento; el tablero y los catálogos mantienen desplazamiento interno cuando es necesario.
- Guardado explícito persistente tras recargar, validación, protección de cambios pendientes y apertura de los editores completos de destinos y hoteles.
- País y región conservados al cambiar de catálogo. Los catálogos globales se distinguen de los territoriales.
- País oculto bloquea las fichas con Mostrar: Sí; Próximamente expone solo nombres, sin enlaces a contenido incompleto.
- Tutorial de cinco pasos con práctica independiente, teclado, foco visible y adaptación móvil.
- Vista integrada final sin errores de consola.
- Capturas en front/output/playwright/expansion-flujo-integrado-escritorio.png y expansion-flujo-integrado-movil.png.

## Despliegue pendiente

La implementación está en new/expansion. No se ha aplicado la migración a la base de datos compartida ni se ha desplegado. Seguir IMPLEMENTATION.md para generar Prisma, ejecutar la migración y publicar backend y frontend juntos. Los prototipos se han retirado al integrar el flujo real.
