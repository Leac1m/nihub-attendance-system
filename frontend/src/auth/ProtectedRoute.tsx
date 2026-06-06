import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { Spinner } from '../components/Spinner';

type RequireRole = 'admin' | 'staff' | 'registrant';

export function ProtectedRoute({
  children,
  require,
}: {
  children: ReactNode;
  require: RequireRole;
}) {
  const { state } = useAuth();

  if (state.kind === 'unknown') {
    return <Spinner fullPage label="Loading…" />;
  }

  if (state.kind === 'anon') {
    if (require === 'registrant') {
      return <Navigate to="/portal/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (require === 'admin' && !(state.kind === 'staff' && state.user.isAdmin)) {
    return <Navigate to="/admin" replace />;
  }
  if (require === 'staff' && state.kind !== 'staff') {
    return <Navigate to="/login" replace />;
  }
  if (require === 'registrant' && state.kind !== 'registrant') {
    return <Navigate to="/portal/login" replace />;
  }
  return <>{children}</>;
}
