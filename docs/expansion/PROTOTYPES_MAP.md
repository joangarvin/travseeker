# Atlas: propuesta seleccionada e integrada

23 de octubre de 2026 · rama `new/expansion`.

Atlas sustituye el mapa público en `/mapa`. Las propuestas Dividido y Lista se han retirado junto al selector de prototipos; el historial de Git conserva la exploración previa.

- Usa únicamente destinos publicados de la API real, con país y región disponibles. No incorpora ejemplos internacionales ficticios ni altera publicaciones.
- Hasta zoom 4 muestra agrupaciones por país; desde zoom 5 muestra destinos individuales con el color de su tipo principal, nombre y leyenda. Pulsar un país acerca el mapa sin aplicar un filtro.
- Mantiene los filtros compartidos de Descubrir, búsqueda, mapa/lista, enlace a la ficha existente y consentimiento de cartografía.
- Selección y filtros quedan en la URL y responden al historial del navegador. Encuadre, cerrar, anterior/siguiente, comparación real de hasta cuatro destinos, guardados autenticados y compartir aportan feedback textual.
- En móvil la ficha ocupa una fila debajo del mapa. Los controles tienen objetivos táctiles de 44 px, foco visible y animaciones breves que respetan movimiento reducido.

La ficha de destino conserva su diseño y sus datos internacionales añadidos anteriormente. No requiere migraciones ni cambios de contenido.

## Países y marcadores fotográficos

Se corrigió el backend de desarrollo desactualizado del puerto 3001, cuya respuesta de mapa carecía de país. Se confirmó que los 77 resultados actuales pertenecen a ES. El cliente normaliza códigos y admite la relación country; si falta toda la información agrupa bajo una única etiqueta genérica en lugar de crear una por destino. Nunca asume España para datos sin país.

La vista lejana muestra un contorno geográfico azul suave de los países publicados con resultados, con etiqueta y contador. Los contornos de España, Portugal, Francia y Marruecos proceden de Natural Earth 1:50m v5.1.2, dominio público; se conservan islas y atribución en el directorio data. No se muestran países ocultos ni sin resultados.

Los destinos usan fotografías con aro del tipo principal y rótulos progresivos al acercarse. A escala intermedia se agrupan por proximidad visual sin mezclar países; al pulsar se desagrupan con zoom y feedback textual. La selección permanece individual y prioritaria. Las miniaturas Cloudinary se limitan a 96 px.

En escritorio se muestra solo el mapa, incluso al abrir una URL de lista. El selector Mapa/Lista permanece en móvil y sin recrear el mapa al redimensionar. Las animaciones respetan movimiento reducido.

Validación: API real del puerto 3001 con 77 resultados ES; tests de agrupación, metadatos incompletos y marcadores próximos; lint y build. La revisión visual de esta iteración no se ha completado: la herramienta de navegador no pudo iniciar su runtime. Las capturas de la iteración anterior no acreditan estos cambios.

## Corrección de miniaturas y rendimiento al navegar

Las imágenes de los pines tenían menos especificidad que `.leaflet-container .leaflet-marker-pane img` de Leaflet, que establece `width:auto`. Se limita la corrección a las miniaturas propias (posición absoluta, tamaño al 100%, límites explícitos) para no afectar las teselas.

Los eventos de cartografía se gestionan en AtlasCartography; ya no actualizan MapPage por cada carga durante el movimiento. AtlasMapPoints está memoizado con callback de selección estable. Cada pin memoriza su DivIcon y posición: las actualizaciones ajenas al contenido no ejecutan setIcon ni sustituyen su imagen. Las miniaturas tienen dimensiones y decodificación asíncrona, conservando el tamaño Cloudinary de 96 px. Las sombras usan box-shadow en lugar de filtros de composición sobre las fotografías.

La capa solicita teselas al terminar el arrastre y no para escalas intermedias del zoom. La agrupación usa celdas espaciales vecinas y medias incrementales en lugar de comparar con todos los grupos y recalcular sumas completas. Un ensayo de 10.000 destinos verifica integridad, separación por país y selección individual; no constituye una medición de FPS del mapa.

Tests, lint y build comprobados. Revisión visual pendiente por fallo de arranque de la herramienta de navegador; no hay capturas nuevas de esta corrección.
