# Guías municipales verificadas

Los lotes del 7 de octubre de 2026 completan 68 municipios prioritarios:
`priority` (5), `cities` (35), `coastal` (14) e `islands` (14). En conjunto incluyen
90 actividades reutilizadas, 43 nuevas, 70 hoteles y 70 restaurantes.
Las actividades amplias que ya incluyen varias visitas se vinculan una sola vez.
Las siguientes tandas deben priorizar municipios de mayor interés turístico.

Cada municipio y ficha conserva sus fuentes oficiales en `sources` y la fecha de
revisión en `checkedAt`. Las descripciones son redacción propia; no se importan
precios, horarios, estrellas o fotografías sin verificar. Los enlaces de reserva
son los canales oficiales comprobados, sin inventar páginas de Booking.com.
Las fotografías de `2026-10-07-photos.json` proceden de Wikimedia Commons y se
han comprobado individualmente: lugar representado, autor y licencia. Se alojan
en Cloudinary y su fuente, título, autor, licencia y adaptación se conservan en
`Municipio.imageAttribution` y se muestran en la ficha y el visor de fotos.
Las licencias de las fotografías son las indicadas en cada registro; no se
relicencian como código del proyecto. No se copian fotos de hoteles o restaurantes
sin permiso ni se utilizan fotografías genéricas como si fueran del negocio.

Desde `backend`, ejecutar:

```sh
node scripts/enrich-municipality-guides.js
node scripts/enrich-municipality-guides.js --apply
node scripts/enrich-municipality-guides.js data/municipality-guides/2026-10-07-cities.json --apply
```

El modo predeterminado solo lee. `--apply` crea registros publicados y añade
asociaciones municipales que falten, dentro de una transacción por municipio.
Reutiliza imprescindibles mediante su identificador y otros registros por nombre
y dirección; conserva contenido existente y solo completa campos vacíos.
El informe se escribe en `front/output/municipality-enrichment-report.json`.
No es una importación masiva sin revisión: cada nuevo lote debe comprobar sus
fuentes antes de aplicarse. Las fichas quedan editables en Administración.

Para instalar el campo de créditos en una base históricamente gestionada con
`db:push`, ejecutar `npm run db:migrate-municipality-image-attribution` y
`npx prisma generate`, sin volver a aplicar otras migraciones históricas.

`upload-reviewed-municipality-photos.js` recibe un plan JSON revisado con
`photos: [{ id, nombre, originalUrl, uploadUrl, sha1, imagenAlt,
imageAttribution }]`. Solo acepta servidores de Wikimedia y licencias libres
permitidas cuya URL coincide con el tipo y versión. El dominio público exige
comprobar la declaración del autor y marcar `publicDomainVerified: true`.
En modo predeterminado no sube archivos. Con `--apply` guarda después de cada
subida un lote aplicable por el importador; sus identificadores estables permiten
reanudar sin duplicar archivos. Conserva las fotos municipales existentes.
El SHA-1 documenta el identificador del original en Commons; no representa una
comprobación de integridad de la versión reducida enviada a Cloudinary.
