import type { ReactNode } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

export function RegistrantRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute require="registrant">{children}</ProtectedRoute>;
}
