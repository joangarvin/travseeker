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
