import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { t } from '../../../i18n';
import type { ClimateMonth } from '../../../types';

type Sky = 'sun' | 'cloud' | 'rain' | 'unknown';

// These are illustrative monthly scenes, not daily forecasts or measured cloud cover.
function skyForMonth(month: ClimateMonth): Sky {
  const rain = month.rainyDaysPerYear;
  const sun = month.sunshineHoursPerDay;
  const high = month.temperatureMaxC;
  if (rain != null && rain >= 10) return 'rain';
  if (rain != null && rain <= 5 && ((sun != null && sun >= 10) || (high != null && high >= 28)))
    return 'sun';
  if (rain != null || sun != null) return 'cloud';
  return 'unknown';
}

let cloudTexture: HTMLCanvasElement | undefined;

function clouds() {
  if (cloudTexture) return cloudTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const pixels = context.createImageData(canvas.width, canvas.height);
  const hash = (x: number, y: number) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const noise = (x: number, y: number) => {
    const a = Math.floor(x);
    const b = Math.floor(y);
    const smooth = (value: number) => value * value * (3 - 2 * value);
    const u = smooth(x - a);
    const v = smooth(y - b);
    return (
      (hash(a, b) * (1 - u) + hash(a + 1, b) * u) * (1 - v) +
      (hash(a, b + 1) * (1 - u) + hash(a + 1, b + 1) * u) * v
    );
  };
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let density = 0;
      let amplitude = 0.5;
      let frequency = 1;
      for (let octave = 0; octave < 5; octave++) {
        density += amplitude * noise((x / 140) * frequency, (y / 100) * frequency);
        amplitude *= 0.5;
        frequency *= 2;
      }
      const index = (y * canvas.width + x) * 4;
      pixels.data[index] = 247;
      pixels.data[index + 1] = 251;
      pixels.data[index + 2] = 255;
      pixels.data[index + 3] =
        Math.max(0, Math.min(1, (density - 0.39) * 4.8)) * Math.sin((Math.PI * y) / 256) * 230;
    }
  }
  context.putImageData(pixels, 0, 0);
  cloudTexture = canvas;
  return canvas;
}

export function ClimateSky({
  month,
  active,
  paused,
  onTogglePause,
}: {
  month: ClimateMonth;
  active: boolean;
  paused: boolean;
  onTogglePause: () => void;
}) {
  const sky = skyForMonth(month);
  const backdrop = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const element = backdrop.current;
    if (!element) return;
    element.querySelectorAll('canvas').forEach((canvas) => {
      canvas.getContext('2d')?.drawImage(clouds(), 0, 0);
    });
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => setReduced(preference.matches);
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    preference.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <>
      <div
        ref={backdrop}
        className="climate-sky"
        data-sky={sky}
        data-animate={active && !paused && visible && pageVisible && !reduced && sky !== 'unknown'}
        aria-hidden="true"
      >
        <div className="climate-sky__rain-tone" />
        <div className="climate-sky__sun" />
        <div className="climate-sky__clouds">
          <canvas width="768" height="256" />
          <canvas width="768" height="256" />
        </div>
        <div className="climate-sky__rain">
          {Array.from({ length: 36 }, (_, index) => (
            <span
              key={index}
              style={
                {
                  left: `${(index * 47.3) % 100}%`,
                  top: `${(index * 31.7) % 100}%`,
                  animationDelay: `${-(index % 9) * 0.17}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="climate-sky__scrim" />
      </div>
      {sky !== 'unknown' && (
        <button
          type="button"
          className="climate-sky__pause"
          disabled={reduced || !active}
          onClick={onTogglePause}
          aria-label={
            reduced ? t('Sin movimiento') : paused ? t('Activar animación') : t('Pausar animación')
          }
        >
          {paused || reduced ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {reduced ? t('Sin movimiento') : paused ? t('Animar') : t('Pausar')}
        </button>
      )}
    </>
  );
}
