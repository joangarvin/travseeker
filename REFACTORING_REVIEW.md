# Revisión de legibilidad — 16 de octubre de 2026

La [guía del código](./GUIA_DEL_CODIGO.md) es el punto de entrada para leer el proyecto en español. La [revisión funcional ampliada](./REVISION_NAVEGADOR.md) documenta las pruebas posteriores con API y PostgreSQL reales y las correcciones encontradas.

## Alcance

Se ha recorrido el inventario de archivos versionados, el grafo de importaciones de frontend y backend, los puntos de entrada, scripts y pruebas, las referencias a recursos públicos y las comprobaciones existentes. Las extracciones se concentran en los archivos que mezclaban responsabilidades. No se ha cambiado el esquema ni escrito en la base de datos habitual; las pruebas de escritura utilizaron una base temporal independiente.

La detección de archivos sin referencias es estática; no sustituye una auditoría exhaustiva de cada export, selector CSS o combinación de datos reales. Los módulos que solo registran efectos pueden devolver `null` y seguir siendo necesarios.

## Cambios

| Archivo | Antes | Después | Separación realizada |
| --- | ---: | ---: | --- |
| `front/src/pages/admin/AdminPage.tsx` | 1169 líneas | 825 líneas | Carga y cancelación de peticiones, moderación de reseñas y edición de taxonomías pasan a tres hooks de la funcionalidad. |
| `front/src/pages/library/CollectionPage.tsx` | 710 | 450 | Resumen, participantes y acciones para compartir tienen archivos propios. |
| `front/src/components/ItineraryBuilder.tsx` | 1033 | 476 | Borrador y guardado, trayectos, formato, actividades y campos del día se separan dentro de `features/itinerary`. |
| `backend/src/services/recommendationService.js` | 178 | 62 | El servicio obtiene datos; `domain/recommendations.js` calcula puntuaciones y explicaciones con nombres explícitos. |
| `backend/src/services/collectionService.js` | 622 | 440 | Validación en `domain/collectionPayload.js`; transformación de respuestas en `domain/collectionResponses.js`. |

También se ha movido `slugify` a una utilidad compartida, se han retirado dos memorizaciones que devolvían la misma lista, un parámetro sin uso y una notificación editorial duplicada. La carga de reseñas y taxonomías comprueba ahora si su petición fue cancelada antes de actualizar el estado.

## Archivos retirados

540 archivos versionados, unos 265 MiB:

- 524 capturas e informes generados en `front/output/playwright`.
- 3 capturas generadas en `artifacts`.
- 8 archivos de prototipos antiguos en `front/public/mockups`, sin enlaces desde la aplicación.
- 3 recursos públicos sin referencias: `favicon.svg` y variantes PNG negra y blanca del logo. Se conservan los SVG usados por la web y el PNG del icono activo.
- 2 componentes sin consumidores: `FormattedContent.tsx` y `GoliMascot.tsx`. Se conservan las ilustraciones originales en `Logo`.

Se conserva el informe de enriquecimiento de municipios y la captura no versionada que existía al comenzar. No se han retirado migraciones, datos originales ni licencias. Las nuevas salidas generadas y las sesiones de navegador están ignoradas por Git.

## Última pasada y comprobaciones

- Separación de las respuestas públicas, privadas y de listado de viajes; se conservan sus campos y los filtros de publicación de las consultas.
- La adaptación de actividades compartidas y traducciones de imprescindibles utiliza funciones con nombre en lugar de una expresión anidada.
- Los editores de administración declaran el tipo correspondiente a cada recurso. Abrir un destino solo requiere su identificador, sin convertir objetos incompletos en destinos completos.
- `npm run check`: 148 pruebas de backend y 39 de frontend, detección de archivos sin referencias, ESLint y compilación TypeScript/Vite.
- Las nuevas pruebas comprueban privacidad de las respuestas de viajes, roles, notas privadas, agendas antiguas y adaptación de actividades compartidas sin modificar los registros originales.
- Comparación anterior de 160 combinaciones de recomendaciones: mismas puntuaciones, motivos y orden.
- Playwright con Chromium, API y PostgreSQL temporales: consulta la [revisión de navegador](./REVISION_NAVEGADOR.md) para los recorridos, resultados y límites.
- Se han eliminado las capturas, registros y scripts temporales de esas comprobaciones. Se conservan las pruebas de regresión ejecutadas por el proyecto y los scripts de mantenimiento documentados.
- Comprobación de sintaxis de los 144 archivos JavaScript versionados del servidor, herramientas y pruebas; sin errores. El inventario no contiene archivos vacíos ni fuentes idénticas.
- La detección de referencias también encuentra ciclos de módulos sin consumidores externos; TypeScript rechaza variables, importaciones y parámetros locales sin uso.

## Criterio de mantenimiento

El tamaño por sí solo no obliga a dividir un archivo. Las extracciones realizadas separan responsabilidades reconocibles y conservan contratos y comportamiento. Los estilos mantienen su orden de importación y cascada. Para localizar una tarea concreta, sigue los recorridos de la guía antes de crear nuevas capas o componentes compartidos.
