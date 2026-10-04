import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Pilcrow } from 'lucide-react';
import { t } from '../../../i18n';
import { sanitizeRichHtml } from '../../../utils/sanitizeContent';

type Props = {
  id?: string;
  value?: string;
  lang?: string;
  maxLength?: number;
  'aria-describedby'?: string;
  onValueChange: (value: string) => void;
};
export function RichTextEditor({
  id,
  value = '',
  lang,
  maxLength,
  onValueChange,
  ...props
}: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const [preview, setPreview] = useState(false);
  const lastValue = useRef(value);
  useEffect(() => {
    if (editor.current && (lastValue.current !== value || editor.current.innerHTML === '')) {
      editor.current.innerHTML = sanitizeRichHtml(value);
      lastValue.current = value;
    }
  }, [value, lang, preview]);
  const rememberSelection = () => {
    const current = window.getSelection();
    if (current?.rangeCount && editor.current?.contains(current.anchorNode))
      selection.current = current.getRangeAt(0).cloneRange();
  };
  const changed = () => {
    const next = sanitizeRichHtml(editor.current?.innerHTML || '');
    lastValue.current = next;
    onValueChange(next);
  };
  const format = (command: string, argument?: string) => {
    editor.current?.focus();
    if (selection.current && editor.current?.contains(selection.current.commonAncestorContainer)) {
      const current = window.getSelection();
      current?.removeAllRanges();
      current?.addRange(selection.current);
    }
    // Native editing preserves selection and the browser's undo stack.
    document.execCommand(command, false, argument);
    rememberSelection();
    changed();
  };
  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar" role="group" aria-label={t('Formato del texto')}>
        {!preview && (
          <>
            <button
              type="button"
              aria-label={t('Negrita')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('bold')}
            >
              <Bold />
            </button>
            <button
              type="button"
              aria-label={t('Cursiva')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('italic')}
            >
              <Italic />
            </button>
            <button
              type="button"
              aria-label={t('Párrafo')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('formatBlock', 'p')}
            >
              <Pilcrow />
            </button>
            <button
              type="button"
              aria-label={t('Lista')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('insertUnorderedList')}
            >
              <List />
            </button>
            <button
              type="button"
              aria-label={t('Lista numerada')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format('insertOrderedList')}
            >
              <ListOrdered />
            </button>
          </>
        )}
        <button
          type="button"
          aria-pressed={preview}
          onClick={() => setPreview((current) => !current)}
        >
          {preview ? t('Editar texto') : t('Vista previa')}
        </button>
      </div>
      {preview ? (
        <div
          className="rich-editor__preview"
          lang={lang}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(value) }}
        />
      ) : (
        <div
          key={lang}
          ref={editor}
          id={id}
          lang={lang}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={id ? `${id}-label` : undefined}
          aria-describedby={props['aria-describedby']}
          className="rich-editor__input"
          contentEditable
          suppressContentEditableWarning
          onInput={changed}
          onMouseUp={rememberSelection}
          onKeyUp={rememberSelection}
          onPaste={(event) => {
            event.preventDefault();
            format('insertText', event.clipboardData.getData('text/plain'));
          }}
          onFocus={() => document.execCommand('defaultParagraphSeparator', false, 'p')}
        />
      )}
      {maxLength && value.length > maxLength && (
        <p role="alert">{t('El texto supera el límite de {0} caracteres.', { 0: maxLength })}</p>
      )}
    </div>
  );
}
