import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, MapPin, Bookmark, GitCompare } from 'lucide-react';
import { getImageUrl, getHeroSrcSet } from '../../utils/images';
import ThemeToggle from '../ui/ThemeToggle';
import Toast from '../ui/Toast';
import AddToCollectionModal from '../collections/AddToCollectionModal';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';

interface Props {
  destinoId: string;
  nombre: string;
  imagen: string;
  ubicacion: string;
  presupuesto: string;
  masificacion: string;
  tipoTurismo: string;
}

export default function DestinationHero({
  destinoId,
  nombre,
  imagen,
  ubicacion,
  presupuesto,
  masificacion,
  tipoTurismo,
}: Props) {
  const navigate = useNavigate();
  const { user, isFavorite, toggleFavorite } = useAuth();
  const { isInCompare, toggleCompare, canAdd } = useCompare();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const saved = isFavorite(destinoId);
  const inCompare = isInCompare(destinoId);

  const handleCollection = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setCollectionOpen(true);
  };

  const handleCompare = () => {
    if (!inCompare && !canAdd) return;
    toggleCompare({ id: destinoId, nombre });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: nombre, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setToast('Enlace copiado');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToast('Enlace copiado');
      } catch {
        setToast('No se pudo compartir');
      }
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (toggling) return;
    setToggling(true);
    try {
      await toggleFavorite(destinoId);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="dest-hero">
      <img
        src={getImageUrl(imagen, 0, 'hero')}
        srcSet={getHeroSrcSet(imagen)}
        sizes="100vw"
        alt={nombre}
        className={`dest-hero__img ${heroLoaded ? 'is-loaded' : 'is-loading'}`}
        onLoad={() => setHeroLoaded(true)}
        decoding="async"
        fetchPriority="high"
      />
      <div className="dest-hero__overlay" />
      <div className="dest-hero__grain" aria-hidden />

      <div className="dest-hero__topbar safe-top">
        <Link to="/" className="dest-hero__back ink-chip touch-target">
          <ArrowLeft className="icon-sm" />
          <span className="dest-hero__back-label">Volver</span>
        </Link>
        <div className="dest-hero__actions">
          <div className="dest-hero__theme">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="dest-hero__icon-btn ink-chip touch-target"
            aria-label="Compartir"
          >
            <Share2 className="icon-sm" />
          </button>
          <button
            type="button"
            onClick={handleCompare}
            disabled={!inCompare && !canAdd}
            className={`dest-hero__icon-btn touch-target ${inCompare ? 'is-active' : 'ink-chip'}`}
            aria-label={inCompare ? 'Quitar de comparación' : 'Añadir a comparación'}
          >
            <GitCompare className="icon-sm" />
          </button>
          <button
            type="button"
            onClick={handleCollection}
            className="dest-hero__icon-btn ink-chip touch-target"
            aria-label="Guardar en colección"
          >
            <Bookmark className="icon-sm" />
          </button>
          <button
            type="button"
            onClick={handleFavorite}
            disabled={toggling}
            className={`dest-hero__icon-btn dest-hero__icon-btn--fav touch-target ${saved ? 'is-active' : 'ink-chip'}`}
            aria-label={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart className={`icon-sm ${saved ? 'icon-heart-filled' : ''}`} />
          </button>
        </div>
      </div>

      <div className="dest-hero__content">
        <div className="dest-hero__row">
          <div className="dest-hero__main">
            <p className="dest-hero__ubicacion field-label">
              <MapPin className="dest-card__location-icon" />
              <span>{ubicacion}</span>
            </p>
            <h1 className="dest-hero__name">
              {nombre}
            </h1>
            <p className="dest-hero__facts field-label">
              <span>{presupuesto}</span>
              <span aria-hidden className="dest-hero__facts-sep">·</span>
              <span>{masificacion}</span>
              <span aria-hidden className="dest-hero__facts-sep">·</span>
              <span>{tipoTurismo}</span>
            </p>
          </div>
        </div>
      </div>

      {collectionOpen && (
        <AddToCollectionModal destinoId={destinoId} destinoNombre={nombre} onClose={() => setCollectionOpen(false)} />
      )}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}
