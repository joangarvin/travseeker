import type { EssentialGroup, EssentialItem } from '../../types';

export function essentialGroupKey(group: EssentialGroup, index: number) {
  return group.id || `essential-group-${index}`;
}

const LEAD_BREAK = /,\s|\s\(|:\s|;\s|\s[—–]\s|\s(?:y|e|and)\s/g;

function splitLead(title: string) {
  for (const match of title.matchAll(LEAD_BREAK)) {
    const index = match.index ?? 0;
    if (index < 18) continue;
    if (index > 80) break;
    return { lead: title.slice(0, index), rest: title.slice(index) };
  }
  return { lead: title, rest: '' };
}

export function hasEssentialDetails(item: EssentialItem) {
  return Boolean(
    item.description ||
    item.imageUrl ||
    item.duration ||
    item.bestTime ||
    item.reservationRequired != null ||
    item.place ||
    item.officialUrl,
  );
}

function sublineFrom(rest: string) {
  const opener = rest.match(/^[\s,;:—–(]+/)?.[0] ?? '';
  const text = rest.slice(opener.length).replace(/\)\s*$/, '').trim();
  return /[,(:;]/.test(opener) ? text.charAt(0).toLocaleUpperCase('es') + text.slice(1) : text;
}

export function essentialPresentation(item: EssentialItem) {
  const title = item.title.trim().replace(/\s*\.$/, '');
  const { lead, rest } = splitLead(title);
  return {
    title,
    lead,
    rest,
    subline: sublineFrom(rest),
    description: item.description?.trim() || null,
  };
}
