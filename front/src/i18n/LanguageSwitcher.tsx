import { changeLanguage, languages, locale, type Locale } from './index';

export function LanguageSwitcher() {
  return (
    <label className="language-switcher">
      <span className="sr-only">{locale === 'en' ? 'Language' : 'Idioma'}</span>
      <select value={locale} onChange={(event) => changeLanguage(event.target.value as Locale)}>
        {languages.map((language) => (
          <option key={language.code} value={language.code} lang={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </label>
  );
}
