import type { ReactNode } from 'react';

type PageHeadingProps = {
  kicker?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export function PageHeading({ kicker, title, children, action }: PageHeadingProps) {
  return (
    <header className="page-heading">
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h1>{title}</h1>
        {children && <div className="page-heading__intro">{children}</div>}
      </div>
      {action}
    </header>
  );
}
