export function creationContext() {
  try {
    const value = JSON.parse(sessionStorage.getItem('trav-admin-country-context') || '{}');
    return {
      countryCode: /^[A-Z]{2}$/.test(value.country) ? value.country : 'ES',
      region: typeof value.region === 'string' ? value.region : '',
    };
  } catch {
    return { countryCode: 'ES', region: '' };
  }
}
