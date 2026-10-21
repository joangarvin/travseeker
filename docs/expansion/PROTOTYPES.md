# Expansión internacional: prototipos 1 y 2

Rama: `new/expansion`. Superficie aislada: `/mockups/expansion.html`.
Esta fase no modifica el panel real, las API, las tablas ni los permisos.

## Alcance

1. Estado editorial (En preparación / Acabado) independiente de la intención de mostrar.
2. Contexto persistente de país y región para los distintos catálogos.
3. Tutorial integrado para editores y vista previa del resultado público.

## Contrato de visibilidad propuesto

| Preparación | Mostrar | Resultado |
|---|---|---|
| En preparación | No | En preparación · Oculto |
| En preparación | Sí | Próximamente, solo en tipos que admitan anuncio |
| Acabado | No | Listo para publicar |
| Acabado | Sí | Publicado, si el país está publicado |

Un país en Próximamente no expone sus fichas hijas. Un registro listo para mostrar bajo un país no publicado aparece como Oculto por país. Se conserva su intención de publicación sin mostrarlo todavía.

Los hoteles, restaurantes y actividades concretas no muestran anuncios vacíos: mientras están en preparación, Mostrar permanece desactivado. Países, destinos y localidades pueden admitir Próximamente.

Los nuevos registros empiezan En preparación y ocultos. Acabado exige los campos mínimos de este prototipo; estas validaciones no sustituyen una futura revisión editorial real.

Los tipos de viaje y actividad son taxonomías globales; el selector de país no debe duplicarlas.

## Variantes

- Mesa: catálogo en tabla, edición en diálogo y resumen de país.
- Flujo: columnas editoriales, movimiento explícito mediante edición.
- Territorio: navegación por países y regiones, catálogo contextual.

Los cambios usan almacenamiento local separado de la aplicación. Guardar es explícito; un fallo conserva el borrador. Las vistas públicas son simulaciones para evaluar la propuesta, no nuevas rutas públicas.
