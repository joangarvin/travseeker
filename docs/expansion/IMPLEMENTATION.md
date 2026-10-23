# Integración de Flujo: países y publicación

Rama `new/expansion`. Se integra la variante Flujo. La nueva interfaz sustituye al panel anterior. «Crear ficha» y el título o «Editar ficha» de cada tarjeta abren los editores completos sobre el flujo. «Publicación» abre los controles territoriales y de visibilidad. Revisión editorial y Reseñas se gestionan desde el mismo menú lateral; los enlaces antiguos de administración abren también esta interfaz.

## Preparación de una instalación

1. Hacer copia de seguridad de su base de datos.
2. En backend, instalar dependencias y ejecutar `npx prisma generate`.
3. Ejecutar `npm run db:migrate-country-publication` con la DATABASE_URL de esa instalación.
4. Reiniciar backend y desplegar el frontend de la misma revisión.

La migración es transaccional e idempotente. Crea España visible y Portugal, Francia y Marruecos ocultos. Asigna inicialmente los registros existentes a España y conserva su visibilidad previa. Repetirla no vuelve a publicar registros ocultados posteriormente. Aplicada al catálogo compartido el 21 de octubre de 2026 por petición del usuario, tras realizar copia de seguridad privada en backend/backups/. Se verificaron los recuentos y las API autenticadas de países, resumen, destinos, municipios y actividades. El backend local se reinició con el cliente Prisma actualizado.

## Modelo

Preparación y Mostrar son campos separados. Las fichas nuevas empiezan ocultas. Las taxonomías son globales. El país condiciona la exposición de todos sus registros. Las localidades conservan también su control histórico de acceso a la guía para no habilitar accidentalmente guías incompletas anteriores.

Los cambios de visibilidad invalidan la caché del servidor y las respuestas públicas requieren revalidación en el navegador. Las API públicas filtran también registros relacionados: localidades, lugares, actividades y alojamientos. Los anuncios Próximamente solo exponen nombres y ubicaciones mínimas, sin abrir fichas incompletas.

## Administración

`/admin` abre el panel Flujo. La selección territorial se mantiene en la sesión del navegador. Listado, búsqueda, contadores y paginación se calculan en el servidor; las modificaciones están limitadas a administradores autenticados. El tutorial incluye un ejercicio independiente sin efectos sobre los datos.

El panel de publicación modifica los estados y la asignación territorial; el contenido y las traducciones se editan en la ficha completa. La creación hereda el contexto territorial activo.

## Revisión aislada

Las pruebas de integración solo aceptan `EXPANSION_TEST_DATABASE_URL=postgresql://joan@127.0.0.1:55439/postgres`. No deben utilizar una base compartida. El script `scripts/seed-publication-review.js` tiene la misma restricción y crea únicamente registros identificados como demostración y una cuenta de revisión local.

## Acceso al catálogo real en desarrollo

El panel local de revisión en localhost:5177 se ha conectado al backend real de desarrollo (3001), igual que la aplicación de 127.0.0.1:5176. La cuenta sintética del entorno aislado no sirve para esta base: se debe iniciar sesión con una cuenta administrativa habitual. El script de datos sintéticos sigue restringido a su instancia desechable.

Los orígenes adicionales autorizados para sesiones por cookie se configuran explícitamente con FRONTEND_ORIGINS (separados por comas). CORS y la protección CSRF comparten esa lista junto a FRONTEND_URL; no se admiten orígenes arbitrarios. En desarrollo están autorizados los dos enlaces locales usados para esta revisión.


## Exploración pública por país

La home añade un mosaico después de los destinos existentes. `/pais/:code` muestra una panorámica, información básica con mapa lateral visible y catálogo paginado. Ambas superficies utilizan el ancho disponible con márgenes adaptables. No reemplazan los controles ni recomendaciones anteriores.

`GET /api/paises` devuelve países públicos con destinos visibles y anuncios mínimos. `GET /api/paises/:code` filtra por publicación del país y del destino; admite `q`, `region`, `type` y `offset`. Los países ocultos devuelven 404 y los próximos no exponen imágenes ni fichas. Se reutilizan los estados existentes sin migración adicional.

La página de país reutiliza `SearchBox` y `HomeFilterPanel` de inicio: presupuesto, afluencia, mes, ubicación, tipos de viaje y actividades. El buscador usa el mismo motor de búsqueda por contenido y tolerancia a erratas. El servicio compartido acepta un ámbito territorial interno que fija el país desde la ruta; los parámetros enviados por el cliente no pueden sustituirlo. Los filtros se guardan en la URL, distinguiendo la edición de su aplicación y permitiendo limpiar y volver a intentar. Las opciones de ubicación se obtienen del país visible. La composición móvil del buscador también se comparte sin cambiar el aspecto anterior de inicio.

El resumen territorial agrupa título, descripción, acceso al catálogo y datos prácticos a la izquierda. El mapa ocupa una columna propia y pasa debajo en móvil, con enlace para abrirlo en grande. Se ha retirado el desplegable: el iframe utiliza carga diferida y solo se monta cuando el consentimiento de mapas externos está activo; en caso contrario se muestra el control de configuración existente. Comprobado a 1440, 390 y 320 px.

El filtro compartido incluye País con Todos los países como valor general. Las opciones proceden de países publicados con al menos un destino público; no se ofrecen países próximos ni ocultos. Inicio aplica `countryCode` también a búsquedas, paginación y mapa. En una página de país el actual aparece seleccionado: al aplicar otro se cambia de página conservando las preferencias, y Todos los países vuelve al catálogo general. Limpiar dentro del país mantiene el ámbito de esa página. Las sugerencias de relajación de filtros no eliminan el país solicitado.


## Información territorial en la ficha de destino

La ficha existente incluye el nombre del país y su región si está informada, y muestra moneda e idiomas en el resumen. El detalle público selecciona únicamente nombre y código de la relación Country y reutiliza `domain/countryInfo.js`, también utilizado por la página de país. El perfil desconocido devuelve null para no presentar información de España por defecto. Se conserva la disposición y las funcionalidades anteriores de la ficha. No se ha creado una ruta de ficha internacional ni se han cambiado datos de publicación.
