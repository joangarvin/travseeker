# Revisión funcional y de navegador

Realizada el 16 de octubre de 2026 con Playwright y Chromium. Esta revisión amplía la anterior: combina datos públicos reales con pruebas de escritura sobre una API Express y PostgreSQL temporales, sin interceptar sus respuestas correctas.

## Problemas encontrados y corregidos

| Problema reproducido | Corrección | Verificación |
| --- | --- | --- |
| Una guía de municipio no disponible carecía de título principal y conservaba un título de pestaña genérico. | Estado de error con `h1`, metadatos y acciones traducidas. | Comprobado con una guía realmente no disponible, en español e inglés. |
| Si fallaba la carga inicial de un viaje, no había botón para reintentarlo. | Acción «Reintentar», cancelación de cargas anteriores y descarte de datos obsoletos al fallar. | Interrupción de red inducida; al recuperar la conexión, el botón carga el viaje desde la API real. |
| Al cerrar «Compartir», el foco terminaba en el documento en lugar de volver al botón que abrió el diálogo. | El gestor común recuerda el elemento de apertura aunque el diálogo haga autofocus antes de que lo detecte el observador. | Tab, Mayús+Tab y Escape en compartir y editar viaje; el foco permanece dentro y vuelve al botón de apertura. |
| El botón de búsqueda móvil mostraba texto blanco sobre azul claro en modo oscuro: contraste de 2,72:1. | Uso de los colores existentes para superficies de marca sólidas. | Colores calculados en el navegador: contraste de 6,35:1 en los dos temas. |
| Consultar `/auth/me` consumía el contador compartido de intentos de acceso. Las recargas intensivas podían provocar un 429 que la interfaz interpretaba como pérdida de sesión. | La lectura de sesión no consume ese contador; los intentos de acceso y cambios de cuenta mantienen el límite. | 100 consultas reales de sesión correctas; los accesos incorrectos siguen bloqueándose y la sesión existente continúa siendo válida. Tres pruebas de regresión adicionales. |

## Qué se ha probado con los datos públicos reales

El servidor local existente respondía con 77 destinos. Se recorrieron 13 rutas a 1440, 390 y 320 píxeles: **39 casos de carga y disposición**.

Incluyen inicio, destino, comparador con selección, mapa, favoritos, viajes, administración sin acceso, entrada, recuperación de contraseña, información del proyecto, privacidad, ruta inexistente y una guía no disponible.

- No se detectaron excepciones de JavaScript ni desbordamiento horizontal del documento en esos 39 casos.
- Los carruseles pueden contener elementos fuera del área visible; se distingue ese desplazamiento interno del desbordamiento de toda la página.
- Se comprobaron las secciones que aparecen al desplazarse en inicio y destino, tanto en escritorio como en móvil. No quedaron secciones pendientes de aparecer.
- La búsqueda de «Asturias» devolvió cuatro resultados reales mediante el formulario.
- Se probaron modo oscuro, menú móvil, Tab, Escape, devolución del foco y cambio a inglés conservando tema y disposición.
- Los 401 de un visitante sin sesión y el 404 de la guía no disponible se registraron como respuestas esperadas. La prueba intensiva detectó el problema del contador de sesión descrito arriba.

## Qué se ha probado con API y PostgreSQL temporales

Se creó una instancia PostgreSQL independiente en el puerto 55487, con el esquema real del proyecto, cinco usuarios ficticios, 43 destinos y un viaje con tres días. La API de prueba se ejecutó en 3187 y la interfaz en 5187. Los guardados llegaron a Express, Prisma y PostgreSQL.

Las **17 comprobaciones de integración de API** cubren:

1. Protección de viajes y administración frente a visitantes sin sesión.
2. Lectura, modificación y eliminación denegadas a un usuario ajeno.
3. Permisos de lectura sin edición, publicación de enlace ni eliminación.
4. Permisos de edición sin compartir, invitar ni eliminar.
5. Administración denegada a usuarios sin rol de administrador.
6. Viajeros y fechas inválidos rechazados sin persistir cambios.
7. Rechazo de destinos ajenos al guardar la agenda.
8. Rechazo de órdenes parciales o duplicados.
9. Favoritos: creación, idempotencia, lectura y eliminación.
10. Colaboradores: invitación, cambio de rol y retirada efectiva de acceso.
11. Enlaces: publicación, regeneración, invalidación del anterior y revocación.
12. Creación, modificación y eliminación de viajes.
13. Paginación de los 43 destinos sin duplicados ni pérdidas.
14. Actividades: creación pendiente, publicación, visibilidad pública y eliminación.
15. Actualización de nombres de actividades en los destinos vinculados.
16. Aparición pública de una reseña después de moderarla.
17. Respuesta y orden de recomendaciones sobre el catálogo publicado.

Los recorridos de interfaz adicionales comprueban:

- Acceso con contraseña incorrecta y posterior acceso correcto usando cookies reales.
- Guardado de notas y movimiento de una actividad del primer al segundo día. Ambas operaciones persisten después de recargar.
- Cancelar una salida conserva el borrador; aceptar descartarlo y volver muestra las notas guardadas previamente.
- Lector, editor y usuario ajeno ven los controles correspondientes en móvil y no acceden a administración.
- La segunda página del catálogo muestra los tres destinos restantes; buscar vuelve a la primera página.
- Un nombre de actividad duplicado devuelve 409 y conserva el formulario. Una actividad válida se guarda como pendiente y permanece después de recargar.
- Un tipo de viaje creado desde su formulario también persiste después de recargar.
- Los catálogos de actividades y tipos de viaje no desbordan el documento a 320 píxeles.

## Evidencias

Las capturas y resultados estructurados se conservan en `front/output/playwright/revision-ampliada/`, excluido de Git por ser salida generada.

- [Matriz de páginas públicas](front/output/playwright/revision-ampliada/public-matrix.json)
- [Integración con la API real](front/output/playwright/revision-ampliada/api-integration.json)
- [Persistencia del itinerario](front/output/playwright/revision-ampliada/itinerary-persistence.json)
- [Recuperación tras fallo de red](front/output/playwright/revision-ampliada/network-retry.json)
- [Permisos en la interfaz móvil](front/output/playwright/revision-ampliada/role-ui.json)
- [Foco de los diálogos](front/output/playwright/revision-ampliada/keyboard-focus.json)
- [Contraste calculado](front/output/playwright/revision-ampliada/contrast.json)
- [Lectura de sesión y límite de acceso](front/output/playwright/revision-ampliada/session-rate-limit.json)

Capturas representativas:

- [Viaje persistido](front/output/playwright/revision-ampliada/owner-persistencia.png)
- [Error de carga con reintento](front/output/playwright/revision-ampliada/viaje-error-despues.png)
- [Administración a 320 píxeles](front/output/playwright/revision-ampliada/admin-activity-real-320.png)
- [Contraste corregido en modo oscuro](front/output/playwright/revision-ampliada/search-contrast-dark-390.png)

## Comprobación del código y límites

`npm run check` pasa con **144 pruebas de backend y 39 de frontend**, detección de archivos sin referencias, ESLint y compilación TypeScript/Vite. Las comprobaciones de navegador y API descritas arriba son adicionales a esas 183 pruebas. También pasa `git diff --check`.

Se verificaron los recorridos descritos en Chromium; no se certifica cobertura de Safari, Firefox, todas las combinaciones de datos o todos los requisitos de accesibilidad. La revisión no incluye entregabilidad de correo, pagos, carga masiva ni disponibilidad de proveedores externos. Los mapas externos quedaron desactivados por las preferencias de privacidad del navegador de pruebas.

No se editaron usuarios, viajes ni catálogos de la base habitual. Las escrituras de prueba se realizaron en PostgreSQL temporal. Los servidores habituales de los puertos 3001 y 5173 no se reiniciaron.

El backend habitual mantiene su proceso anterior: la corrección del contador de sesión se cargará cuando se reinicie. La API temporal sí se reinició y se volvió a comprobar con el código corregido.
