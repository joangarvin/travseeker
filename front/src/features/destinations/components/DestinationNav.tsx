import { useEffect, useRef, useState } from 'react';
import { t } from '../../../i18n';
import { plain } from '../../../utils';
import type { Destino } from '../../../types';

export function DestinationNav({ destination }: { destination: Destino }) {
  const [active, setActive] = useState('resumen');
  const nav = useRef<HTMLElement>(null);
  const hasEssentials =
    destination.essentialGroups?.some((group) => group.items?.length) ||
    plain(destination.imprescindibles);
  const sections = [
    ['resumen', 'Resumen'],
    ['cuando-ir', 'Cuándo ir'],
    ...(hasEssentials ? [['imprescindibles', 'Imprescindibles']] : []),
    ...(destination.municipios?.length ? [['bases', 'Bases']] : []),
    ...(destination.places?.length ? [['alrededor', 'Alrededor']] : []),
    ['opiniones', 'Opiniones'],
    ['alternativas', 'Alternativas'],
  ];
  const sectionIds = sections.map(([id]) => id).join(',');
  useEffect(() => {
    const elements = sectionIds
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((element) => element !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      const edge = (nav.current?.getBoundingClientRect().bottom || 130) + 32;
      const current = elements
        .filter((element) => element.getBoundingClientRect().top <= edge)
        .at(-1);
      setActive(current?.id || 'resumen');
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    elements.forEach((element) => observer.observe(element));
    update();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [sectionIds]);
  return (
    <nav ref={nav} className="destination-nav" aria-label={t('En esta guía')}>
      <div>
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>
            {t(label)}
          </a>
        ))}
      </div>
    </nav>
  );
}
