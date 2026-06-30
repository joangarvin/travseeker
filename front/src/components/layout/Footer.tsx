import { Mail, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-[#080c0a] text-white mt-8 border-t border-[var(--color-brand)]/10">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <img src={logo} alt="Travseeker" className="h-10 w-auto mb-4" />
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Curamos destinos únicos en España para viajeros que buscan experiencias auténticas, lejos del turismo masivo.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-4">Explorar</h4>
            <nav className="flex flex-col gap-3 text-sm text-white/60">
              <Link to="/" className="hover:text-[var(--color-brand)] transition-colors">Inicio</Link>
              <a href="/#destinos" className="hover:text-[var(--color-brand)] transition-colors">Destinos destacados</a>
              <Link to="/sobre-nosotros" className="hover:text-[var(--color-brand)] transition-colors">Sobre nosotros</Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-4">Contacto</h4>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <a href="mailto:hola@travseeker.com" className="flex items-center gap-2 hover:text-[var(--color-brand)] transition-colors">
                <Mail className="w-4 h-4" />
                hola@travseeker.com
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-[var(--color-brand)] transition-colors">
                <AtSign className="w-4 h-4" />
                @travseeker
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <span>© {new Date().getFullYear()} Travseeker. Todos los derechos reservados.</span>
          <span className="font-serif italic text-[var(--color-brand)]/50">Viaja con intención.</span>
        </div>
      </div>
    </footer>
  );
}
