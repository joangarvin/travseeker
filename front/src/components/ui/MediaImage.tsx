import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { IMAGE_WIDTHS, responsiveImageUrl } from '../../utils/media';

const FALLBACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#e7eaf1"/><g fill="none" stroke="#c6cad4" stroke-width="2"><path d="M0 120h800M0 300h800M0 480h800M160 0v600M400 0v600M640 0v600"/><path d="M-20 510C170 450 170 140 395 235s250-40 440-155" stroke="#3047f2" stroke-width="8"/></g><circle cx="395" cy="235" r="18" fill="#ffd51f" stroke="#111217" stroke-width="8"/></svg>';

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(FALLBACK_SVG)}`;

export function MediaImage({
  className = '',
  alt = '',
  src,
  ...imageProps
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const resolvedSrc = status === 'error' ? FALLBACK_IMAGE : src || FALLBACK_IMAGE;
  const canTransform =
    resolvedSrc !== FALLBACK_IMAGE && responsiveImageUrl(resolvedSrc, 640) !== resolvedSrc;
  const srcSet = !canTransform
    ? undefined
    : IMAGE_WIDTHS.map(
        (width) => `${responsiveImageUrl(String(resolvedSrc), width)} ${width}w`,
      ).join(', ');

  useEffect(() => {
    setStatus('loading');
  }, [src]);

  return (
    <img
      {...imageProps}
      src={canTransform ? responsiveImageUrl(resolvedSrc, 640) : resolvedSrc}
      srcSet={status === 'error' ? undefined : imageProps.srcSet || srcSet}
      sizes={imageProps.sizes || '(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw'}
      width={imageProps.width || 800}
      height={imageProps.height || 600}
      decoding={imageProps.decoding || 'async'}
      loading={imageProps.loading || (imageProps.fetchPriority === 'high' ? 'eager' : 'lazy')}
      alt={alt}
      className={`media-image media-image--${status} ${className}`.trim()}
      onLoad={(event) => {
        setStatus((current) => current === 'error' ? 'error' : 'loaded');
        imageProps.onLoad?.(event);
      }}
      onError={(event) => {
        // Replace the fallback src before clearing candidates, so the browser
        // cannot start another Cloudinary request while React updates state.
        event.currentTarget.src = FALLBACK_IMAGE;
        event.currentTarget.removeAttribute('srcset');
        setStatus('error');
        imageProps.onError?.(event);
      }}
    />
  );
}
