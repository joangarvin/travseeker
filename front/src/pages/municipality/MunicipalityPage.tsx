import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Camera,
  ChevronDown,
  Compass,
  MapPin,
  Navigation,
  Plus,
  Utensils,
} from 'lucide-react';
import { Shell, PageMeta } from '../../components/layout';
import { Button, Dialog, Loader, Notice, MediaImage } from '../../components/ui';
import { useAuth } from '../../contexts';
import { ExternalMapGate } from '../../features/privacy/CookieConsent';
import { DestinationTripDialog } from '../../features/destinations/components/DestinationTripDialog';
import { api } from '../../services/api';
import { displayBaseName } from '../../features/destinations/baseInsights';
import { imageUrl, validCoordinates } from '../../utils';
import type {
  Municipio,
  MunicipalityCatalog,
  MunicipalityRecord,
  Destino,
  CollectionSummary,
  EssentialItem,
} from '../../types';

const sections = [
  { kind: 'actividades', title: 'Qué hacer', Icon: Compass },
  { kind: 'hoteles', title: 'Dónde dormir', Icon: BedDouble },
  { kind: 'restaurantes', title: 'Dónde comer', Icon: Utensils },
] as const;

export default function MunicipalityPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [municipality, setMunicipality] = useState<Municipio | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [detail, setDetail] = useState<{
    record: MunicipalityRecord;
    kind: MunicipalityCatalog;
  } | null>(null);
  const [tripChoice, setTripChoice] = useState<{
    plannedItem?: EssentialItem;
    destinationId: string;
  } | null>(null);
  const [tripDestination, setTripDestination] = useState<Destino | null>(null);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [destinationConfirmed, setDestinationConfirmed] = useState(false);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState('');
  const [success, setSuccess] = useState<{ message: string; url?: string } | null>(null);
  const descriptionId = useId();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setMunicipality(null);
    setExpanded(false);
    api<Municipio>(`/municipios/${id}`, { signal: controller.signal })
      .then(setMunicipality)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'No se pudo cargar el municipio');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, retry]);
  useEffect(() => {
    if (!municipality || !window.location.hash.startsWith('#ficha-')) return;
    let recordId: string;
    try {
      recordId = decodeURIComponent(window.location.hash.slice(7));
    } catch {
      return;
    }
    for (const { kind } of sections) {
      const record = municipality[kind]?.find((item) => item.id === recordId);
      if (record) {
        setDetail({ record, kind });
        break;
      }
    }
  }, [municipality]);
  const loadTrip = useCallback(
    async (destinationId: string) => {
      if (!token) return;
      setTripLoading(true);
      setTripError('');
      setTripDestination(null);
      try {
        const [destination, trips] = await Promise.all([
          api<Destino>(`/destinos/${destinationId}`),
          api<CollectionSummary[]>('/colecciones', {}, token),
        ]);
        setTripDestination(destination);
        setCollections(trips);
      } catch (cause) {
        setTripError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus viajes');
      } finally {
        setTripLoading(false);
      }
    },
    [token],
  );
  const startTrip = (record?: MunicipalityRecord) => {
    const destinationId = municipality?.destinos?.[0]?.id;
    if (!destinationId || !token) return;
    const plannedItem = record
      ? { id: record.id, title: record.nombre, description: record.descripcion, sortOrder: 0 }
      : undefined;
    setDestinationConfirmed(municipality!.destinos!.length === 1);
    setDetail(null);
    setTripChoice({ plannedItem, destinationId });
    void loadTrip(destinationId);
  };
  if (loading)
    return (
      <Shell>
        <Loader label="Preparando la guía del municipio" />
      </Shell>
    );
  if (error || !municipality)
    return (
      <Shell>
        <section className="municipality-page municipality-page--empty">
          <Notice
            tone="error"
            action={<Button onClick={() => setRetry((value) => value + 1)}>Reintentar</Button>}
          >
            {error || 'Municipio no encontrado'}
          </Notice>
          <Link to="/">Volver a descubrir</Link>
        </section>
      </Shell>
    );
  const municipalityName = displayBaseName(municipality);
  const description = municipality.descripcion?.trim() || '';
  const introduction = description.match(/^.+?[.!?](?=\s|$)/)?.[0] || description.slice(0, 300);
  const coordinates = validCoordinates(municipality.latitud, municipality.longitud);
  const mapSource = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({ bbox: [coordinates.longitude - 0.025, coordinates.latitude - 0.015, coordinates.longitude + 0.025, coordinates.latitude + 0.015].join(','), layer: 'mapnik', marker: `${coordinates.latitude},${coordinates.longitude}` })}`
    : null;
  const coverImage = municipality.imagen || municipality.destinos?.[0]?.imagen;
  const coverAlt = municipality.imagen
    ? municipality.imagenAlt || municipalityName
    : `Imagen del destino: ${municipality.destinos?.[0]?.nombre}`;
  return (
    <Shell>
      <PageMeta
        title={`${municipalityName} — TravSeeker`}
        description={
          introduction || `Guía de ${municipalityName}: actividades, alojamientos y restaurantes.`
        }
      />
      <article className="municipality-page">
        <header
          className={`municipality-cover ${coverImage ? '' : 'municipality-cover--no-photo'}`}
        >
          {coverImage && (
            <div className="municipality-cover__photo">
              <MediaImage
                src={imageUrl(coverImage)}
                alt={coverAlt}
                sizes="100vw"
                fetchPriority="high"
              />
              <button type="button" onClick={() => setPhotoOpen(true)}>
                <Camera />
                Ver foto completa
              </button>
            </div>
          )}
          <div className="municipality-cover__content">
            <div>
              <nav className="municipality-breadcrumb" aria-label="Ruta">
                <Link to="/">Descubrir</Link>
                {municipality.destinos?.[0] && (
                  <>
                    <span>/</span>
                    <Link to={`/destino/${municipality.destinos[0].id}#bases`}>
                      {municipality.destinos[0].nombre}
                    </Link>
                  </>
                )}
                <span>/</span>
                <span>Municipio</span>
              </nav>
              {!municipality.imagen && coverImage && (
                <p className="municipality-photo-credit">{coverAlt}</p>
              )}
              <p className="eyebrow">TU GUÍA LOCAL</p>
              <h1>{municipalityName}</h1>
              {municipality.ubicacion && (
                <p className="municipality-cover__location">
                  <MapPin />
                  {municipality.ubicacion}
                </p>
              )}
              {municipality.tipoTurismo && (
                <span className="municipality-cover__tag">{municipality.tipoTurismo}</span>
              )}
            </div>
            <aside className="municipality-cover__planning">
              <h2>Tu próxima parada</h2>
              <div>
                {sections.map(({ kind, title, Icon }) => (
                  <a key={kind} href={`#${kind}`}>
                    <Icon />
                    <span>{title}</span>
                    <strong>{municipality[kind]?.length || 0}</strong>
                    <ArrowRight />
                  </a>
                ))}
              </div>
              {municipality.destinos?.length ? (
                token ? (
                  <Button onClick={() => startTrip()}>
                    <Plus />
                    Usar como base de mi viaje
                  </Button>
                ) : (
                  <Link className="button button--primary" to="/auth">
                    Entra para añadirlo a tu viaje
                  </Link>
                )
              ) : (
                <p>Próximamente disponible para planificar viajes.</p>
              )}
            </aside>
          </div>
        </header>
        <nav className="municipality-section-nav" aria-label="Secciones del municipio">
          <a href="#sobre">Sobre el municipio</a>
          {sections.map(({ kind, title }) => (
            <a key={kind} href={`#${kind}`}>
              {title}
            </a>
          ))}
          <a href="#ubicacion">Cómo llegar</a>
        </nav>
        <div className="municipality-page__body">
          {success && (
            <Notice
              tone="success"
              action={
                success.url ? <Link to={success.url}>Ver el día del viaje →</Link> : undefined
              }
            >
              {success.message}
            </Notice>
          )}
          <section id="sobre" className="municipality-intro">
            <div>
              <p className="eyebrow">CONOCE EL LUGAR</p>
              <h2>Sobre {municipalityName}</h2>
              <p id={descriptionId} className="municipality-description">
                {description
                  ? expanded
                    ? description
                    : introduction
                  : 'La descripción de este municipio todavía no está disponible.'}
              </p>
              {description && introduction !== description && (
                <button
                  className="municipality-text-action"
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={descriptionId}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? 'Leer menos' : 'Leer la descripción completa'}
                  <ChevronDown />
                </button>
              )}
            </div>
            <dl className="municipality-facts">
              {[
                ['Precios orientativos', municipality.precios],
                ['Conexiones', municipality.conexiones],
                ['Mejor época', municipality.mejorEpoca],
              ]
                .filter(([, value]) => !!value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              {municipality.website && (
                <div>
                  <dt>Información local</dt>
                  <dd>
                    <a href={municipality.website} target="_blank" rel="noreferrer">
                      Web oficial ↗
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
          {sections.map(({ kind, title, Icon }) => (
            <section id={kind} key={kind} className="municipality-records">
              <header>
                <div>
                  <p className="eyebrow">EXPLORA {municipality.nombre.toLocaleUpperCase()}</p>
                  <h2>
                    <Icon />
                    {title}
                  </h2>
                </div>
                <span>{municipality[kind]?.length || 0} fichas</span>
              </header>
              {municipality[kind]?.length ? (
                <div className="municipality-records__grid">
                  {municipality[kind]!.map((record) => (
                    <article
                      className="municipality-record"
                      id={`ficha-${record.id}`}
                      key={record.id}
                    >
                      {record.imagen ? (
                        <MediaImage
                          src={imageUrl(record.imagen)}
                          alt={record.imagenAlt || record.nombre}
                          loading="lazy"
                        />
                      ) : (
                        <div className="municipality-record__placeholder">
                          <Icon aria-hidden />
                          <span>Sin fotografía</span>
                        </div>
                      )}
                      <div className="municipality-record__content">
                        <p className="municipality-record__category">
                          {kind === 'actividades'
                            ? record.category
                            : kind === 'hoteles'
                              ? record.stars
                                ? `${record.stars} estrellas`
                                : 'Alojamiento'
                              : record.cuisine || 'Restaurante'}
                        </p>
                        <h3>
                          <button type="button" onClick={() => setDetail({ record, kind })}>
                            {record.nombre}
                            <ArrowRight />
                          </button>
                        </h3>
                        {record.descripcion && (
                          <p className="municipality-record__excerpt">{record.descripcion}</p>
                        )}
                        <div className="municipality-record__facts">
                          {record.price && <span>{record.price}</span>}
                          {record.duration && <span>{record.duration}</span>}
                          {record.address && (
                            <span>
                              <MapPin />
                              {record.address}
                            </span>
                          )}
                        </div>
                        <div className="municipality-record__actions">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDetail({ record, kind })}
                          >
                            Ver ficha
                          </Button>
                          {kind === 'actividades' && token && !!municipality.destinos?.length && (
                            <Button type="button" variant="quiet" onClick={() => startTrip(record)}>
                              <Plus />
                              Añadir al viaje
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="municipality-section-empty">
                  <Icon />
                  <h3>Estamos preparando esta selección</h3>
                  <p>
                    Aún no hay{' '}
                    {kind === 'actividades' ? 'actividades publicadas' : `${kind} publicados`} para
                    este municipio.
                  </p>
                </div>
              )}
            </section>
          ))}
          <section id="ubicacion" className="municipality-location">
            <div>
              <p className="eyebrow">UBÍCATE</p>
              <h2>Cómo llegar</h2>
              <p>{municipality.ubicacion || municipalityName}</p>
              {municipality.conexiones && <p>{municipality.conexiones}</p>}
              {coordinates && (
                <a
                  className="button button--primary"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`}
                >
                  <Navigation />
                  Calcular cómo llegar
                </a>
              )}
              {municipality.consejos && (
                <>
                  <h3>Antes de ir</h3>
                  <p className="municipality-description">{municipality.consejos}</p>
                </>
              )}
            </div>
            <div className="municipality-location__map">
              {mapSource ? (
                <ExternalMapGate>
                  <iframe
                    src={mapSource}
                    title={`Mapa de ${municipalityName}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </ExternalMapGate>
              ) : (
                <p>La ubicación en el mapa todavía no está disponible.</p>
              )}
            </div>
          </section>
          {!!municipality.destinos?.length && (
            <section className="municipality-parent">
              <h2>Continúa explorando</h2>
              {municipality.destinos.map((destination) => (
                <Link key={destination.id} to={`/destino/${destination.id}#bases`}>
                  {destination.nombre}
                  <ArrowRight />
                </Link>
              ))}
            </section>
          )}
        </div>
      </article>
      {photoOpen && coverImage && (
        <Dialog
          className="municipality-photo-dialog"
          title={
            municipality.imagen
              ? `Fotografía de ${municipalityName}`
              : `Fotografía de ${municipality.destinos?.[0]?.nombre || 'referencia'}`
          }
          onClose={() => setPhotoOpen(false)}
        >
          <img src={imageUrl(coverImage)} alt={coverAlt} />
        </Dialog>
      )}
      {detail && (
        <Dialog title={detail.record.nombre} onClose={() => setDetail(null)}>
          <div className="municipality-detail">
            {detail.record.imagen && (
              <img
                src={imageUrl(detail.record.imagen)}
                alt={detail.record.imagenAlt || detail.record.nombre}
              />
            )}
            <p>{detail.record.descripcion || 'Descripción pendiente.'}</p>
            <dl>
              {[
                ['Dirección', detail.record.address],
                ['Precio orientativo', detail.record.price],
                ['Teléfono', detail.record.phone],
                ['Duración', detail.record.duration],
                ['Mejor momento', detail.record.bestTime],
                ['Servicios', detail.record.amenities],
                ['Horario', detail.record.openingHours],
                ['Cocina', detail.record.cuisine],
                ['Estrellas', detail.record.stars],
              ]
                .filter(([, value]) => !!value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            <div className="municipality-record__actions">
              {detail.record.website && (
                <a
                  className="button button--secondary"
                  href={detail.record.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Web oficial ↗
                </a>
              )}
              {detail.record.bookingUrl && (
                <a
                  className="button button--primary"
                  href={detail.record.bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Consultar reserva ↗
                </a>
              )}
              {validCoordinates(detail.record.latitud, detail.record.longitud) && (
                <a
                  className="button button--secondary"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${detail.record.latitud},${detail.record.longitud}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cómo llegar ↗
                </a>
              )}
              {detail.kind === 'actividades' && token && !!municipality.destinos?.length && (
                <Button onClick={() => startTrip(detail.record)}>
                  <Plus />
                  Añadir al viaje
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
      {tripChoice &&
        token &&
        (tripLoading || tripError || !tripDestination ? (
          <Dialog title="Preparando tu viaje" onClose={() => setTripChoice(null)}>
            {tripLoading ? (
              <Loader />
            ) : (
              <Notice
                tone="error"
                action={
                  <Button onClick={() => void loadTrip(tripChoice.destinationId)}>
                    Reintentar
                  </Button>
                }
              >
                {tripError}
              </Notice>
            )}
          </Dialog>
        ) : (
          <>
            {!destinationConfirmed && (
              <Dialog title="Elige el destino del viaje" onClose={() => setTripChoice(null)}>
                <select
                  aria-label="Destino"
                  value={tripChoice.destinationId}
                  onChange={(event) => {
                    setTripChoice({ ...tripChoice, destinationId: event.target.value });
                    void loadTrip(event.target.value);
                  }}
                >
                  {municipality.destinos!.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.nombre}
                    </option>
                  ))}
                </select>
                <Button onClick={() => setDestinationConfirmed(true)}>Continuar</Button>
              </Dialog>
            )}
            {destinationConfirmed && (
              <DestinationTripDialog
                destination={tripDestination}
                defaultMunicipioId={municipality.id}
                plannedItem={tripChoice.plannedItem}
                plannedActivityValue={tripChoice.plannedItem?.id}
                collections={collections}
                collectionsLoading={false}
                collectionsError=""
                token={token}
                onRetryCollections={() => void loadTrip(tripChoice.destinationId)}
                onClose={() => setTripChoice(null)}
                onAdded={(message, url) => {
                  setSuccess({ message, url });
                  setTripChoice(null);
                }}
              />
            )}
          </>
        ))}
    </Shell>
  );
}
