import type { ElementType } from 'react';
import { sanitizeRichHtml, stripHtmlToText } from '../utils/sanitizeContent';

type FormattedContentProps = {
  content?: string | null;
  asPlaintext?: boolean;
  className?: string;
  as?: ElementType;
};

export function FormattedContent({
  content,
  asPlaintext = false,
  className,
  as: Component = asPlaintext ? 'span' : 'div',
}: FormattedContentProps) {
  if (!content) return null;
  if (asPlaintext) {
    return <Component className={className}>{stripHtmlToText(content)}</Component>;
  }
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }}
    />
  );
}

export default FormattedContent;
