# Guías municipales verificadas

Los lotes del 7 de octubre de 2026 completan 100 municipios prioritarios:
`priority` (5), `cities` (35), `coastal` (14), `islands` (14),
`north-next` (10), `villages-next` (6), `heritage-next` (8) y
`heritage-next-two` (8). En conjunto incluyen 197 actividades vinculadas
(139 reutilizadas y 58 nuevas), 102 hoteles, 102 restaurantes y 100 fotografías
con créditos. Quedan 732 municipios del inventario por completar.
Las actividades amplias que ya incluyen varias visitas se vinculan una sola vez.
Las siguientes tandas deben priorizar municipios de mayor interés turístico.

Cada municipio y ficha conserva sus fuentes oficiales en `sources` y la fecha de
revisión en `checkedAt`. Las descripciones son redacción propia; no se importan
precios, horarios, estrellas o fotografías sin verificar. Los enlaces de reserva
son los canales oficiales comprobados, sin inventar páginas de Booking.com.
Las fotografías de `2026-10-07-photos.json` y `2026-10-07-photos-next.json`
proceden de Wikimedia Commons y se
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
`catalogCorrections` documenta la corrección editorial aplicada al título de la
Antigua Universidad de Osuna: el Palacio de los Cepeda es otro edificio. Estas
correcciones se revisan y aplican por separado; el importador no cambia títulos
existentes automáticamente. Se conserva el identificador de la actividad.

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
Si Wikimedia limita temporalmente la descarga desde Cloudinary con un error 429,
el importador puede transferir el mismo archivo revisado, sin seguir redirecciones,
con un límite de 25 MB y 30 segundos. Solo admite JPEG, PNG y WebP.
