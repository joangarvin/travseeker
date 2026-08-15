import { Children, cloneElement, isValidElement, type ReactNode } from 'react';

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const describedChildren = hintId
    ? Children.map(children, (child) => {
        if (!isValidElement<{ 'aria-describedby'?: string }>(child) || child.props['aria-describedby']) return child;
        if (typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type)) {
          return cloneElement(child, { 'aria-describedby': hintId });
        }
        return child;
      })
    : children;
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {describedChildren}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
