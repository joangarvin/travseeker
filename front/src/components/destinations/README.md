# destinations

Componentes para mostrar destinos turísticos en listados y páginas de detalle.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `DestinationCard.tsx` | Tarjeta de destino con imagen, ubicación, presupuesto y masificación. Enlaza a `/destino/:id`. Memoizado. |
| `DestinationHero.tsx` | Hero a pantalla completa del detalle: imagen, título, botones de compartir y favorito (conectado a `AuthContext`). |
| `FeaturedDestinations.tsx` | Grid de destinos con título, subtítulo y estado de carga (skeleton). Usado en la home. |
| `QuickFactsBar.tsx` | Barra de datos rápidos: presupuesto, masificación y tipo de turismo. |
| `MasificationChart.tsx` | Gráfico de barras de afluencia turística por trimestre del año. |
| `MunicipioCard.tsx` | Tarjeta de un municipio con precios y conexiones de transporte. |
| `RelatedDestinations.tsx` | Sección de destinos relacionados al final del detalle. Usa `useRelatedDestinos`. |
