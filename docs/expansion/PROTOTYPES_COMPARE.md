# Comparador internacional: prototipos

Estado: exploración; pendiente de elección del usuario. Rama `new/expansion`.

## Abrir

Con el frontend en el puerto 5177:

- http://localhost:5177/mockups/comparador-internacional.html?v=1 — Cara a cara.
- http://localhost:5177/mockups/comparador-internacional.html?v=2 — Criterios.
- http://localhost:5177/mockups/comparador-internacional.html?v=3 — Duelo.

El selector inferior cambia la propuesta. Atajos: 1–3, flechas izquierda/derecha, R para repetir el movimiento. Los atajos se desactivan en formularios y diálogos. «Vista móvil» limita la superficie a 390 px; el mismo CSS responde al ancho real de pantalla. Tema claro y oscuro disponibles sin modificar las preferencias de la aplicación.

## Tres direcciones

1. **Cara a cara** conserva el modelo de tarjetas fotográficas del comparador actual. Un criterio principal y detalles prácticos desplegables. En móvil se apilan. Ventaja: continuidad con el producto. Coste: desplazamiento vertical al comparar cuatro opciones.
2. **Criterios** organiza las diferencias en bloques desplegables, con destinos alineados en escritorio y valores identificados por nombre en móvil. Incluye «Solo diferencias». Ventaja: examinar un criterio sin recordar toda la ficha. Coste: más aperturas de bloques.
3. **Duelo** compara dos opciones y un criterio cada vez. Selectores permiten rotar los demás candidatos; elegir al oponente intercambia ambos lados. Ventaja: reduce la carga de lectura en teléfono. Coste: comparar cuatro requiere varias parejas.

Los países no encabezan la experiencia. País, moneda e idiomas aparecen como datos prácticos de los destinos. Ninguna propuesta sustituye una ficha de destino ni integra cambios en el comparador de producción.

## Interacciones incluidas

- Añadir, quitar, buscar por nombre/país, vaciar y deshacer; máximo cuatro destinos.
- Prioridad, época y tipos de planes; indicadores y explicación se recalculan.
- Marcar/desmarcar una opción y conservarla al cambiar de diseño o pareja.
- Estado vacío, una sola opción y datos pendientes. Los datos pendientes no cuentan como cero.
- URL con destinos, época, criterio, planes, pareja, elección y escenario; copiar enlace con alternativa manual si el portapapeles falla.
- Vista de ficha del ejemplo mediante diálogo; Costa del Garraf permite abrir la ficha actual.
- Feedback textual mediante región de estado, foco visible y restauración tras actualizaciones, Escape/cierre de diálogos nativos.
- Transiciones breves para elección, medidor, diálogo y feedback; `prefers-reduced-motion` las desactiva. El cambio de propuesta no usa una transición entre vistas.

No se escriben datos en la BD ni en almacenamiento del comparador real. La selección de demostración vive en la URL. No necesita backend. Los archivos de fuentes/tokens son una copia de referencia aislada del sistema actual; al integrar se reutilizarán los originales.

## Datos y fotografías

Las descripciones, actividades, niveles de gasto y afluencia son contenido de demostración. Los valores de afluencia son ficticios, no una fuente turística. Los niveles de presupuesto no permiten una clasificación de precios entre países; no hay cambios de moneda inventados ni conversión. La conversión queda para el futuro prototipo de presupuesto.

Las imágenes se sirven desde su origen, sin descargarlas ni republicarlas. Se recortan en presentación mediante `object-fit`; la atribución está disponible dentro del prototipo:

- Costa del Garraf: imagen existente del catálogo TravSeeker, enlazada a su ficha; no se atribuye una autoría desconocida.
- Lisboa: Vitor Oliveira, [archivo de Commons](<https://commons.wikimedia.org/wiki/File:Lisboa_-_Portugal_(52597836992).jpg>), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).
- Essaouira: Uploadmo, [archivo de Commons](https://commons.wikimedia.org/wiki/File:Essaouira_beach.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Niza: Alexander Migl, [archivo de Commons](https://commons.wikimedia.org/wiki/File:Promenade_des_Anglais_Nice_IMG_1255.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Si una imagen falla, se muestra el nombre del destino en su espacio. Las fuentes locales del proyecto se conservan; no se añaden proveedores de fuentes.

## Validación

- `node --test front/public/mockups/comparador-internacional/verify.mjs`: 12 pruebas de normalización, parejas, retirada de elección, ausencia de datos, épocas, presupuesto, coincidencias, búsqueda y render de las tres variantes en todas las combinaciones de criterio/época/escenario.
- Sintaxis de módulos comprobada con Node; documentos y recursos locales accesibles mediante HTTP en Vite.
- `cd front && npm run build`: correcto.
- **Pendiente de revisión visual e interacción en navegador real:** la herramienta CUA falla antes de iniciar con `failed to start Node runtime: No such file or directory`. No se han validado gráficamente desbordamientos, carga remota de fotografías, foco nativo o gestos en dispositivos. El modo de 390 px es una herramienta de revisión, no una afirmación de pruebas en iPhone.

Al elegir una propuesta, integrar solo la elegida con datos reales y permisos/publicación existentes. Eliminar esta superficie de exploración tras la integración, salvo petición de conservarla.
