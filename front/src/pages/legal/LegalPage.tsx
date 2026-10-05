import { Link, useLocation } from 'react-router-dom';
import legal from '../../../../shared/legal.json';
import { Shell, PageMeta } from '../../components/layout';
import { locale, t } from '../../i18n';
import { usePrivacySettings } from '../../features/privacy/CookieConsent';
import { CONSENT_VERSION } from '../../features/privacy/consent';

const say = (es: string, en: string) => (locale === 'en' ? en : es);
const persistent = say(
  'Hasta que lo cambies o borres los datos del sitio. Sin caducidad automática.',
  'Until you change it or clear site data. No automatic expiry.',
);
const storageRows = [
  [
    'trav_session',
    say(
      'Cookie propia del servidor API. Autenticación; HttpOnly, Secure en producción.',
      'First-party API cookie. Authentication; HttpOnly, Secure in production.',
    ),
    say('1 hora; se elimina al cerrar sesión.', '1 hour; deleted on sign-out.'),
  ],
  [
    'trav_privacy_choices',
    say(
      'Almacenamiento local. Elección de privacidad, versión y fecha; necesario para respetar tu decisión.',
      'Local storage. Privacy choices, version and timestamp; necessary to respect your decision.',
    ),
    say(
      '180 días de validez; se solicita otra elección al caducar o cambiar la versión.',
      'Valid for 180 days; a new choice is requested on expiry or version change.',
    ),
  ],
  [
    'trav_locale / trav_theme / travseeker-temperature-unit',
    say(
      'Almacenamiento local. Idioma, apariencia y unidad de temperatura elegidos por ti.',
      'Local storage. Language, appearance and temperature unit you choose.',
    ),
    persistent,
  ],
  [
    'trav_compare',
    say(
      'Almacenamiento local. Destinos que decides comparar.',
      'Local storage. Destinations you choose to compare.',
    ),
    persistent,
  ],
  [
    'trav_tour_v1 / trav_tour_v1:offered',
    say(
      'Recuerda que se ha mostrado, cerrado o completado el tutorial. Sin seguimiento ni envíos al servidor. Se conserva en esta pestaña; el resultado se guarda también entre visitas si aceptas alguna categoría opcional.',
      'Remembers that the tutorial was offered, dismissed or completed. No tracking or server reports. Kept in this tab; the result is also remembered between visits if you accept an optional category.',
    ),
    say(
      'Sesión de la pestaña. Con aceptación, hasta borrar los datos del sitio o retirar todos los permisos opcionales.',
      'Tab session. With acceptance, until site data is cleared or all optional permissions are withdrawn.',
    ),
  ],
  [
    'trav_editor_language',
    say(
      'Almacenamiento local. Idioma de edición elegido por administradores.',
      'Local storage. Editing language chosen by administrators.',
    ),
    persistent,
  ],
  [
    'trav_editor_draft:*',
    say(
      'Almacenamiento de sesión. Recuperación de borradores administrativos.',
      'Session storage. Recovery of admin drafts.',
    ),
    say(
      'Hasta guardar, descartar o terminar la sesión de la pestaña.',
      'Until saved, discarded, or the tab session ends.',
    ),
  ],
  [
    'trav_email_verification_banner_dismissed:v2:*',
    say(
      'Almacenamiento de sesión. Recuerda que has cerrado el aviso de verificación.',
      'Session storage. Remembers that you dismissed the verification notice.',
    ),
    say('Sesión de la pestaña.', 'Tab session.'),
  ],
  [
    'travseeker:route:*',
    say(
      'Almacenamiento local opcional. Caché de rutas calculadas con OSRM; solo con permiso para mapas.',
      'Optional local storage. OSRM route cache; only with map permission.',
    ),
    say(
      'Validez de 24 horas, comprobada al consultar; se elimina al retirar el permiso.',
      'Valid for 24 hours, checked on access; removed when permission is withdrawn.',
    ),
  ],
];
const providers = [
  [
    'Cloudinary',
    say(
      'Imágenes y avatares necesarios para mostrar el contenido. Las peticiones transmiten IP y datos de conexión; la entrega de imágenes no instala cookies según su documentación.',
      'Images and avatars used to display content. Requests transmit IP and connection data; image delivery does not set cookies according to its documentation.',
    ),
    'https://cloudinary.com/privacy',
  ],
  [
    'OpenStreetMap',
    say(
      'Cartografía opcional de los mapas: IP, navegador y área visualizada. Solo se carga al permitir mapas externos.',
      'Optional map tiles: IP, browser and viewed area. Loaded only when external maps are allowed.',
    ),
    'https://osmfoundation.org/wiki/Privacy_Policy',
  ],
  [
    'OSRM',
    say(
      'Rutas opcionales: IP y coordenadas de origen/destino. Sin permiso se muestra distancia aproximada calculada en tu dispositivo.',
      'Optional routes: IP and start/end coordinates. Without permission, approximate distance is calculated on your device.',
    ),
    'https://project-osrm.org/',
  ],
  [
    'Neon',
    say(
      'Alojamiento de la base de datos de cuentas y contenido, a través de nuestro servidor.',
      'Hosting of account and content data through our server.',
    ),
    'https://neon.com/privacy-policy',
  ],
];
export default function LegalPage() {
  const { pathname } = useLocation();
  const { openSettings } = usePrivacySettings();
  const cookies = pathname === '/cookies';
  const privacy = pathname === '/privacidad';
  const title = cookies
    ? t('Política de cookies')
    : privacy
      ? t('Política de privacidad')
      : t('Aviso legal y condiciones de uso');
  return (
    <Shell>
      <PageMeta title={`${title} — TravSeeker`} description={title} />
      <article className="legal-page">
        <header>
          <h1>{title}</h1>
          <p>
            {say('Actualizado:', 'Updated:')} {legal.updatedAt}
          </p>
        </header>
        <nav aria-label={t('Información legal')}>
          <Link to="/cookies">{t('Cookies')}</Link>
          <Link to="/privacidad">{t('Privacidad')}</Link>
          <Link to="/aviso-legal">{t('Aviso legal')}</Link>
          <button type="button" onClick={openSettings}>
            {t('Cambiar preferencias')}
          </button>
        </nav>
        <section>
          <h2>{say('Quién está detrás de TravSeeker', 'Who operates TravSeeker')}</h2>
          <p>
            {legal.operators.join(' · ')} · {say('España', 'Spain')}
          </p>
          <p>
            <a href={`mailto:${legal.email}`}>{legal.email}</a>
          </p>
          {!cookies && (
            <p>
              {say('Domicilio de contacto:', 'Contact address:')}{' '}
              {legal.address ||
                say(
                  'pendiente de facilitar por los titulares. Este aviso necesita completarse antes de publicarse como información legal definitiva.',
                  'not yet supplied by the operators. This notice must be completed before publication as final legal information.',
                )}
            </p>
          )}
          {legal.taxDetails && <p>{legal.taxDetails}</p>}
        </section>
        {cookies ? (
          <>
            <section>
              <h2>{say('Qué usamos y para qué', 'What we use and why')}</h2>
              <p>
                {say(
                  'Las cookies son pequeños datos guardados por el navegador. También usamos almacenamiento local y de sesión, que se identifican por separado en la tabla. No usamos publicidad comportamental, píxeles publicitarios ni Google Analytics. Las fuentes se sirven desde esta web.',
                  'Cookies are small pieces of data stored by the browser. We also use local and session storage, listed separately below. We do not use behavioural advertising, advertising pixels or Google Analytics. Fonts are served by this website.',
                )}
              </p>
              <p>
                {say(
                  'La sesión y las preferencias o funciones que solicitas siguen disponibles al rechazar las opciones. La medición de rendimiento y las conexiones con mapas/rutas externos permanecen desactivadas hasta que las permitas. Una conexión externa puede transmitir datos aunque no instale cookies.',
                  'Login and preferences or features you request remain available when you reject optional processing. Performance measurement and external map/route connections stay disabled until you allow them. An external connection may transmit data even if it does not set cookies.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Tus controles', 'Your controls')}</h2>
              <p>
                {say(
                  'Aceptar opcionales activa medición y mapas. Rechazar opcionales desactiva ambas categorías. Personalizar permite elegir cada una por separado, sin casillas premarcadas. Cerrar el panel o seguir navegando no concede permiso. La selección se guarda en este navegador durante 180 días, con su fecha y versión, sin crear una cuenta ni enviar una nueva consulta a la base de datos.',
                  'Accept optional enables measurement and maps. Reject optional disables both. Customize lets you choose each independently, with no preselected optional boxes. Closing the panel or continuing to browse does not grant permission. Your choice is saved in this browser for 180 days, with its date and version, without creating an account or making a new database query.',
                )}
              </p>
              <p>
                {say(
                  'Puedes retirar el permiso desde Privacidad y cookies, siempre accesible, con la misma facilidad que al concederlo. La retirada detiene nuevas mediciones y mapas, y borra la caché local de rutas; no puede retirar datos ya enviados. Si el navegador bloquea el almacenamiento, la decisión solo se mantiene en la pestaña actual.',
                  'You can withdraw permission through the always-available Privacy and cookies control, as easily as granting it. Withdrawal stops new measurement and maps and clears the local route cache; it cannot recall data already sent. If browser storage is blocked, the choice lasts only in the current tab.',
                )}
              </p>
              <button className="button button--quiet" onClick={openSettings}>
                {t('Cambiar preferencias')}
              </button>
            </section>
            <section>
              <h2>
                {say('Inventario de cookies y almacenamiento', 'Cookie and storage inventory')}
              </h2>
              <div className="legal-table">
                <table>
                  <thead>
                    <tr>
                      <th>{say('Nombre', 'Name')}</th>
                      <th>{say('Finalidad y tecnología', 'Purpose and technology')}</th>
                      <th>{say('Duración', 'Duration')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageRows.map(([key, purpose, duration]) => (
                      <tr key={key}>
                        <th scope="row">
                          <code>{key}</code>
                        </th>
                        <td>{purpose}</td>
                        <td>{duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                {say(
                  'Son claves propias de TravSeeker. Las necesarias y funciones solicitadas no se usan para otras finalidades. El navegador también puede mantener caché HTTP de recursos según sus cabeceras; no se usa para identificarte. Puedes borrar los datos del sitio desde tu navegador, lo que también elimina preferencias y puede cerrar tu sesión.',
                  'These are TravSeeker storage keys. Necessary storage and requested features are not reused for other purposes. Browsers may also cache resources according to HTTP headers; this is not used to identify you. Clearing site data in your browser removes preferences and may sign you out.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Medición opcional', 'Optional measurement')}</h2>
              <p>
                {say(
                  'Con permiso, enviamos métricas FCP, LCP y CLS (carga y estabilidad visual), la categoría general de página y la hora a nuestro servidor. No se envían identificadores de cuenta, rutas con tokens, parámetros de búsqueda ni cookies de sesión en esta petición. La conexión de red expone la IP al servidor. No se crea una cookie de analítica.',
                  'With permission, FCP, LCP and CLS measurements (loading and visual stability), the general page category and time are sent to our server. No account identifiers, token-bearing paths, search parameters or session cookies are sent in this request. The network connection exposes the IP to the server. No analytics cookie is created.',
                )}
              </p>
            </section>
          </>
        ) : privacy ? (
          <>
            <section>
              <h2>{say('Datos y finalidades', 'Data and purposes')}</h2>
              <p>
                {say(
                  'Al crear una cuenta tratamos email, nombre opcional, contraseña protegida mediante hash y estado de verificación. El perfil puede incluir apellido, avatar y preferencias. Guardamos favoritos, viajes, fechas y notas que introduces, participantes o enlaces de viajes compartidos, reseñas y alertas que configuras. Usamos esos datos para prestar las funciones solicitadas y enviar mensajes de verificación, recuperación o alertas solicitadas.',
                  'When you create an account we process your email, optional name, hashed password and verification status. Your profile may include a surname, avatar and preferences. We store favourites, trips, dates and notes you enter, shared-trip participants or links, reviews and alerts you configure. We use this information to provide requested features and send verification, recovery or requested alert messages.',
                )}
              </p>
              <p>
                {say(
                  'Los viajes compartidos son accesibles a las personas con acceso o con el enlace mientras esté activo. Las reseñas publicadas y los datos de autor asociados son visibles en la web. No incluyas información sensible ni datos de otras personas sin autorización.',
                  'Shared trips are accessible to people with access or the link while it is active. Published reviews and associated author details are visible on the website. Do not include sensitive information or other people’s data without permission.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Bases del tratamiento', 'Basis for processing')}</h2>
              <p>
                {say(
                  'Prestamos las funciones de cuenta solicitadas para ejecutar la relación de servicio. La seguridad y prevención de abuso responden al interés legítimo de proteger el servicio, ponderando tus derechos. La medición opcional y los mapas externos se basan en tu permiso. Las obligaciones legales pueden exigir conservar o comunicar determinados datos. Retirar un consentimiento no afecta al tratamiento anterior lícito.',
                  'Requested account functions support the service relationship. Security and abuse prevention rely on the legitimate interest in protecting the service, balanced against your rights. Optional measurement and external maps rely on your permission. Legal duties may require retention or disclosure of specific data. Withdrawal does not affect prior lawful processing.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Conservación y eliminación', 'Retention and deletion')}</h2>
              <p>
                {say(
                  'Los datos de cuenta y contenido se mantienen mientras los necesites para usar el servicio, hasta que los elimines donde exista esa opción o solicites su supresión por email. No existe una caducidad automática de las cuentas. Las copias de seguridad y registros técnicos dependen de los plazos del alojamiento contratado; los titulares deben confirmar esos plazos. Tras una solicitud se conservarán únicamente los datos necesarios para obligaciones legales o reclamaciones, con acceso restringido. La duración del almacenamiento del navegador figura en la política de cookies.',
                  'Account and content data remain while needed for the service, until you delete them where supported or request erasure by email. Accounts do not automatically expire. Backup and technical-log periods depend on the hosting contract and must be confirmed by the operators. Following a request, only data needed for legal duties or claims should be retained with restricted access. Browser storage periods appear in the cookie policy.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Proveedores y transferencias', 'Providers and transfers')}</h2>
              <p>
                {say(
                  'La infraestructura de alojamiento, base de datos, correo e imágenes trata los datos necesarios para prestar esas funciones. Usamos Neon y Cloudinary; el proveedor concreto de alojamiento y correo depende del despliegue y debe ser confirmado por los titulares. Algunos proveedores operan internacionalmente. Antes de producción deben verificarse contratos de tratamiento, regiones y mecanismos de transferencia aplicables; no se presume que todos los datos permanezcan en la UE. Solicita detalles por email.',
                  'Hosting, database, email and image infrastructure process data needed for these functions. We use Neon and Cloudinary; the exact hosting and email providers depend on deployment and must be confirmed by the operators. Some providers operate internationally. Processing agreements, regions and applicable transfer mechanisms must be checked before production; data is not assumed to remain entirely in the EU. Request details by email.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Tus derechos y contacto', 'Your rights and contact')}</h2>
              <p>
                {say(
                  'Puedes solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo al email de los titulares. Identifica tu cuenta y la solicitud; no envíes documentos sensibles salvo que sean necesarios para verificar tu identidad. El plazo general de respuesta es un mes, con las ampliaciones justificadas previstas en la normativa. Puedes reclamar ante la Agencia Española de Protección de Datos.',
                  'You may request access, correction, erasure, objection, restriction and portability by emailing the operators. Identify your account and request; do not send sensitive documents unless needed to verify identity. The general response period is one month, with justified extensions as provided by law. You may complain to the Spanish Data Protection Agency.',
                )}
              </p>
              <a href="https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos">
                {say('Información de la AEPD sobre derechos', 'AEPD information on your rights')}
              </a>
            </section>
            <section>
              <h2>
                {say('Menores y decisiones automatizadas', 'Children and automated decisions')}
              </h2>
              <p>
                {say(
                  'La web no está dirigida a menores de 14 años. Si el tratamiento de sus datos requiere consentimiento, debe aportarlo su representante legal. Contacta si detectas una cuenta creada sin la autorización necesaria. Las recomendaciones de destinos son orientativas y no adoptan decisiones con efectos jurídicos o similares sobre ti.',
                  'The website is not directed at children under 14. Where processing their data requires consent, their legal representative must provide it. Contact us if you identify an account created without necessary authorization. Destination recommendations are guidance and do not make decisions with legal or similarly significant effects about you.',
                )}
              </p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2>{say('Uso del servicio', 'Using the service')}</h2>
              <p>
                {say(
                  'TravSeeker ofrece información sobre destinos y herramientas para guardar, comparar y organizar viajes. El contenido editorial es orientativo: verifica con las fuentes oficiales horarios, precios, accesos, reservas, seguridad y condiciones antes de viajar. No se ofrecen reservas ni contratación de viajes a través de estas herramientas.',
                  'TravSeeker provides destination information and tools to save, compare and plan trips. Editorial content is guidance: verify opening hours, prices, access, reservations, safety and conditions with official sources before travelling. These tools do not offer travel bookings or travel contracts.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Cuentas y contenidos de usuarios', 'Accounts and user content')}</h2>
              <p>
                {say(
                  'Utiliza datos correctos, protege tus credenciales y respeta a los demás. No publiques contenido ilícito, datos ajenos sin autorización ni material sobre el que no tengas derechos. Conservas los derechos sobre tus aportaciones; permites su almacenamiento y presentación para prestar las funciones que utilizas. Podemos moderar contenidos para mantener la integridad del servicio. Las solicitudes y avisos de contenido pueden dirigirse al email de contacto.',
                  'Use accurate details, protect your credentials and respect others. Do not publish unlawful content, other people’s data without authorization or material you have no right to use. You retain rights in your contributions and allow their storage and display to provide the features you use. We may moderate content to maintain the service’s integrity. Send requests or content reports to the contact email.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Propiedad intelectual y enlaces', 'Intellectual property and links')}</h2>
              <p>
                {say(
                  'Respeta los derechos y licencias de textos, fotografías, mapas y software. Los mapas incluyen atribución a sus proveedores; las fuentes tipográficas se distribuyen con sus licencias abiertas. Los enlaces externos conducen a servicios independientes con sus propias condiciones.',
                  'Respect the rights and licences applying to text, photographs, maps and software. Maps identify their providers; fonts are distributed with their open-source licences. External links lead to independent services with their own terms.',
                )}
              </p>
            </section>
            <section>
              <h2>{say('Disponibilidad y derechos legales', 'Availability and legal rights')}</h2>
              <p>
                {say(
                  'Podemos corregir, actualizar o interrumpir temporalmente funciones por mantenimiento o incidencias. Nada en estas condiciones limita derechos irrenunciables ni excluye responsabilidades que no puedan excluirse legalmente. Se aplica la normativa española y europea que corresponda, respetando las reglas imperativas de protección de consumidores y competencia judicial.',
                  'Features may be corrected, updated or temporarily interrupted for maintenance or incidents. These terms do not limit mandatory rights or exclude liability that cannot lawfully be excluded. Applicable Spanish and European rules apply, including mandatory consumer protection and jurisdiction rules.',
                )}
              </p>
            </section>
          </>
        )}
        {(cookies || privacy) && (
          <section>
            <h2>{say('Servicios y políticas de terceros', 'Services and third-party policies')}</h2>
            {providers.map(([name, description, url]) => (
              <p key={name}>
                <a href={url} rel="noreferrer">
                  {name}
                </a>{' '}
                — {description}
              </p>
            ))}
          </section>
        )}
        <section className="legal-sources">
          <h2>{say('Referencias y cambios', 'References and changes')}</h2>
          <p>
            {say(
              'La política debe actualizarse si cambian servicios o finalidades. Los cambios que requieren otra autorización renuevan la solicitud de permiso.',
              'The policy must be updated when services or purposes change. Changes requiring fresh authorization renew the permission request.',
            )}{' '}
            {cookies &&
              `${say('Versión de consentimiento:', 'Consent version:')} ${CONSENT_VERSION}.`}
          </p>
          <p>
            <a href="https://www.aepd.es/guias/guia-cookies.pdf">AEPD</a> ·{' '}
            <a href="https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758">LSSI</a> ·{' '}
            <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj">RGPD / GDPR</a>
          </p>
        </section>
      </article>
    </Shell>
  );
}
