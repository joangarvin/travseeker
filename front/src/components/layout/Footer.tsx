import { Mail, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-brand-deep)] text-[var(--color-on-deep)] mt-8 border-t border-white/5 pb-24 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12">
          <div>
            <img src={logo} alt="Travseeker" className="h-10 w-auto mb-4 brightness-0 invert opacity-90" />
            <p className="text-[var(--color-on-deep)]/75 text-sm leading-relaxed max-w-xs">
              Una guía hecha a mano de la España que no sale en los carruseles. Datos honestos,
              cero patrocinios.
            </p>
          </div>

          <div>
            <h4 className="field-label text-[var(--color-mostaza)] mb-4">Explorar</h4>
            <nav className="flex flex-col gap-3 text-sm text-[var(--color-on-deep)]/85">
              <Link to="/" className="hover:text-[var(--color-on-deep)] transition-colors">Inicio</Link>
              <a href="/#destinos" className="hover:text-[var(--color-on-deep)] transition-colors">La selección</a>
              <Link to="/mapa" className="hover:text-[var(--color-on-deep)] transition-colors">El mapa</Link>
              <Link to="/sobre-nosotros" className="hover:text-[var(--color-on-deep)] transition-colors">Quiénes somos</Link>
            </nav>
          </div>

          <div>
            <h4 className="field-label text-[var(--color-mostaza)] mb-4">Contacto</h4>
            <div className="flex flex-col gap-3 text-sm text-[var(--color-on-deep)]/85">
              <a href="mailto:hola@travseeker.com" className="flex items-center gap-2 hover:text-[var(--color-on-deep)] transition-colors">
                <Mail className="w-4 h-4" />
                hola@travseeker.com
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-[var(--color-on-deep)] transition-colors">
                <AtSign className="w-4 h-4" />
                @travseeker
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-white/15 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--color-on-deep)]/65 text-center md:text-left">
          <span>© {new Date().getFullYear()} Travseeker. Todos los derechos reservados.</span>
          <span className="flex items-center gap-3">
            <span className="font-serif italic text-base text-[var(--color-on-deep)]">
              Los buenos sitios, contados bajito.
            </span>
            <span
              aria-hidden
              className="hidden sm:inline-flex w-9 h-9 rounded-full border border-[var(--color-teja)] text-[var(--color-teja)] items-center justify-center rotate-[-10deg] font-mono text-[9px] tracking-wider select-none"
            >
              TS
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
