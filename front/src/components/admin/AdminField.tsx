import type { ReactNode } from 'react';

interface Props {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export default function AdminField({ label, hint, required, children, className = '' }: Props) {
  return (
    <div className={`admin-field ${className}`.trim()}>
      <label className="admin-field__label">
        {label}
        {required && <span className="admin-field__required">*</span>}
      </label>
      {children}
      {hint && <p className="admin-field__hint">{hint}</p>}
    </div>
  );
}

export const adminInputClass = 'ui-input admin-input';

export const adminSelectClass = 'ui-input admin-input admin-input--select';

export const adminTextareaClass = 'ui-input admin-input admin-input--textarea';
