import type { ReactNode } from 'react';
import './Alert.css';

export type AlertVariant = 'info' | 'success' | 'error' | 'warning';

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div className={`alert-component alert-component--${variant}`} role="alert">
      <div className="alert-component-body">
        {title ? <strong className="alert-component-title">{title}</strong> : null}
        <div className="alert-component-content">{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="alert-component-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
