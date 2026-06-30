export default function ConnectionError() {
  return (
    <div className="max-w-2xl mx-auto px-6 mb-8 p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm text-center">
      <strong>No se puede conectar al servidor.</strong> Asegúrate de tener el backend corriendo:{' '}
      <code className="bg-red-100 px-2 py-0.5 rounded text-xs">cd backend && node index.js</code>
    </div>
  );
}
