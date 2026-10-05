import { createContext, useContext, useState, type ReactNode } from 'react';
import { languages, t, type Locale } from '../../../i18n';
const Context = createContext<Locale>('es');
export function useEditorLanguage() {
  return useContext(Context);
}
export function EditorLanguage({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Locale>(() => {
    try {
      return localStorage.getItem('trav_editor_language') === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });
  return (
    <Context.Provider value={language}>
      <label className="editor-language">
        {t('Idioma de edición')}
        <select
          value={language}
          onChange={(event) => {
            const next = event.target.value as Locale;
            setLanguage(next);
            try {
              localStorage.setItem('trav_editor_language', next);
            } catch {
              /* optional preference */
            }
          }}
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        <span>{t('Puedes cambiar el idioma de cada campo.')}</span>
      </label>
      {children}
    </Context.Provider>
  );
}
