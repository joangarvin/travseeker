import { FALLBACK_IMAGES } from '../constants/images';

export type ImagePreset =
  | 'card'
  | 'hero'
  | 'thumb'
  | 'map'
  | 'preview'
  | 'avatar-sm'
  | 'avatar-md'
  | 'avatar-lg';

const PRESETS: Record<ImagePreset, string> = {
  card: 'f_auto,q_auto,w_480,c_fill,g_auto',
  hero: 'f_auto,q_auto,w_1600,c_fill,g_auto',
  thumb: 'f_auto,q_auto,w_160,c_fill,g_auto',
  map: 'f_auto,q_auto,w_360,c_fill,g_auto',
  preview: 'f_auto,q_auto,w_800,c_fill,g_auto',
  'avatar-sm': 'f_auto,q_auto,w_64,c_fill,g_face',
  'avatar-md': 'f_auto,q_auto,w_96,c_fill,g_face',
  'avatar-lg': 'f_auto,q_auto,w_192,c_fill,g_face',
};

const UPLOAD_SEGMENT = '/upload/';

function isLegacyBrokenUrl(url: string): boolean {
  return !url || url.includes('wix:image://');
}

function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/** Inserta transformaciones de entrega en una URL de Cloudinary. */
export function withCloudinaryTransform(url: string, transform: string): string {
  if (!isCloudinaryUrl(url)) return url;

  const idx = url.indexOf(UPLOAD_SEGMENT);
  if (idx === -1) return url;

  const before = url.slice(0, idx + UPLOAD_SEGMENT.length);
  const after = url.slice(idx + UPLOAD_SEGMENT.length);

  if (/^(f_|w_|c_|q_|g_)/.test(after)) return url;

  return `${before}${transform}/${after}`;
}

export function getImageUrl(
  sourceUrl: string,
  seed = 0,
  preset: ImagePreset = 'card',
): string {
  if (isLegacyBrokenUrl(sourceUrl)) {
    return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
  }

  if (isCloudinaryUrl(sourceUrl)) {
    return withCloudinaryTransform(sourceUrl, PRESETS[preset]);
  }

  return sourceUrl;
}

/** Srcset para imágenes hero en pantallas retina. */
export function getHeroSrcSet(url: string): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;

  const w800 = withCloudinaryTransform(url, 'f_auto,q_auto,w_800,c_fill,g_auto');
  const w1200 = withCloudinaryTransform(url, 'f_auto,q_auto,w_1200,c_fill,g_auto');
  const w1600 = withCloudinaryTransform(url, 'f_auto,q_auto,w_1600,c_fill,g_auto');

  return `${w800} 800w, ${w1200} 1200w, ${w1600} 1600w`;
}

export function getAvatarUrl(avatarUrl: string | null | undefined, size: 'sm' | 'md' | 'lg' | 'xl'): string | null {
  if (!avatarUrl) return null;

  const preset: ImagePreset =
    size === 'sm' ? 'avatar-sm' : size === 'md' ? 'avatar-md' : 'avatar-lg';

  return getImageUrl(avatarUrl, 0, preset);
}
