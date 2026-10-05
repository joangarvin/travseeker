import { stripHtmlToText } from '../../../utils/sanitizeContent';
import { RichTextEditor } from './RichTextEditor';
import { useEditorLanguage } from './EditorLanguage';
import {
  cloneElement,
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
} from 'react';
import config from '../../../../../shared/localization.json';
import { languages, t, type Locale, type Translations } from '../../../i18n';

type TextControlProps = InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
> & { onValueChange?: (value: string) => void };

type LocalizedFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  resource: keyof typeof config.fields;
  field: string;
  translations?: Translations;
  onTranslationsChange: (translations: Translations) => void;
  children: ReactElement<TextControlProps>;
};

// The original control still owns Spanish editing and validation. Translations
// share its position and label, while each field keeps its own language choice.
export function LocalizedField({
  label,
  htmlFor,
  hint,
  resource,
  field,
  translations,
  onTranslationsChange,
  children,
}: LocalizedFieldProps) {
  const preferred = useEditorLanguage();
  const [language, setLanguage] = useState<Locale>(preferred);
  useEffect(() => setLanguage(preferred), [preferred]);
  const [originalSource] = useState(String(children.props.value || ''));
  const source = String(children.props.value || '');
  const translated = translations?.[language]?.[field] || '';
  const isOriginal = language === 'es';
  const hintId = `${htmlFor}-hint`;
  const maximum = (config.fields[resource] as Record<string, number>)[field];
  const props: TextControlProps = {
    id: htmlFor,
    lang: language,
    'aria-describedby': hintId,
    maxLength: maximum,
    ...(isOriginal
      ? {}
      : {
          value: translated,
          required: false,
          placeholder: t('Sin traducción: se mostrará en español'),
          onChange: (event) =>
            onTranslationsChange({
              ...translations,
              [language]: { ...translations?.[language], [field]: event.target.value },
            }),
          onBlur: undefined,
        }),
  };
  return (
    <div className="field localized-field">
      <div className="localized-field__heading">
        <label id={`${htmlFor}-label`} htmlFor={htmlFor}>
          {label}
        </label>
        {!translations?.en?.[field]?.trim() && (
          <span className="translation-status">{t('Falta inglés')}</span>
        )}
        {translations?.en?.[field]?.trim() && originalSource !== source && (
          <span className="translation-status">
            {t('Revisa la traducción tras cambiar el original')}
          </span>
        )}
        <div
          className="localized-field__languages"
          role="group"
          aria-label={t('Idioma de {0}', { 0: label })}
        >
          {languages.map(({ code, name }) => (
            <button
              key={code}
              type="button"
              lang={code}
              aria-pressed={language === code}
              aria-controls={htmlFor}
              onClick={() => setLanguage(code as Locale)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      {!isOriginal && children.type === 'select' ? (
        <input {...props} />
      ) : (
        cloneElement(
          children,
          children.type === RichTextEditor && !isOriginal
            ? {
                ...props,
                onValueChange: (value: string) =>
                  onTranslationsChange({
                    ...translations,
                    [language]: { ...translations?.[language], [field]: value },
                  }),
              }
            : props,
        )
      )}
      <small id={hintId}>
        {isOriginal ? (
          hint || t('Texto original en español.')
        ) : (
          <>
            {!translated.trim() && <span>{t('Sin traducción: se mostrará en español')} · </span>}
            {t('Español: {0}', { 0: stripHtmlToText(source) || t('Sin texto original') })}
          </>
        )}
      </small>
    </div>
  );
}
