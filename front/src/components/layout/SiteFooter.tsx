import { t } from '../../i18n';
import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <p className="footer__statement">
          {t('El lugar correcto')}
          <br />
          {t('en el momento justo.')}
        </p>
        <nav aria-label={t('Pie')}>
          <Link to="/">{t('Destinos')}</Link>
          <Link to="/mapa">{t('Mapa')}</Link>
          <Link to="/comparar">{t('Comparar')}</Link>
          <Link to="/sobre-nosotros">{t('El proyecto')}</Link>
        </nav>
      </div>
      <div className="footer__bottom">
        <span>TravSeeker © {new Date().getFullYear()}</span>
        <span>{t('España · Sin posiciones patrocinadas')}</span>
      </div>
    </footer>
  );
}
