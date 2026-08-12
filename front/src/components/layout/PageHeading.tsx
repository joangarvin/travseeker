import type { ReactNode } from 'react';

type PageHeadingProps = {
  kicker?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function PageHeading({ kicker, title, children, action, className = '' }: PageHeadingProps) {
  return (
    <header className={`page-heading ${className}`.trim()}>
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h1>{title}</h1>
        {children && <div className="page-heading__intro">{children}</div>}
      </div>
      {action}
    </header>
  );
}
