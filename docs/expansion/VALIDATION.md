# Validación de los prototipos 1 y 2

## Comprobaciones automáticas

- 47 pruebas correctas: las 44 existentes y 3 del modelo aislado de publicación.
- Lint completo sin errores.
- TypeScript y build de la aplicación correctos.
- Sin importaciones de prototipos en la aplicación de producción.

## Comprobaciones en navegador

- Mesa, Flujo y Territorio revisados en escritorio de 1440 px y vistas móviles de 390 y 320 px.
- Sin desbordamiento horizontal del documento. Las barras de navegación territorial admiten desplazamiento interno.
- Tema claro y oscuro, selección de variantes mediante teclado y foco visible.
- Editor con guardado explícito, validación, mensaje de éxito, persistencia tras recargar, fallo simulado y protección del borrador al cerrar.
- Creación de un registro nuevo, comprobación de descripción mínima al marcar Acabado y estado inicial oculto.
- País y región conservados al pasar de Destinos a Hoteles y tras recargar.
- Un país oculto bloquea las fichas con Mostrar: Sí. Al publicar el país, se muestran solo las fichas elegibles.
- Francia en Próximamente muestra un anuncio sin exponer sus fichas.
- Hoteles en preparación no permiten activar Mostrar.
- Tutorial de cinco pasos, ejercicio independiente y controles adaptados a móvil.
- Consola del navegador sin errores.

## Límites de esta fase

Las vistas públicas son simulaciones. No se han modificado API, base de datos, permisos, rutas públicas ni el panel real. La protección real de contenido oculto en enlaces directos, buscador y mapas se implementará después de elegir una propuesta. Los datos de demostración se guardan en almacenamiento local separado.
