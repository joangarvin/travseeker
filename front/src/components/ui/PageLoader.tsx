export default function PageLoader({ label = 'Abriendo el cuaderno…' }: { label?: string }) {
  return (
    <div className="page-loader grain">
      <div className="page-loader__inner">
        <div className="page-loader__seal" aria-hidden>
          <span className="page-loader__seal-text">TS</span>
        </div>
        <div className="page-loader__spinner" />
        <p className="page-loader__label">{label}</p>
      </div>
    </div>
  );
}
