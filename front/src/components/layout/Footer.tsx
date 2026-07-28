import { Mail, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div>
            <img src={logo} alt="Travseeker" className="site-footer__logo" />
            <p className="site-footer__copy">
              Una guía hecha a mano de la España que no sale en los carruseles. Datos honestos,
              cero patrocinios.
            </p>
          </div>

          <div>
            <h4 className="site-footer__heading field-label">Explorar</h4>
            <nav className="site-footer__links">
              <Link to="/" className="site-footer__link">Inicio</Link>
              <a href="/#destinos" className="site-footer__link">La selección</a>
              <Link to="/mapa" className="site-footer__link">El mapa</Link>
              <Link to="/sobre-nosotros" className="site-footer__link">Quiénes somos</Link>
            </nav>
          </div>

          <div>
            <h4 className="site-footer__heading field-label">Contacto</h4>
            <div className="site-footer__contact">
              <a href="mailto:hola@travseeker.com" className="site-footer__link">
                <Mail aria-hidden />
                hola@travseeker.com
              </a>
              <a href="#" className="site-footer__link">
                <AtSign aria-hidden />
                @travseeker
              </a>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Travseeker. Todos los derechos reservados.</span>
          <span className="site-footer__tagline">
            <span className="site-footer__tagline-text">
              Los buenos sitios, contados bajito.
            </span>
            <span
              aria-hidden
              className="site-footer__seal"
            >
              TS
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
