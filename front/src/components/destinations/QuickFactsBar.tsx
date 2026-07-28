import { Wallet, Users, Compass } from 'lucide-react';

interface Props {
  presupuesto: string;
  masificacion: string;
  tipoTurismo: string;
}

export default function QuickFactsBar({ presupuesto, masificacion, tipoTurismo }: Props) {
  const facts = [
    { icon: Wallet, label: 'Presupuesto', value: presupuesto },
    { icon: Users, label: 'Masificación', value: masificacion },
    { icon: Compass, label: 'Turismo', value: tipoTurismo },
  ];

  return (
    <div className="quick-facts safe-top">
      <div className="quick-facts__inner">
        <div className="quick-facts__row">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="quick-facts__item">
              <Icon className="quick-facts__icon" />
              <span className="quick-facts__label field-label">{label}</span>
              <span className="quick-facts__value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
