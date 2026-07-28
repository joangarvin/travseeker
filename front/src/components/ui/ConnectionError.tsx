export default function ConnectionError() {
  return (
    <div className="connection-error">
      <strong>Se nos ha caído la conexión con el servidor.</strong> Danos un minuto y vuelve a
      probar. Si estás en local:{' '}
      <code>cd backend && node index.js</code>
    </div>
  );
}
