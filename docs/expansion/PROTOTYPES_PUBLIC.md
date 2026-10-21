# Prototipos 3 y 4: destinos primero, países como exploración secundaria

21 de octubre de 2026. Rama `new/expansion`.

## Alcance y decisión de jerarquía

Exploración aislada en `/mockups/expansion-publica.html`. No modifica el inicio, las rutas públicas ni la configuración real de publicación.

Tras revisar las primeras direcciones, el usuario aclaró que TravSeeker debe seguir recomendando destinos. Las tres propuestas mantienen el mismo inicio: portada de un destino, búsqueda, tipos de viaje, filtros y recomendaciones. Explorar por país aparece después de las recomendaciones, como alternativa de navegación. No se utiliza el país como entrada obligatoria ni como protagonista de la portada.

## Alternativas

| Selector | Sección secundaria de países | Página del país | Coste |
| --- | --- | --- | --- |
| 1. Franja | Cuatro tarjetas pequeñas; filas con foto lateral en móvil. | Panorámica, presentación y destinos. | Menos espacio para contextualizar cada país. |
| 2. Mosaico | Dos columnas de fotografías, apiladas en móvil. | Presentación lateral y exploración por regiones y destinos. | Ocupa más altura en el inicio. |
| 3. Lista | Filas con miniatura, tipos de viaje y enlace a destinos. | Cabecera fotográfica con bloque azul y exploración temática. | Menor protagonismo de las fotografías en la sección del inicio. |

Las tres páginas de país incluyen imagen, descripción, moneda e idiomas de ejemplo, regiones, filtros de planes y destinos. El mapa de OpenStreetMap se carga solo al abrir su desplegable.

## Uso

- Selector inferior o teclas 1, 2 y 3 para comparar las alternativas.
- Enlaces de países dentro de la sección inferior para entrar en su página.
- Escenarios: Inicio (España pública, Portugal próximo y otros ocultos), Expansión (España, Portugal y Francia públicas; Marruecos próximo) y Futuro (cuatro países publicados).
- Los escenarios son demostraciones y no cambian el catálogo real.
- Búsqueda, filtros de región, presupuesto y tipo de viaje, ampliación de resultados, favoritos locales, detalle de destino, temas claro/oscuro y navegación atrás/adelante.
- Favoritos exclusivos del prototipo, almacenados bajo `trav-expansion-public-prototype-saved`.
- Las fichas españolas pueden abrir su página real en otra pestaña. Las fichas internacionales indican expresamente que son ejemplos.

## Validación

- Revisión visual en escritorio de 1440 px y móvil de 390 px.
- Las tres propuestas, tanto inicio como página de país, comprobadas a 320 px sin desbordamiento horizontal.
- Orden de secciones comprobado: destinos antes de países.
- Búsqueda sin resultados y recuperación, filtros por región con teclado y foco conservado, favoritos persistentes tras recarga, detalle con cierre mediante Escape y ampliación de seis a ocho resultados.
- Escenario inicial: un único enlace a un país publicado y cuatro destinos de muestra. Enlace de Portugal en preparación: anuncio sin fichas.
- Mapa bajo demanda y página de Marruecos en el escenario futuro comprobados; tema oscuro revisado.
- Sin errores de consola en la revisión final. Validación sintáctica de módulos, lint y build del frontend.

## Fotografías y datos

La muestra española procede de las API públicas del catálogo existente. Las imágenes internacionales están enlazadas desde Wikimedia; las páginas de procedencia están disponibles en el diálogo «Fotografías y datos» y en `media.json`. No se han descargado ni subido fotos. Los textos y categorías internacionales son material de demostración para evaluar la interfaz, pendientes de revisión editorial si se integran.

Las capturas revisadas están en `front/output/playwright/expansion-publica-*-seccion.png`, `expansion-publica-*-pais.png` y `expansion-publica-inicio-revisado.png`.

La elección de variante queda pendiente. La integración se realizará después de seleccionarla.
