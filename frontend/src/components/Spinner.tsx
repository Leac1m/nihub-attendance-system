import './Spinner.css';

export function Spinner({
  label = 'Loading…',
  fullPage = false,
}: {
  label?: string;
  fullPage?: boolean;
}) {
  return (
    <div
      className={fullPage ? 'spinner spinner--full' : 'spinner'}
      role="status"
      aria-live="polite"
    >
      <div className="spinner-circle" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
