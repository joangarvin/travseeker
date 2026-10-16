# Cómo leer y modificar TravSeeker

Empieza por la parte que quieras cambiar. La interfaz está en `front`, la API en `backend` y la configuración que comparten en `shared`.

## Recorrido recomendado

1. Lee `front/src/main.tsx`: inicia React, carga los estilos y monta la aplicación.
2. Abre `front/src/app/App.tsx` y `AppProviders.tsx`: muestran las piezas comunes y los estados compartidos.
3. Busca la URL en `front/src/app/AppRoutes.tsx`. Allí verás qué archivo de `pages` abre cada pantalla.
4. En esa página, sigue los componentes y hooks de `features`. Los componentes muestran contenido; los hooks coordinan estado y acciones.
5. Si necesitas seguir una petición, abre `front/src/services/api.ts` y busca su ruta en `backend/src/routes`.
6. Sigue el controlador hasta el servicio. Las reglas que no necesitan base de datos están en `backend/src/domain`; las consultas usan Prisma.

No hace falta leer todas las carpetas en orden para entender una funcionalidad.

## Dónde buscar cada cosa

| Quiero cambiar… | Empiezo en… |
| --- | --- |
| Una URL o la pantalla que abre | `front/src/app/AppRoutes.tsx` |
| Cabecera, pie o marco común | `front/src/components/layout` |
| Botones, campos, imágenes o diálogos compartidos | `front/src/components/ui` |
| Inicio y búsqueda | `front/src/pages/home/HomePage.tsx` y `front/src/features/search` |
| Una ficha de destino | `front/src/pages/destination/DestinationPage.tsx` y `front/src/features/destinations` |
| Una guía de municipio | `front/src/pages/municipality/MunicipalityPage.tsx` |
| Mis viajes o un viaje compartido | `front/src/pages/library` y `front/src/features/collections` |
| La agenda día a día | `front/src/components/ItineraryBuilder.tsx` y `front/src/features/itinerary` |
| La administración | `front/src/pages/admin/AdminPage.tsx` y `front/src/features/admin` |
| Sesión y permisos de interfaz | `front/src/contexts/AuthContext.tsx` |
| Idiomas y textos en inglés | `front/src/i18n` y `MULTILINGUAL.md` |
| Colores y medidas compartidas | `front/src/styles/tokens.css` |
| Orden en que se aplican los estilos | `front/src/styles/index.css` |
| Una respuesta de la API | `backend/src/routes` → `controllers` → `services` |
| Una regla de validación o cálculo | `backend/src/domain` |
| Tablas y relaciones | `backend/prisma/schema.prisma` |
| Importaciones, migraciones o tareas manuales | `backend/scripts` y los comandos de `backend/package.json` |

## Administración: qué hace cada archivo extraído

`AdminPage.tsx` compone los paneles, la navegación y los editores. Sus responsabilidades auxiliares están separadas:

- `features/admin/hooks/useAdminData.ts`: carga listas, paginación, contadores y lugares; cancela peticiones al cambiar de sección.
- `features/admin/hooks/useAdminReviews.ts`: modera reseñas individuales o por lotes y restaura el estado si falla una petición.
- `features/admin/hooks/useAdminTaxonomies.ts`: crea, edita y elimina actividades y tipos de viaje; mantiene sus nombres en los destinos cargados.
- `features/admin/components`: contiene los paneles y formularios que dibujan la interfaz.

Los nombres españoles de campos de la API, como `tipoTurismoPrincipal`, se conservan para que puedas seguirlos desde la interfaz hasta la base de datos.

## Viajes e itinerarios

`CollectionPage.tsx` coordina el viaje, las vistas y el guardado. El resumen está en `TripOverview.tsx`, los participantes en `ParticipantAvatars.tsx` y las acciones de compartir y gestionar miembros en `useCollectionSharing.ts`.

`ItineraryBuilder.tsx` compone la agenda. Dentro de `features/itinerary`:

| Archivo | Responsabilidad |
| --- | --- |
| `hooks/useItineraryEditor.ts` | Borrador, selección del día, orden, nueva propuesta, mejora de ruta, deshacer, aviso de cambios pendientes y guardado. |
| `hooks/useItineraryRoutes.ts` | Cálculo de trayectos y totales de distancia y tiempo. |
| `itineraryModel.ts` | Generación de días, numeración y ajuste de fechas. |
| `itineraryPresentation.ts` | Textos de fechas, duración y nombres de actividades. |
| `components/DayActivities.tsx` | Añadir, quitar o mover actividades. |
| `components/ItineraryDayEditor.tsx` | Editar destino, municipio base, notas y actividades del catálogo. |
| `components/SegmentBar.tsx` | Mostrar el trayecto entre dos días. |

Los algoritmos de proximidad y optimización siguen en `front/src/utils/itineraryPlanner.ts`. El cliente de rutas está en `front/src/services/routingService.ts`.

En la API, `collectionService.js` coordina acceso y persistencia. `domain/collectionPayload.js` valida fechas, viajeros y cambios de paradas. `domain/collectionResponses.js` define las respuestas de listado, detalle privado y enlace público. Los permisos, el orden y la agenda tienen sus propios módulos de dominio.

## Recomendaciones

`backend/src/services/recommendationService.js` obtiene favoritos, viajes, preferencias y candidatos publicados. `backend/src/domain/recommendations.js` calcula el orden, la puntuación y el motivo de cada recomendación. Para ajustar el ranking, empieza por este último y sus pruebas.

## Qué se conserva y por qué

- Los scripts de migración e importación tienen usos manuales aunque no los importe la aplicación. No son código muerto por ese motivo.
- `Logo` conserva los originales de marca. La web carga los recursos publicados en `front/public/brand`.
- Las licencias de las fuentes deben acompañar a las fuentes.
- Los estilos pueden depender del tema, la pantalla, la impresión o clases creadas en ejecución. La falta de una coincidencia literal no demuestra que sobren.
- `front/output/municipality-enrichment-report.json` se conserva como informe de procedencia de datos. Las nuevas salidas de `output` están ignoradas por Git.

Se retiraron componentes sin referencias, prototipos públicos antiguos, recursos públicos sin referencias y capturas e informes de pruebas generados. Los cambios locales no versionados que había al comenzar se conservaron.

## Comprobar un cambio

Desde la raíz:

```sh
npm run check
```

Ejecuta la detección de archivos sin referencias, las pruebas de ambas partes, la revisión de código del frontend y su compilación. `npm run check:unused` ejecuta solo la detección de archivos sin referencias. TypeScript también avisa de variables, importaciones y parámetros locales sin uso.

La detección sigue importaciones estáticas y dinámicas con rutas literales, `require` y los imports de CSS. Considera las pruebas, herramientas y configuración como puntos de entrada. No demuestra que todos los exports, selectores CSS o recursos de datos se utilicen. Si introduces carga de módulos mediante rutas calculadas, adapta esta comprobación para reconocerla.

Al añadir una función, colócala junto a la funcionalidad que la usa. Pásala a una carpeta compartida cuando tenga consumidores reales en otras partes. Un comentario debe explicar una regla o una decisión; el nombre de la función debe explicar qué hace.
