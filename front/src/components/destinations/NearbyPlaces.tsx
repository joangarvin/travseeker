import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { ExternalLink, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Place } from '../../types';

export default function NearbyPlaces({ places, center }: { places: Place[]; center?: [number, number] }) {
  if (!places.length) return null;
  const mapCenter = center || [places[0].latitud, places[0].longitud] as [number, number];
  return <section id="cerca" className="nearby-places dest-detail__divider-section"><div className="dest-detail__section-head"><div><span className="field-label">Explora alrededor</span><h2 className="dest-detail__section-head-title">Lugares cerca</h2><p className="dest-detail__section-head-lead">Puntos seleccionados para completar la visita.</p></div></div><div className="nearby-places__layout"><div className="nearby-places__map"><MapContainer center={mapCenter} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{places.map((place) => <CircleMarker key={place.id} center={[place.latitud, place.longitud]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#2f7d5a', fillOpacity: 1 }}><Popup><strong>{place.nombre}</strong><br />{place.categoria}</Popup></CircleMarker>)}</MapContainer></div><div className="nearby-places__list">{places.map((place) => <article key={place.id} className="nearby-place"><MapPin className="icon-sm" /><div><span className="field-label">{place.categoria}</span><h3>{place.nombre}</h3>{place.descripcion && <p>{place.descripcion}</p>}{place.website && <a href={place.website} target="_blank" rel="noreferrer">Más información <ExternalLink className="icon-sm" /></a>}</div></article>)}</div></div></section>;
}
