# Validación de la integración del flujo

## Comprobaciones automáticas

- Frontend: 47 pruebas correctas, lint completo y build con TypeScript correctos.
- Backend: 149 pruebas correctas; la integración aislada se omite sin su variable explícita.
- PostgreSQL local desechable: 7 pruebas correctas de migración idempotente, conservación de visibilidad, consultas públicas, catálogos anidados, edición sin perder estados y permisos HTTP.
- Las pruebas de integración rechazan cualquier base distinta de la instancia local de revisión.

## Comprobaciones en navegador

- Validación inicial con registros sintéticos aislados. Tras la petición del usuario, http://localhost:5177/admin?lang=es está conectado al catálogo real de desarrollo.
- Escritorio y móvil de 390 y 320 px. Sin desbordamiento horizontal del documento; el tablero y los catálogos mantienen desplazamiento interno cuando es necesario.
- Guardado explícito persistente tras recargar, validación, protección de cambios pendientes y apertura de los editores completos de destinos y hoteles.
- País y región conservados al cambiar de catálogo. Los catálogos globales se distinguen de los territoriales.
- País oculto bloquea las fichas con Mostrar: Sí; Próximamente expone solo nombres, sin enlaces a contenido incompleto.
- Tutorial de cinco pasos con práctica independiente, teclado, foco visible y adaptación móvil.
- Vista integrada final sin errores de consola.
- Capturas en front/output/playwright/expansion-flujo-integrado-escritorio.png y expansion-flujo-integrado-movil.png.

## Estado de la instalación

La implementación está en new/expansion. La migración se aplicó a la base compartida el 21 de octubre de 2026 tras copia de seguridad, por petición del usuario. No se ha desplegado a producción el código de esta rama. Seguir IMPLEMENTATION.md para generar Prisma, ejecutar la migración y publicar backend y frontend juntos. Los prototipos se han retirado al integrar el flujo real.

Comprobación tras la migración real: 77 destinos, 831 municipios, 2.475 actividades e imprescindibles en el catálogo unificado, 102 hoteles, 102 restaurantes, 4 lugares y taxonomías globales (32 tipos de actividad, 6 tipos de viaje). Las rutas autenticadas de países, resumen y listados devuelven HTTP 200.

## Sustitución completa del panel anterior

- Cuenta de revisión administrativa creada por autorización del usuario e inicio de sesión normal completado en el panel conectado al catálogo real.
- Editores completos de destinos y municipios abiertos desde las tarjetas; guardado de hotel verificado sin cambiar sus campos.
- Formularios de creación de restaurantes y lugares comprobados; los lugares requieren elegir destino.
- Revisión editorial y la reseña existente accesibles desde la nueva navegación.
- Controles duplicados de visibilidad retirados de los editores.
- Escritorio y móviles de 390 y 320 px comprobados, editor de destino incluido; sin errores de consola en la revisión final.
- Test adicional de CSRF: admite solo los orígenes configurados y rechaza otros puertos y dominios.
