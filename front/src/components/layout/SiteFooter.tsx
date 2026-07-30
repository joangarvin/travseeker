import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <p className="footer__statement">
          El lugar correcto
          <br />
          en el momento justo.
        </p>
        <nav aria-label="Pie">
          <Link to="/">Destinos</Link>
          <Link to="/mapa">Mapa</Link>
          <Link to="/comparar">Comparar</Link>
          <Link to="/sobre-nosotros">El proyecto</Link>
        </nav>
      </div>
      <div className="footer__bottom">
        <span>TravSeeker © {new Date().getFullYear()}</span>
        <span>España · Sin posiciones patrocinadas</span>
      </div>
    </footer>
  );
}
