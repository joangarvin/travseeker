import { type ReactNode } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3;
}

export default function ScrollReveal({ children, className = '', delay = 0 }: Props) {
  const { ref, visible } = useScrollReveal();
  const delayClass = delay ? `scroll-reveal-delay-${delay}` : '';

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? 'visible' : ''} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}
