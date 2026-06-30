import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, MapPin, Bookmark, GitCompare } from 'lucide-react';
import { getImageUrl } from '../../utils/images';
import ThemeToggle from '../ui/ThemeToggle';
import AddToCollectionModal from '../collections/AddToCollectionModal';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';

interface Props {
  destinoId: string;
  nombre: string;
  imagen: string;
  ubicacion: string;
}

export default function DestinationHero({ destinoId, nombre, imagen, ubicacion }: Props) {
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
    <div className="relative h-[65vh] md:h-[75vh] w-full overflow-hidden">
      <img
        src={getImageUrl(imagen)}
        alt={nombre}
        className={`w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setHeroLoaded(true)}
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c0a] via-[#080c0a]/50 to-transparent opacity-90" />

      <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-center z-10">
        <Link
          to="/"
          className="flex items-center gap-2 glass-dark text-white/90 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full glass-dark flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCompare}
            disabled={!inCompare && !canAdd}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
              inCompare ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)]' : 'glass-dark text-white/90 hover:bg-white/10'
            }`}
            aria-label={inCompare ? 'Quitar de comparación' : 'Añadir a comparación'}
          >
            <GitCompare className="w-4 h-4" />
          </button>
          <button
            onClick={handleCollection}
            className="w-10 h-10 rounded-full glass-dark flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Guardar en colección"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={handleFavorite}
            disabled={toggling}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-60 ${
              saved ? 'bg-[var(--color-brand)] text-[#0a0f0d]' : 'glass-dark text-white/90 hover:bg-white/10'
            }`}
            aria-label={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-4 tracking-wide uppercase">
            <MapPin className="w-3.5 h-3.5" />
            {ubicacion}
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-medium text-white tracking-tight leading-[1.05]">
            {nombre}
          </h1>
        </div>
      </div>

      {collectionOpen && (
        <AddToCollectionModal destinoId={destinoId} destinoNombre={nombre} onClose={() => setCollectionOpen(false)} />
      )}
    </div>
  );
}
