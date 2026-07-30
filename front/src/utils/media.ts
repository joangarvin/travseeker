export function imageUrl(value?: string | null) {
  if (!value) return '';
  if (/^https?:\/\//.test(value) || value.startsWith('data:')) return value;

  return value.startsWith('/') ? value : `/${value}`;
}
