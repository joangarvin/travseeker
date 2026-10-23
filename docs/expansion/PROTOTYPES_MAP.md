# Prototipo 6: exploración territorial en el mapa

23 de octubre de 2026 · rama `new/expansion`.

## Alcance corregido

La funcionalidad 5 amplía la ficha existente. No hay una ficha internacional distinta ni se cambia su diseño. Se añaden país y región en la ubicación, y moneda e idiomas en el resumen cuando están disponibles. Se conserva el acceso actual de Cómo llegar. Los metadatos generales reutilizan el perfil de país; los campos desconocidos no se inventan. No requiere migración ni modifica registros compartidos.

Las variantes de rediseño de ficha se descartaron por indicación del usuario. La exploración aislada que queda corresponde únicamente al mapa; no modifica `/mapa`.

## Propuestas

`/mockups/expansion-explorar.html?pagina=mapa&v=1`

| Número | Propuesta | Organización | Coste |
| --- | --- | --- | --- |
| 1 | Dividido | Lista y mapa simultáneos; en móvil se alternan con un control explícito. | Hay que cambiar de vista en móvil. |
| 2 | Atlas | Mapa protagonista y ficha breve del destino seleccionado. | Menos espacio para comparar varios resultados. |
| 3 | Lista | Destinos agrupados por país y mapa contextual lateral, encima en móvil. | Recorrido más largo de la lista. |

El selector inferior y las teclas 1–3 cambian de propuesta. La elección se conserva en `v`. En Atlas el selector se coloca arriba para no cubrir la ficha flotante. Las flechas izquierda/derecha también cambian de variante cuando el foco no está en un campo.

## Interacciones y datos

- Búsqueda, país, región y tipo de viaje; filtros en la URL y foco conservado tras aplicar un selector.
- Encuadre de resultados y agrupación de marcadores por país al alejar el mapa. Selección desde tarjeta o mapa.
- Vista previa de demostración internacional; los destinos españoles enlazan a su ficha actual.
- Escenario ampliado con 7 ejemplos y escenario España con 3. No altera la publicación real.
- Cartografía OpenStreetMap bajo petición, con reintento si falla. La elección pertenece al prototipo y no cambia las preferencias de privacidad de la web.
- Temas claro/oscuro, cierre de ventanas mediante Escape, foco visible y movimiento reducido.
- Imágenes españolas del catálogo e internacionales enlazadas desde Wikimedia, sin descargarlas ni subirlas. Fotos y datos abre las páginas de autoría y licencia. Leaflet procede del paquete instalado y conserva su licencia.

## Validación

Las tres variantes se revisaron en escritorio y móvil, incluyendo 320 px sin desbordamiento. Se comprobaron país, escenario España, búsqueda vacía y recuperación, selección y alternancia móvil. La ficha real se revisó con los datos añadidos a 320 px y en escritorio. Capturas en `front/output/playwright/prototipo6-*.png` y `destino-datos-pais-*.png`.

Tests existentes de frontend/backend, lint y build ejecutados. El ensayo PostgreSQL no se ha ejecutado en esta revisión; no se ha modificado la base compartida. La selección del mapa queda pendiente.
