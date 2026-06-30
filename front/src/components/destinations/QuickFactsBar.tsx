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
    <div className="sticky top-0 z-40 glass border-b border-[var(--color-border)] shadow-sm">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-4 flex flex-wrap gap-6 md:gap-10">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4 text-[var(--color-brand)]" />
            <span className="text-[var(--color-muted)]">{label}</span>
            <span className="font-semibold text-[var(--color-primary)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
