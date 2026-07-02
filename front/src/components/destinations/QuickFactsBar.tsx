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
    <div className="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border-strong)] safe-top">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6 md:gap-10">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 text-sm min-w-0">
              <Icon className="w-4 h-4 text-[var(--color-brand)] shrink-0" />
              <span className="text-[var(--color-muted)] shrink-0">{label}</span>
              <span className="font-semibold text-[var(--color-primary)] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
