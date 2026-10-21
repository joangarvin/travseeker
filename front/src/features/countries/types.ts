import type { Destino } from '../../types';
import type { Translations } from '../../i18n';
export type CountrySummary = {
  code: string;
  name: string;
  status: 'public' | 'upcoming';
  image?: string;
  destinationCount?: number;
};
export type CountryPageData = CountrySummary & {
  description?: string;
  currency?: string;
  languages?: string;
  bbox?: number[] | null;
  imageAlt?: string;
  regions?: string[];
  types?: { name: string; value: string; translations?: Translations }[];
  items?: Destino[];
  total?: number;
  hasMore?: boolean;
  offset?: number;
};
