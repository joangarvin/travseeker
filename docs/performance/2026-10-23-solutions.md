# Soluciones y comprobación de carga — 23 de octubre de 2026

## Cambios aplicados

- Países: lista y páginas pasan por la caché pública existente, con consultas canónicas, país/idioma/filtros separados y agrupación de cargas simultáneas. Las escrituras correctas de administración invalidan la caché. Las rutas públicas de país también entran en la caché del cliente y en la eliminación de diccionarios de traducción tras localizar.
- Compresión: gzip asíncrono de coste bajo para JSON de al menos 1 KiB; sin compresión para JSON pequeño, HEAD, respuestas vacías o clientes que no acepten gzip. Vary conserva origen, idioma y codificación. Un fallo de compresión devuelve el JSON original.
- Reutilización de bytes comprimidos solo para respuestas públicas 200: caché de 8 MiB, 128 entradas y 60 segundos, y agrupación de compresiones idénticas en vuelo. La clave SHA-256 corresponde al contenido serializado exacto, no a la URL: una publicación nueva no recibe bytes viejos. Las respuestas privadas no se almacenan.
- Recuperación: una lectura GET/HEAD puede reintentarse una vez tras 200–400 ms de espera aleatoria si falla el transporte. No se repiten escrituras, errores HTTP ni JSON inválido. La cancelación interrumpe la espera; las lecturas duplicadas siguen compartiendo trabajo. Un cuerpo truncado ya no se acepta como objeto vacío correcto.
- No se han aumentado las conexiones de base de datos, desactivado protecciones, añadido servicios de pago ni cambiado el esquema.

## Comparación

Mismo conjunto local de datos turísticos, pool de cinco conexiones, recorrido HTTP, pausa de 200 ms y fases de 20 s con entrada gradual de 25 ms por usuario. La caché está caliente de forma progresiva. La variabilidad de carga/JIT y la duración corta impiden tratar las diferencias como una garantía exacta en producción.

| Usuarios | p95 anterior | p95 nuevo sin reintentos | p95 con recuperación | Errores finales con recuperación | Peticiones lógicas |
|---|---:|---:|---:|---:|---:|
| 100 | 228.3 ms | 135.5 ms | 136.3 ms | 0 | 35300 |
| 200 | 614.3 ms | 289.8 ms | 287.2 ms | 0 | 56575 |

A 100 usuarios el p95 con recuperación baja aproximadamente un 40 %; a 200, un 53 %. El rendimiento de la fase de 200 pasa de unas 1.243 a 2.178 peticiones lógicas/s. Estas cifras agregan API, HTML y assets iniciales; no son usuarios soportados por el hosting real.

## No ocultar los errores de transporte

| Escenario corregido | Lecturas/peticiones lógicas | Intentos HTTP reales | Fallos de transporte | Lecturas recuperadas | Errores finales |
|---|---:|---:|---:|---:|---:|
| 100 usuarios graduales | 35300 | 35300 | 0 | 0 | 0 |
| 200 usuarios graduales | 56575 | 56596 | 21 | 21 | 0 |
| 100 usuarios de golpe | 15350 | 15541 | 191 | 191 | 0 |

Los reinicios de conexión siguen existiendo en este entorno: el reintento los recupera, no elimina su causa. La pasada sin recuperación tuvo 29 fallos en la fase de 200. No se registraron respuestas HTTP 500 ni fallos de contrato JSON. No se han cambiado parámetros globales del sistema operativo ni atribuido todos los resets a Express.

En la fase final de 200, el listado de países baja de p95 714,1 ms a 132,4 ms, y la página de país responde en p95 41,4 ms. A 100, el listado pasa de 342,8 a 92,1 ms. Las pruebas unitarias verifican además que 50 consultas idénticas simultáneas ejecutan una única carga de país.

## Validación y límites

- Backend: 156 tests pasan y uno de integración condicionado por entorno queda omitido en el comando general. El ensayo PostgreSQL dedicado se ejecuta aparte: sus 8 comprobaciones pasan, incluida la ocultación real de un país ya cacheado tras un PATCH de administración.
- Frontend: 56 tests pasan, incluyendo backoff, límite de reintentos, escrituras, errores HTTP y cancelación. Lint y build correctos.
- Gzip: pruebas HTTP reales verifican contenidos, longitudes, negociación q=0, HEAD, JSON pequeño y recuperación ante fallo del trabajador. La caché comprimida se prueba con 100 lecturas simultáneas, expiración, límites y contenido modificado.
- Los ensayos siguen aislados de Neon durante la carga, sin cuentas privadas, escrituras de visitantes ni tráfico a mapas/fotos/clima externos.
- El generador puede activar el mismo helper de reintentos que el frontend mediante LOAD_READ_RETRY=1 y cuenta por separado intentos, fallos y recuperaciones. No simula renderizado ni reutilización de la caché de aplicación del navegador.
- No se demuestra una reducción de memoria: el pico de la sesión corregida es de aproximadamente 641.3 MiB de RSS, con más tráfico y una sesión más larga. Requiere dimensionamiento y prueba prolongada en el hosting autorizado; no hay garantía de capacidad o ausencia de fugas.
- Se corrigió el contador del instrumento de prueba para descontar conexiones cerradas antes de finish; no se usa ese contador antiguo para extraer conclusiones.
- No hay una prueba gráfica nueva: los cambios aquí son de transporte, caché y servidor. No modifican el diseño del mapa.

Resultados detallados en `2026-10-23-solutions-results.json`. Instrucciones de reproducción en `backend/scripts/load/README.md`.
