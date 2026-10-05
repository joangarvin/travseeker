import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { locale } from '../../i18n';

const say = (es: string, en: string) => (locale === 'en' ? en : es);
type Options = {
  navigate: (path: string) => void;
  finish: (completed: boolean) => void;
  rememberStep: (index: number) => void;
  maps: boolean;
};

/** Native actions still run; the tour only observes them and guides the next step. */
export function createInteractiveTour({ navigate, finish, rememberStep, maps }: Options): Driver {
  let removeAction = () => {};
  let pending: ReturnType<typeof setTimeout> | undefined;
  const next = (path?: string) => {
    removeAction();
    if (path) navigate(path);
    tour.moveNext();
  };
  const watchAction = (element: Element | undefined, event: string, path?: string) => {
    removeAction();
    const handler = () => {
      // Let React finish the real action/navigation before resolving the next target.
      removeAction();
      const deadline = Date.now() + 8000;
      const advanceWhenReady = () => {
        if (
          event === 'submit' &&
          element?.querySelector('[aria-busy="true"]') &&
          Date.now() < deadline
        ) {
          pending = setTimeout(advanceWhenReady, 100);
        } else next(path);
      };
      pending = setTimeout(advanceWhenReady, 100);
    };
    element?.addEventListener(event, handler);
    removeAction = () => element?.removeEventListener(event, handler);
  };
  const steps: DriveStep[] = [
    {
      element: '[data-tour="search"]',
      onHighlightStarted: (element) => watchAction(element, 'submit'),
      popover: {
        title: say('1. Busca tu próximo destino', '1. Search for your next destination'),
        description: say(
          'Escribe un lugar o una actividad y pulsa <b>Buscar</b>. Te llevaremos al primer resultado. También puedes continuar sin buscar.',
          'Type a place or activity and click <b>Search</b>. We will guide you to the first result. You can also continue without searching.',
        ),
        nextBtnText: say('Ver un destino', 'See a destination'),
      },
    },
    {
      element: '[data-tour="destination"]',
      onHighlightStarted: (element) => watchAction(element, 'click'),
      popover: {
        title: say('2. Pulsa este destino', '2. Click this destination'),
        description: say(
          '<b>Haz clic en la tarjeta resaltada.</b> Se abrirá su ficha y el recorrido continuará allí.',
          '<b>Click the highlighted card.</b> Its page will open and the tour will continue there.',
        ),
        nextBtnText: say('Abrir destino', 'Open destination'),
        onNextClick: () => {
          const link = document.querySelector<HTMLAnchorElement>('[data-tour="destination"]');
          if (link) link.click();
          else {
            navigate('/mapa');
            tour.moveTo(4);
          }
        },
      },
    },
    {
      element: '[data-tour="essentials"]',
      popover: {
        title: say('3. Descubre qué hacer', '3. Discover what to do'),
        description: say(
          'Aquí están los imprescindibles. Abre un tema para ver sus recomendaciones. Desplazamos la página por ti para que encuentres cada sección.',
          'Here are the essentials. Open a theme to see its recommendations. We scroll the page for you to bring each section into view.',
        ),
        nextBtnText: say('Aprender a comparar', 'Learn to compare'),
      },
    },
    {
      element: '[data-tour="compare-destination"]',
      onHighlightStarted: (element) => watchAction(element, 'click', '/mapa'),
      popover: {
        title: say('4. Selecciona tu opción', '4. Select your option'),
        description: say(
          '<b>Pulsa Comparar</b> para añadir este destino. Si ya aparece seleccionado, puedes dejarlo así y continuar. Tu selección real se conserva.',
          '<b>Click Compare</b> to add this destination. If it is already selected, you can leave it selected and continue. Your actual selection is kept.',
        ),
        nextBtnText: say('Continuar al mapa', 'Continue to the map'),
        onNextClick: () => next('/mapa'),
      },
    },
    {
      element: '[data-tour="map"]',
      popover: {
        title: say('5. Explora el mapa', '5. Explore the map'),
        description: maps
          ? say(
              'Arrastra el mapa o pulsa un marcador para explorar la zona. Después veremos dónde comparar tus opciones.',
              'Drag the map or click a marker to explore the area. Next, we will show you where to compare your options.',
            )
          : say(
              'Los mapas externos están desactivados. Puedes usar <b>Configurar mapas</b> si quieres dar permiso, o continuar sin activarlos.',
              'External maps are disabled. Use <b>Configure maps</b> if you want to give permission, or continue without enabling them.',
            ),
        nextBtnText: say('Abrir comparación', 'Open comparison'),
        onNextClick: () => next('/comparar'),
      },
    },
    {
      element: '[data-tour="comparison"]',
      popover: {
        title: say('6. Decide con más información', '6. Make an informed choice'),
        description: say(
          'Añade otra opción aquí para comparar presupuesto, temporada y afluencia. Ya sabes moverte por TravSeeker. Puedes repetir el recorrido desde el pie de página.',
          'Add another option here to compare budget, season and crowds. You now know your way around TravSeeker. Replay the tour from the page footer.',
        ),
        onNextClick: () => finish(true),
        onDoneClick: () => finish(true),
        doneBtnText: say('Terminar tutorial', 'Finish tour'),
      },
    },
  ];
  steps.forEach((step, index) => {
    const begin = step.onHighlightStarted;
    step.onHighlightStarted = (element, activeStep, options) => {
      rememberStep(index);
      element?.scrollIntoView({ block: 'center', behavior: 'instant' });
      begin?.(element, activeStep, options);
    };
  });
  const tour = driver({
    steps,
    animate: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    smoothScroll: false,
    allowClose: true,
    overlayClickBehavior: 'none',
    overlayOpacity: 0.62,
    stagePadding: 8,
    stageRadius: 8,
    popoverClass: 'trav-tour-popover',
    showButtons: ['next', 'close'],
    showProgress: true,
    progressText: say('{{current}} de {{total}}', '{{current}} of {{total}}'),
    nextBtnText: say('Continuar', 'Continue'),
    closeBtnLabel: say('Cerrar tutorial', 'Close tutorial'),
    waitForElement: 8000,
    onDeselected: () => removeAction(),
    onCloseClick: () => finish(false),
    onDestroyStarted: () => finish(false),
    onDestroyed: () => {
      removeAction();
      clearTimeout(pending);
    },
    onPopoverRender: (popover, { state }) => {
      // This is a contextual guide, not a modal: the highlighted control remains keyboard-accessible.
      popover.wrapper.setAttribute('role', 'region');
      popover.wrapper.removeAttribute('aria-modal');
      if (!state.activeElement || state.activeElement === document.body) {
        popover.description.textContent = say(
          'Este elemento no está disponible ahora. Puedes continuar o cerrar el tutorial e intentarlo más tarde.',
          'This item is not available right now. Continue, or close the tour and try again later.',
        );
        popover.nextButton.textContent = say('Saltar paso', 'Skip step');
      }
    },
  });
  return tour;
}
