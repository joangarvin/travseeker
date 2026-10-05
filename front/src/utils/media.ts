export function imageUrl(value?: string | null) {
  if (!value) return '';
  if (/^https?:\/\//.test(value) || value.startsWith('data:')) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

// A small shared set prevents one new Cloudinary transformation per layout size.
export const IMAGE_WIDTHS = [96, 320, 640, 960, 1600] as const;
export function responsiveImageUrl(value: string, width: number) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (url.hostname !== 'res.cloudinary.com' || !url.pathname.includes('/image/upload/'))
    return value;
  const marker = '/image/upload/';
  const index = url.pathname.indexOf(marker) + marker.length;
  const remainder = url.pathname.slice(index);
  // Signed URLs cannot be rewritten without a new signature.
  if (remainder.startsWith('s--')) return value;
  const target = IMAGE_WIDTHS.find((candidate) => candidate >= width) || 1600;
  const existing = /^f_auto,q_auto,c_limit,w_\d+\//;
  url.pathname = `${url.pathname.slice(0, index)}f_auto,q_auto,c_limit,w_${target}/${remainder.replace(existing, '')}`;
  return url.toString();
}
