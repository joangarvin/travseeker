import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { locale } from './index';

// Keep copied URLs language-specific, including after client-side navigation.
export function LanguageNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('lang') === locale) return;
    params.set('lang', locale);
    navigate(
      { pathname: location.pathname, search: params.toString(), hash: location.hash },
      {
        replace: true,
        state: location.state,
      },
    );
  }, [location.pathname, location.search, location.hash, location.state, navigate]);
  return null;
}
