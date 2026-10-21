import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Publication from './Publication';
import { Badge } from './views';
import { countryResult } from './model';
const steps = [
  {
    title: 'Empieza sin publicar',
    text: 'Cada nuevo registro empieza En preparación y oculto. Completa su información y revisa sus fuentes con tranquilidad.',
  },
  {
    title: 'Acabado no significa publicado',
    text: 'Cuando el contenido esté completo, márcalo como Acabado. Si Mostrar sigue en No, quedará Listo para publicar.',
  },
  {
    title: 'Decide cuándo mostrarlo',
    text: 'Activa Mostrar para publicar una ficha acabada. En destinos, localidades y países aún en preparación, solo aparecerá Próximamente.',
  },
  {
    title: 'Comprueba el país',
    text: 'Un país oculto o en Próximamente no expone sus fichas hijas. Verás Oculto por país en los registros que esperan su lanzamiento.',
  },
  {
    title: 'Practica antes de guardar',
    text: 'Prueba los dos controles de abajo. Este ejercicio no cambia el catálogo. Para retirar algo sin borrarlo, desactiva Mostrar.',
  },
];
export default function Tutorial() {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div className="ex-tutorial">
      <div className="ex-progress" aria-label={`Paso ${step + 1} de 5`}>
        {steps.map((_, i) => (
          <span key={i} data-complete={i <= step || undefined} />
        ))}
      </div>
      <span className="ex-eyebrow">GUÍA PARA EL EQUIPO · {step + 1}/5</span>
      <h3>{steps[step].title}</h3>
      <p>{steps[step].text}</p>
      {step === 4 ? (
        <>
          <Publication ready={ready} show={show} onReady={setReady} onShow={setShow} />
          <div className="ex-result">
            <span>Resultado de tu prueba</span>
            <Badge value={countryResult({ id: 'demo', name: 'Ejemplo', ready, show })} />
          </div>
        </>
      ) : (
        <div className="ex-tutorial-note">
          Recuerda: <strong>terminar y publicar son decisiones distintas.</strong>
        </div>
      )}
      <div className="ex-dialog-actions">
        <button className="ex-btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft size={17} />
          Anterior
        </button>
        <button
          className="ex-btn ex-btn--primary"
          onClick={() => setStep((s) => (s === 4 ? 0 : s + 1))}
        >
          {step === 4 ? 'Volver al inicio' : 'Siguiente'}
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
