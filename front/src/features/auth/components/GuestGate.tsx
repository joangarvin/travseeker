import type { ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Shell } from '../../../components/layout';
import { Empty } from '../../../components/ui';

type GuestGateProps = {
  title: string;
  children: ReactNode;
};

export function GuestGate({ title, children }: GuestGateProps) {
  return (
    <Shell>
      <section className="guest-gate">
        <Empty
          headingLevel="h1"
          icon={<Heart />}
          title={title}
          action={
            <Link className="button button--primary" to="/auth">
              Entrar o crear una cuenta
            </Link>
          }
        >
          {children}
        </Empty>
      </section>
    </Shell>
  );
}
