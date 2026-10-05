import { intlLocale, t } from '../../../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BedDouble,
  Building2,
  Bus,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Landmark,
  Plane,
  Star,
  Sun,
  TrainFront,
  Trees,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { BudgetEstimator } from '../../../components/BudgetEstimator';
import { MediaImage } from '../../../components/ui';
import type { Destino } from '../../../types';
import { imageUrl, openStreetMapUrl, validCoordinates } from '../../../utils';
import {
  ESTIMATE_NIGHTS,
  ESTIMATE_TRAVELERS,
  badgeLabels,
  baseBadges,
  baseInsight,
  modeLabels,
  profileLabels,
  recommendedBaseId,
  type BaseInsight,
  type BaseMode,
  type BaseProfile,
} from '../baseInsights';

interface DestinationPlanningSectionProps {
  destination: Destino;
  selectedMunicipioId?: string;
  onSelectMunicipio: (municipioId: string) => void;
}

const euro = new Intl.NumberFormat(intlLocale, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const modeIcons: Record<BaseMode, LucideIcon> = {
  train: TrainFront,
  bus: Bus,
  car: Car,
  plane: Plane,
};

const profileIcons: Record<BaseProfile, LucideIcon> = {
  coast: Waves,
  nature: Trees,
  heritage: Landmark,
  food: Utensils,
  urban: Building2,
  relax: Sun,
};

const priceText = (base: BaseInsight) =>
  base.price ? `${base.price.min}–${base.price.max} €` : t('Precio por confirmar');

function ProfileChip({ profile }: { profile: BaseProfile }) {
  const Icon = profileIcons[profile];
  return (
    <span className="base-chip" data-profile={profile}>
      <Icon aria-hidden="true" />
      {profileLabels[profile]}
    </span>
  );
}

function ModeList({ modes }: { modes: BaseMode[] }) {
  if (!modes.length) return null;
  return (
    <span className="base-modes">
      {modes.map((mode) => {
        const Icon = modeIcons[mode];
        return (
          <span key={mode} title={modeLabels[mode]}>
            <Icon aria-hidden="true" />
            <span className="sr-only">{modeLabels[mode]}</span>
          </span>
        );
      })}
    </span>
  );
}

export function DestinationPlanningSection({
  destination,
  selectedMunicipioId,
  onSelectMunicipio,
}: DestinationPlanningSectionProps) {
  const municipios = destination.municipios;
  const heroRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ start: true, end: true });

  const bases = useMemo(
    () =>
      (municipios || [])
        .map(baseInsight)
        .sort(
          (a, b) =>
            (a.price ? a.price.min + a.price.max : Infinity) -
            (b.price ? b.price.min + b.price.max : Infinity),
        ),
    [municipios],
  );
  const recommendedId = recommendedBaseId(destination);
  const badges = useMemo(() => baseBadges(bases, recommendedId), [bases, recommendedId]);

  const updateEdges = () => {
    const strip = stripRef.current;
    if (!strip) return;
    setScrollEdges({
      start: strip.scrollLeft <= 4,
      end: strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4,
    });
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [bases.length]);

  if (!bases.length) return null;

  const selected =
    bases.find((base) => base.municipio.id === selectedMunicipioId) ||
    bases.find((base) => base.municipio.id === recommendedId) ||
    bases[0];
  const isRecommended = selected.municipio.id === recommendedId;
  const coordinates = validCoordinates(selected.municipio.latitud, selected.municipio.longitud);
  const hasMoreConnections = selected.connections.length > selected.summary.length + 1;
  const estimateLabel = t('{0} noches · {1} personas', {
    0: ESTIMATE_NIGHTS,
    1: ESTIMATE_TRAVELERS,
  });

  const choose = (id: string) => {
    onSelectMunicipio(id);
    const hero = heroRef.current;
    if (hero && hero.getBoundingClientRect().top < 0) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      hero.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  const scrollStrip = (direction: 1 | -1) => {
    const strip = stripRef.current;
    if (strip) strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section id="bases" className="municipalities" aria-labelledby="bases-title">
      <div className="destination-section-heading">
        <p className="kicker">{t('Dónde hacer base')}</p>
        <h2 id="bases-title">{t('Elige dónde dormir')}</h2>
        <p>
          {bases.length > 1
            ? t('{0} bases para recorrer {1}. Compara precio, conexiones y ambiente.', {
                0: bases.length,
                1: destination.nombre.trim(),
              })
            : t('La base práctica para recorrer {0}.', { 0: destination.nombre.trim() })}
        </p>
      </div>

      <div className="planning-workbench">
        <p className="sr-only" aria-live="polite">
          {t('Base seleccionada: {0}', { 0: selected.name })}
        </p>
        <article ref={heroRef} className="base-hero" aria-labelledby="base-hero-title">
          {destination.imagen && (
            <MediaImage
              className="base-hero__image"
              src={imageUrl(destination.imagen)}
              alt=""
              sizes="100vw"
              width={1600}
              height={900}
            />
          )}
          <div className="base-hero__main">
            <p className="base-hero__kicker">
              {isRecommended ? <Star aria-hidden="true" /> : <Check aria-hidden="true" />}
              {isRecommended ? t('Base recomendada') : t('Tu base')}
            </p>
            <h3 id="base-hero-title">{selected.name}</h3>
            {!!selected.profiles.length && (
              <div className="base-chips">
                {selected.profiles.map((profile) => (
                  <ProfileChip profile={profile} key={profile} />
                ))}
              </div>
            )}
            {selected.summary && <p className="base-hero__summary">{selected.summary}</p>}
            {(hasMoreConnections || coordinates) && (
              <div className="base-hero__links">
                {hasMoreConnections && (
                  <details>
                    <summary>{t('Ver conexiones')}</summary>
                    <p>{selected.connections}</p>
                  </details>
                )}
                {coordinates && (
                  <a href={openStreetMapUrl(coordinates, 14)} target="_blank" rel="noreferrer">
                    {t('Ver en el mapa')} <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          <dl className="base-hero__stats">
            <div>
              <dt>
                <BedDouble aria-hidden="true" /> {t('Por noche')}
              </dt>
              <dd>{selected.price ? priceText(selected) : t('Sin precio publicado')}</dd>
            </div>
            <div>
              <dt>
                <Clock3 aria-hidden="true" /> {t('Cómo moverse')}
              </dt>
              <dd>
                <ModeList modes={selected.modes} />
                {selected.minutes && (
                  <span className="base-hero__minutes">≈ {selected.minutes}</span>
                )}
                {!selected.modes.length && !selected.minutes && t('Sin detalle de conexiones')}
              </dd>
            </div>
            <div className="base-hero__total">
              <dt>{t('Estimación · {0}', { 0: estimateLabel })}</dt>
              <dd>
                <strong>{euro.format(selected.tripTotal)}</strong>
                <a href="#budget-estimator-title">{t('Ajustar presupuesto')}</a>
              </dd>
            </div>
          </dl>
        </article>

        {bases.length > 1 && (
          <div className="base-strip">
            <div className="base-strip__head">
              <h3>{t('Las {0} bases, de la más económica a la más cara', { 0: bases.length })}</h3>
              <div className="base-strip__nav">
                <button
                  type="button"
                  aria-label={t('Bases anteriores')}
                  disabled={scrollEdges.start}
                  onClick={() => scrollStrip(-1)}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={t('Más bases')}
                  disabled={scrollEdges.end}
                  onClick={() => scrollStrip(1)}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </div>
            <ul className="base-strip__list" ref={stripRef} onScroll={updateEdges}>
              {bases.map((base) => {
                const active = base === selected;
                const badge = badges.get(base.municipio.id);
                const difference = base.tripTotal - selected.tripTotal;
                return (
                  <li key={base.municipio.id}>
                    <button
                      type="button"
                      className="base-card"
                      aria-pressed={active}
                      onClick={() => choose(base.municipio.id)}
                    >
                      <span className="base-card__top">
                        {badge ? (
                          <span className="base-card__badge">{badgeLabels[badge]}</span>
                        ) : base.profiles[0] ? (
                          <ProfileChip profile={base.profiles[0]} />
                        ) : (
                          <span />
                        )}
                        <span className="base-card__check" aria-hidden="true">
                          {active && <Check />}
                        </span>
                      </span>
                      <span className="base-card__name">{base.name}</span>
                      <span className="base-card__price">
                        <span>{priceText(base)}</span>
                        <span
                          className="base-card__diff"
                          data-trend={active ? 'same' : difference > 0 ? 'up' : 'down'}
                        >
                          {active
                            ? t('Tu base')
                            : `${difference > 0 ? '+' : '−'}${euro.format(Math.abs(difference))}`}
                        </span>
                      </span>
                      <ModeList modes={base.modes} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="base-strip__note">
              {t('La diferencia compara el total estimado para {0} con tu base.', {
                0: estimateLabel,
              })}
            </p>
          </div>
        )}

        <BudgetEstimator
          municipios={destination.municipios || []}
          defaultMunicipioId={selected.municipio.id}
          showMunicipioControl={false}
        />
      </div>
    </section>
  );
}
