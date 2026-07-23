import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export default function StarRating({ value, onChange, size = 20, readOnly = false, className = '' }: Props) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className={`flex items-center gap-0.5 ${className}`} role={readOnly ? 'img' : 'radiogroup'} aria-label={`Valoración ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(active);
        const StarEl = (
          <Star
            style={{ width: size, height: size, color: filled ? 'var(--color-mostaza)' : undefined }}
            className={filled ? 'fill-[var(--color-mostaza)]' : 'fill-transparent text-[var(--color-border-strong)]'}
          />
        );
        if (readOnly) return <span key={star}>{StarEl}</span>;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 cursor-pointer"
            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
          >
            {StarEl}
          </button>
        );
      })}
    </div>
  );
}
