# Guías municipales verificadas

El primer lote, `2026-10-07-priority.json`, contiene Sitges, Vilanova i la Geltrú,
Barcelona, Granada y Sevilla. Incluye 9 actividades reutilizadas del catálogo,
2 actividades nuevas, 7 hoteles y 7 restaurantes. Las siguientes tandas deben
priorizar municipios de mayor interés turístico.

Cada municipio y ficha conserva sus fuentes oficiales en `sources` y la fecha de
revisión en `checkedAt`. Las descripciones son redacción propia; no se importan
precios, horarios, estrellas o fotografías sin verificar. Los enlaces de reserva
son los canales oficiales comprobados, sin inventar páginas de Booking.com.
No se han incorporado fotografías de terceros: las futuras imágenes deben
documentar autor, fuente, licencia y atribución antes de su publicación.

Desde `backend`, ejecutar:

```sh
node scripts/enrich-municipality-guides.js
node scripts/enrich-municipality-guides.js --apply
```

El modo predeterminado solo lee. `--apply` crea registros publicados y añade
asociaciones municipales que falten, dentro de una transacción por municipio.
Reutiliza imprescindibles mediante su identificador y otros registros por nombre
y dirección; conserva contenido existente y solo completa campos vacíos.
El informe se escribe en `front/output/municipality-enrichment-report.json`.
No es una importación masiva sin revisión: cada nuevo lote debe comprobar sus
fuentes antes de aplicarse. Las fichas quedan editables en Administración.
