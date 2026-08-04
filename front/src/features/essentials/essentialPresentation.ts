import type { EssentialItem } from '../../types';

function capitalize(value: string) {
  return value ? `${value.charAt(0).toLocaleUpperCase('es')}${value.slice(1)}` : value;
}

export function essentialPresentation(item: EssentialItem) {
  const title = item.title.trim();
  if (item.description || title.length <= 90) {
    return { title, description: item.description || null };
  }

  const candidates = [
    { pattern: /,\s+/, keepSeparator: false },
    { pattern: /;\s+/, keepSeparator: false },
    { pattern: /\s+y\s+/, keepSeparator: false },
    { pattern: /\s+para\s+/, keepSeparator: true },
  ]
    .map(({ pattern, keepSeparator }) => {
      const match = pattern.exec(title);
      return match && match.index >= 32 && match.index <= 90
        ? { index: match.index, length: match[0].length, keepSeparator }
        : null;
    })
    .filter(Boolean)
    .sort((first, second) => first!.index - second!.index);
  const split = candidates[0];
  if (!split) return { title, description: null };

  const compactTitle = title
    .slice(0, split.index)
    .replace(/[,:;\s]+$/, '')
    .trim();
  const remainder = title.slice(split.index + (split.keepSeparator ? 1 : split.length)).trim();
  return {
    title: compactTitle,
    description: capitalize(remainder),
  };
}
