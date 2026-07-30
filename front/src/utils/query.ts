export function queryString(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const result = params.toString();
  return result ? `?${result}` : '';
}
