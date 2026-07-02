import logo from '../../assets/logo.png';

export default function HeroBackground() {
  return (
    <>
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-overlay dark:mix-blend-normal"
        style={{
          backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <img
        src={logo}
        alt=""
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(60vw,500px)] opacity-[0.03] pointer-events-none select-none grayscale"
      />
    </>
  );
}
