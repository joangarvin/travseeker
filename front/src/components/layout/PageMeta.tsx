import { useEffect } from 'react';

type PageMetaProps = { title: string; description: string; canonical?: string };

function ensureMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function ensureProperty(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function PageMeta({ title, description, canonical }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    ensureMeta('description', description);
    ensureProperty('og:title', title);
    ensureProperty('og:description', description);
    const canonicalUrl = canonical ?? `${window.location.origin}${window.location.pathname}`;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;
  }, [canonical, description, title]);
  return null;
}
