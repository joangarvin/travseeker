import { FALLBACK_IMAGES } from '../constants/images';

export function getImageUrl(wixUrl: string, seed = 0): string {
  if (!wixUrl || wixUrl.includes('wix:image://')) {
    return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
  }
  return wixUrl;
}
