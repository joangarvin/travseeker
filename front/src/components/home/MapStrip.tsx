import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../ui/ScrollReveal';

function TopographicMap() {
  return (
    <div className="relative w-full aspect-[560/320] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm group">
      {/* Red de cuadrícula de coordenadas (Grid de mapa técnico) */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <svg
        viewBox="0 0 560 320"
        className="w-full h-full"
        aria-hidden
      >
        <defs>
          {/* Sombreado suave de relieve */}
          <linearGradient id="terrain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.12" />
            <stop offset="50%" stopColor="var(--color-teja)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* --- CURVAS TOPOGRÁFICAS (LÍNEAS DE NIVEL / TERRENO) --- */}
        {/* Valle / Base */}
        <path
          d="M -20,340 C 100,320 180,240 220,160 C 260,80 340,40 580,20 L 580,340 Z"
          fill="url(#terrain-grad)"
        />

        {/* Capas de elevación (Montaña) */}
        <g stroke="var(--color-primary)" strokeOpacity="0.15" strokeWidth="1.2" fill="none">
          {/* Nivel 1 - 200m */}
          <path d="M 40,340 C 120,300 180,260 230,200 C 280,140 330,80 480,50 C 520,40 550,45 580,60" />
          {/* Nivel 2 - 400m */}
          <path d="M 90,340 C 150,300 200,270 250,220 C 300,170 340,110 460,90 C 500,80 540,90 580,110" />
          {/* Nivel 3 - 600m */}
          <path d="M 140,340 C 190,310 230,280 270,240 C 310,200 350,150 440,130 C 480,120 520,130 560,150" />
          {/* Nivel 4 - 800m */}
          <path d="M 190,340 C 230,320 260,290 290,260 C 330,220 370,180 430,170 C 460,165 500,180 530,200" />
          {/* Nivel 5 - Peak 1000m (Cima) */}
          <path d="M 310,270 C 330,250 360,220 400,210 C 430,200 450,215 470,230 C 450,250 410,260 380,265 C 340,270 320,275 310,270 Z" fill="var(--color-brand)" fillOpacity="0.05" strokeOpacity="0.25" />
        </g>

        {/* --- RÍO / ACCIDENTE GEOGRÁFICO --- */}
        <path
          d="M 0,100 C 120,120 180,160 210,210 C 240,260 220,290 260,340"
          fill="none"
          stroke="var(--color-mapa)"
          strokeWidth="3"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />

        {/* --- RUTA / SENDERISMO (Línea discontinua Teja) --- */}
        <path
          d="M 60,280 C 140,260 170,180 270,170 C 340,160 380,210 420,215"
          fill="none"
          stroke="var(--color-teja)"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />

        {/* --- PUNTOS Y MARCADORES --- */}
        {/* Cima / Pico destacado */}
        <g transform="translate(420, 215)">
          <circle r="12" fill="var(--color-brand)" fillOpacity="0.15" className="animate-pulse" />
          <circle r="5" fill="var(--color-brand)" />
          <circle r="2" fill="var(--color-on-brand)" />
        </g>

        {/* Punto de origen */}
        <g transform="translate(60, 280)">
          <circle r="4" fill="var(--color-teja)" />
        </g>

        {/* Coordenadas técnicas en esquina */}
        <text x="20" y="30" fill="var(--color-muted)" fontSize="10" fontFamily="monospace" opacity="0.6">
          N 42° 30' 59" / W 0° 33' 6"
        </text>
        <text x="20" y="44" fill="var(--color-muted)" fontSize="9" fontFamily="monospace" opacity="0.4">
          ELEV. 1.842m — M. PERDIDO
        </text>
      </svg>

      {/* Leyenda visual estilo mapa topográfico */}
      <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-md bg-[var(--color-surface)]/90 border border-[var(--color-border)] backdrop-blur-sm flex items-center gap-3 text-[11px] text-[var(--color-muted)] font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[var(--color-teja)] rounded-full inline-block"></span> Ruta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] inline-block"></span> Punto
        </span>
      </div>
    </div>
  );
}

export default function MapStrip() {
  return (
    <section className="bg-[var(--color-surface-2)] border-y border-[var(--color-border)] mt-14 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <div className="lg:col-span-4">
          <ScrollReveal>
            <span className="field-label text-[var(--color-teja)] mb-3 block">Cartografía</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight mb-4">
              El mapa manda.
            </h2>
            <p className="text-[var(--color-muted)] text-base sm:text-lg leading-relaxed max-w-[26ch] mb-6">
              A veces no sabes el nombre del sitio, pero sabes la zona. Abre el mapa y deja que el relieve decida.
            </p>
            <Link
              to="/mapa"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-colors duration-150"
            >
              Abrir el mapa
            </Link>
          </ScrollReveal>
        </div>

        <div className="lg:col-span-8">
          <ScrollReveal delay={1}>
            <div
              className="ficha-tilt lg:translate-x-3"
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