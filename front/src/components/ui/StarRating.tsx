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
    <div className={`star-rating ${className}`} role={readOnly ? 'img' : 'radiogroup'} aria-label={`Valoración ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(active);
        const StarEl = (
          <Star
            style={{ width: size, height: size, color: filled ? 'var(--color-mostaza)' : undefined }}
            className={`star-rating__star ${filled ? 'is-filled' : ''}`}
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
            className="star-rating__button"
            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
          >
            {StarEl}
          </button>
        );
      })}
    </div>
  );
}
