import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../ui/ScrollReveal';

function TopographicMap() {
  return (
    <div className="topo-map">
      <div className="topo-map__grid" />

      <svg viewBox="0 0 560 320" className="topo-map__svg" aria-hidden>
        <defs>
          <linearGradient id="terrain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.12" />
            <stop offset="50%" stopColor="var(--color-teja)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        <path
          d="M -20,340 C 100,320 180,240 220,160 C 260,80 340,40 580,20 L 580,340 Z"
          fill="url(#terrain-grad)"
        />

        <g stroke="var(--color-primary)" strokeOpacity="0.15" strokeWidth="1.2" fill="none">
          <path d="M 40,340 C 120,300 180,260 230,200 C 280,140 330,80 480,50 C 520,40 550,45 580,60" />
          <path d="M 90,340 C 150,300 200,270 250,220 C 300,170 340,110 460,90 C 500,80 540,90 580,110" />
          <path d="M 140,340 C 190,310 230,280 270,240 C 310,200 350,150 440,130 C 480,120 520,130 560,150" />
          <path d="M 190,340 C 230,320 260,290 290,260 C 330,220 370,180 430,170 C 460,165 500,180 530,200" />
          <path d="M 310,270 C 330,250 360,220 400,210 C 430,200 450,215 470,230 C 450,250 410,260 380,265 C 340,270 320,275 310,270 Z" fill="var(--color-brand)" fillOpacity="0.05" strokeOpacity="0.25" />
        </g>

        <path
          d="M 0,100 C 120,120 180,160 210,210 C 240,260 220,290 260,340"
          fill="none"
          stroke="var(--color-mapa)"
          strokeWidth="3"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />

        <path
          d="M 60,280 C 140,260 170,180 270,170 C 340,160 380,210 420,215"
          fill="none"
          stroke="var(--color-teja)"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />

        <g transform="translate(420, 215)">
          <circle r="12" fill="var(--color-brand)" fillOpacity="0.15" className="topo-pulse" />
          <circle r="5" fill="var(--color-brand)" />
          <circle r="2" fill="var(--color-on-brand)" />
        </g>

        <g transform="translate(60, 280)">
          <circle r="4" fill="var(--color-teja)" />
        </g>

        <text x="20" y="30" fill="var(--color-muted)" fontSize="10" fontFamily="monospace" opacity="0.6">
          N 42° 30' 59" / W 0° 33' 6"
        </text>
        <text x="20" y="44" fill="var(--color-muted)" fontSize="9" fontFamily="monospace" opacity="0.4">
          ELEV. 1.842m — M. PERDIDO
        </text>
      </svg>

      <div className="topo-map__legend">
        <span className="topo-map__legend-item">
          <span className="topo-map__legend-route" /> Ruta
        </span>
        <span className="topo-map__legend-item">
          <span className="topo-map__legend-dot" /> Punto
        </span>
      </div>
    </div>
  );
}

export default function MapStrip() {
  return (
    <section className="map-strip">
      <div className="map-strip__inner">
        <div className="map-strip__copy">
          <ScrollReveal>
            <span className="map-strip__eyebrow field-label">Cartografía</span>
            <h2 className="map-strip__title">
              El mapa manda.
            </h2>
            <p className="map-strip__text">
              A veces no sabes el nombre del sitio, pero sabes la zona. Abre el mapa y deja que el relieve decida.
            </p>
            <Link to="/mapa" className="btn-cta">
              Abrir el mapa
            </Link>
          </ScrollReveal>
        </div>

        <div className="map-strip__visual">
          <ScrollReveal delay={1}>
            <div
              className="ficha-tilt map-strip__tilt"
              style={{ '--tilt': '0.8deg', boxShadow: 'var(--shadow-card)' } as CSSProperties}
            >
              <TopographicMap />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
