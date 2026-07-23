import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, MapPin, Bookmark, GitCompare } from 'lucide-react';
import { getImageUrl, getHeroSrcSet } from '../../utils/images';
import ThemeToggle from '../ui/ThemeToggle';
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
    if (navigator.share) {
      await navigator.share({ title: nombre, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
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
    <div className="relative min-h-[72vh] sm:min-h-[78vh] md:min-h-[85vh] w-full overflow-hidden flex flex-col justify-end">
      <img
        src={getImageUrl(imagen, 0, 'hero')}
        srcSet={getHeroSrcSet(imagen)}
        sizes="100vw"
        alt={nombre}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setHeroLoaded(true)}
        decoding="async"
        fetchPriority="high"
      />
      {/* Viñeta editorial: oscuro abajo, limpio arriba */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-secondary)] via-[var(--color-secondary)]/55 to-[var(--color-secondary)]/15" />
      <div className="absolute inset-0 grain pointer-events-none opacity-60" />

      {/* Barra superior */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-5 md:p-8 flex justify-between items-center z-20 safe-top">
        <Link
          to="/"
          className="flex items-center gap-2 ink-chip px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Al cuaderno</span>
        </Link>
        <div className="flex gap-1.5 items-center">
          <div className="hidden sm:block [&_button]:border-white/20 [&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:border-white/40">
            <ThemeToggle />
          </div>
          <button
            onClick={handleShare}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg ink-chip flex items-center justify-center transition-colors touch-target"
            aria-label="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCompare}
            disabled={!inCompare && !canAdd}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center transition-colors touch-target disabled:opacity-40 ${
              inCompare ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)]' : 'ink-chip'
            }`}
            aria-label={inCompare ? 'Quitar de comparación' : 'Añadir a comparación'}
          >
            <GitCompare className="w-4 h-4" />
          </button>
          <button
            onClick={handleCollection}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg ink-chip flex items-center justify-center transition-colors touch-target"
            aria-label="Guardar en colección"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={handleFavorite}
            disabled={toggling}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center transition-colors touch-target disabled:opacity-60 ${
              saved ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)]' : 'ink-chip'
            }`}
            aria-label={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Portada de ficha */}
      <div className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 pb-8 sm:pb-12 md:pb-14 pt-28 max-w-7xl w-full mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10">
          <div className="min-w-0 max-w-3xl">
            <p className="field-label text-white/55 mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{ubicacion}</span>
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-white tracking-tight leading-[1.02] mb-5">
              {nombre}
            </h1>
            {/* Datos en mono, la voz del cuaderno */}
            <p className="field-label text-white/70 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{presupuesto}</span>
              <span aria-hidden className="text-white/35">·</span>
              <span>{masificacion}</span>
              <span aria-hidden className="text-white/35">·</span>
              <span>{tipoTurismo}</span>
            </p>
          </div>

          {/* Sello de ficha */}
          <div
            aria-hidden
            className="hidden md:flex shrink-0 w-24 h-24 rounded-full border-2 border-[var(--color-teja)] text-[var(--color-teja)] items-center justify-center text-center rotate-[-10deg] self-start lg:self-end bg-black/20"
          >
            <span className="field-label leading-tight" style={{ fontSize: '0.58rem' }}>
              Ficha
              <br />
              revisada
              <br />
              a mano
            </span>
          </div>
        </div>
      </div>

      {collectionOpen && (
        <AddToCollectionModal destinoId={destinoId} destinoNombre={nombre} onClose={() => setCollectionOpen(false)} />
      )}
    </div>
  );
}
