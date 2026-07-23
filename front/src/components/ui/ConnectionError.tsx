export default function ConnectionError() {
  return (
    <div className="max-w-2xl mx-auto px-6 mb-8 p-5 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm text-center">
      <strong>Se nos ha caído la conexión con el servidor.</strong> Danos un minuto y vuelve a
      probar. Si estás en local:{' '}
      <code className="bg-[var(--color-danger)]/10 px-2 py-0.5 rounded font-mono text-xs">cd backend && node index.js</code>
    </div>
  );
}
