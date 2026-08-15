export function imageUrl(value?: string | null) {
  if (!value) return '';
  if (/^https?:\/\//.test(value) || value.startsWith('data:')) return value;

  return value.startsWith('/') ? value : `/${value}`;
}

export function responsiveImageUrl(value: string, width: number) {
  if (!value.includes('res.cloudinary.com') || !value.includes('/upload/')) return value;
  const marker = '/upload/';
  const index = value.indexOf(marker) + marker.length;
  return `${value.slice(0, index)}f_auto,q_auto,c_limit,w_${width}/${value.slice(index)}`;
}
