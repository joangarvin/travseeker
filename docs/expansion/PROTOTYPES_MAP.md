# Atlas: propuesta seleccionada e integrada

23 de octubre de 2026 · rama `new/expansion`.

Atlas sustituye el mapa público en `/mapa`. Las propuestas Dividido y Lista se han retirado junto al selector de prototipos; el historial de Git conserva la exploración previa.

- Usa únicamente destinos publicados de la API real, con país y región disponibles. No incorpora ejemplos internacionales ficticios ni altera publicaciones.
- Hasta zoom 4 muestra agrupaciones por país; desde zoom 5 muestra destinos individuales con el color de su tipo principal, nombre y leyenda. Pulsar un país acerca el mapa sin aplicar un filtro.
- Mantiene los filtros compartidos de Descubrir, búsqueda, mapa/lista, enlace a la ficha existente y consentimiento de cartografía.
- Selección y filtros quedan en la URL y responden al historial del navegador. Encuadre, cerrar, anterior/siguiente, comparación real de hasta cuatro destinos, guardados autenticados y compartir aportan feedback textual.
- En móvil la ficha ocupa una fila debajo del mapa. Los controles tienen objetivos táctiles de 44 px, foco visible y animaciones breves que respetan movimiento reducido.

La ficha de destino conserva su diseño y sus datos internacionales añadidos anteriormente. No requiere migraciones ni cambios de contenido.
