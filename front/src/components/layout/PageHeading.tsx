import type { ReactNode } from 'react';

type PageHeadingProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function PageHeading({ title, children, action, className = '' }: PageHeadingProps) {
  return (
    <header className={`page-heading ${className}`.trim()}>
      <div>
        <h1>{title}</h1>
        {children && <div className="page-heading__intro">{children}</div>}
      </div>
      {action}
    </header>
  );
}
