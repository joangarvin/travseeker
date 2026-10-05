import { usePrivacySettings } from '../../features/privacy/CookieConsent';
import { useGuidedTour } from '../../features/tour/GuidedTour';
import { locale } from '../../i18n';
import { t } from '../../i18n';
import { Link } from 'react-router-dom';

export function SiteFooter() {
  const { restart } = useGuidedTour();
  const { openSettings } = usePrivacySettings();
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
          <button className="footer-tour" type="button" onClick={restart}>
            {locale === 'en' ? 'Repeat tutorial' : 'Repetir tutorial'}
          </button>
          <Link to="/sobre-nosotros">{t('El proyecto')}</Link>
        </nav>
      </div>
      <nav className="footer-legal" aria-label={t('Información legal')}>
        <Link to="/cookies">{t('Política de cookies')}</Link>
        <Link to="/privacidad">{t('Privacidad')}</Link>
        <Link to="/aviso-legal">{t('Aviso legal')}</Link>
        <button className="footer-tour" type="button" onClick={openSettings}>
          {t('Preferencias de cookies')}
        </button>
      </nav>
      <div className="footer__bottom">
        <span>TravSeeker © {new Date().getFullYear()}</span>
        <span>{t('España · Sin posiciones patrocinadas')}</span>
      </div>
    </footer>
  );
}
