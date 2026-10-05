import { t } from '../../../i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Plus } from 'lucide-react';
import type { EssentialGroup, EssentialItem } from '../../../types';
import { imageUrl, plain, safeHtml } from '../../../utils';
import { MediaImage } from '../../../components/ui';
import {
  essentialGroupKey,
  essentialPresentation,
  hasEssentialDetails,
} from '../../essentials/essentialPresentation';
import { EssentialIconGlyph, essentialCategory } from '../../essentials/essentialIcons';
import { EssentialDetail } from './EssentialDetail';

type EssentialRouteProps = {
  groups?: EssentialGroup[];
  legacyHtml?: string;
  coverImage?: string | null;
  coverAlt?: string;
  authenticated?: boolean;
  loginState?: { returnTo: string };
  onAddToTrip?: (item: EssentialItem) => void;
  filter?: string;
  onFilterChange?: (key: string) => void;
};

type Category = ReturnType<typeof essentialCategory>;
type Entry = { key: string; item: EssentialItem; groupKey: string; category: Category };

export const ALL_ESSENTIALS = 'all';
const ALL = ALL_ESSENTIALS;
const PREVIEW_SIZE = 6;

export function EssentialRoute({
  groups = [],
  legacyHtml = '',
  coverImage,
  coverAlt = '',
  authenticated = false,
  loginState,
  onAddToTrip,
  filter: controlledFilter,
  onFilterChange,
}: EssentialRouteProps) {
  const [ownFilter, setOwnFilter] = useState(ALL);
  const [showAll, setShowAll] = useState(false);
  const [expandedKey, setExpandedKey] = useState('');
  const filter = controlledFilter ?? ownFilter;

  const populatedGroups = groups
    .map((group, index) => ({
      group,
      key: essentialGroupKey(group, index),
      category: essentialCategory(group.title, group.icon),
    }))
    .filter(({ group }) => group.items?.length);
  const entries: Entry[] = populatedGroups.flatMap(({ group, key: groupKey, category }) =>
    group.items.map((item, index) => ({
      key: item.id || `${groupKey}-${index}`,
      item,
      groupKey,
      category,
    })),
  );

  if (!entries.length && !plain(legacyHtml)) return null;

  const activeFilter = populatedGroups.some(({ key }) => key === filter) ? filter : ALL;
  const filtered =
    activeFilter === ALL ? entries : entries.filter((entry) => entry.groupKey === activeFilter);
  const visible = showAll ? filtered : filtered.slice(0, PREVIEW_SIZE);
  const labelIsUnique = (label: string) =>
    populatedGroups.filter(({ category }) => category.label === label).length === 1;
  const filters = [
    { key: ALL, title: t('Todo'), count: entries.length },
    ...populatedGroups.map(({ group, key, category }) => ({
      key,
      title: labelIsUnique(category.label) ? category.label : group.title,
      count: group.items.length,
    })),
  ];

  const selectFilter = (key: string) => {
    (onFilterChange ?? setOwnFilter)(key);
    setShowAll(false);
    setExpandedKey('');
  };

  return (
    <section className="essential-discovery" aria-labelledby="essential-discovery-title">
      <header className="essential-discovery__intro">
        <p className="kicker">{t('Selección sobre el terreno')}</p>
        <h2 id="essential-discovery-title">{t('Lo imprescindible')}</h2>
        <p className="essential-discovery__lede">
          {populatedGroups.length > 1
            ? t('{0} experiencias en {1} temas, en el orden en que las recomendamos.', {
                0: entries.length,
                1: populatedGroups.length,
              })
            : t('Una selección editorial de lo que merece tu tiempo.')}
        </p>
      </header>

      {entries.length ? (
        <>
          {populatedGroups.length > 1 && (
            <div
              className="essential-filters"
              role="group"
              aria-label={t('Filtrar por tipo de experiencia')}
            >
              {filters.map(({ key, title, count }) => (
                <button
                  type="button"
                  aria-pressed={key === activeFilter}
                  onClick={() => selectFilter(key)}
                  key={key}
                >
                  {title} <span>{count}</span>
                </button>
              ))}
            </div>
          )}

          <ol className="essential-grid">
            {visible.map(({ key, item, category }, index) => {
              const presentation = essentialPresentation(item);
              const featured = index === 0;
              const media = item.imageUrl || (featured ? coverImage : null);
              const detailed = hasEssentialDetails(
                media === item.imageUrl ? { ...item, imageUrl: null } : item,
              );
              const expanded = expandedKey === key;
              const titleId = `essential-title-${key}`;
              const detailId = `essential-detail-${key}`;
              const addLabel = t('Añadir {0} al viaje', { 0: presentation.title });
              return (
                <li
                  className={`essential-card${featured ? ' essential-card--featured' : ''}${media ? ' has-media' : ''}`}
                  data-tone={category.tone}
                  key={key}
                >
                  {media && (
                    <>
                      <MediaImage
                        className="essential-card__cover"
                        src={imageUrl(media)}
                        alt={item.imageUrl ? item.imageAlt || '' : coverAlt}
                        sizes={
                          featured
                            ? '(max-width: 1100px) 100vw, 66vw'
                            : '(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw'
                        }
                        width={1280}
                        height={860}
                      />
                      <span className="essential-card__shade" aria-hidden="true" />
                    </>
                  )}
                  <span className="essential-card__number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {authenticated && onAddToTrip ? (
                    <button
                      type="button"
                      className="essential-card__add"
                      aria-label={addLabel}
                      title={t('Añadir al viaje')}
                      onClick={() => onAddToTrip(item)}
                    >
                      <Plus aria-hidden />
                    </button>
                  ) : (
                    <Link
                      className="essential-card__add"
                      to="/auth"
                      state={loginState}
                      aria-label={addLabel}
                      title={t('Entra para añadirla a un viaje')}
                    >
                      <Plus aria-hidden />
                    </Link>
                  )}
                  <div className="essential-card__body">
                    <p className="essential-card__category">
                      <EssentialIconGlyph name={category.icon} />
                      {category.label}
                    </p>
                    <h3 className="essential-card__title" id={titleId}>
                      <strong>{presentation.lead}</strong>
                      {featured && presentation.subline ? (
                        <span className="essential-card__subline"> {presentation.subline}</span>
                      ) : (
                        presentation.rest
                      )}
                    </h3>
                    {expanded && (
                      <EssentialDetail
                        item={item}
                        id={detailId}
                        showMedia={media !== item.imageUrl}
                      />
                    )}
                    {detailed && (
                      <button
                        type="button"
                        className="essential-card__toggle"
                        aria-expanded={expanded}
                        aria-controls={expanded ? detailId : undefined}
                        aria-describedby={titleId}
                        onClick={() => setExpandedKey(expanded ? '' : key)}
                      >
                        {expanded ? t('Menos detalles') : t('Detalles')}
                        <ChevronDown aria-hidden />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {filtered.length > PREVIEW_SIZE && (
            <button
              type="button"
              className="essential-discovery__more"
              aria-expanded={showAll}
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? t('Ver menos') : t('Ver las {0} experiencias', { 0: filtered.length })}
              <ChevronDown aria-hidden />
            </button>
          )}
        </>
      ) : (
        <div className="essential-discovery__legacy">
          <div className="prose" dangerouslySetInnerHTML={{ __html: safeHtml(legacyHtml) }} />
        </div>
      )}
    </section>
  );
}
