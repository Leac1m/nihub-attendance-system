import type { ReactNode } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute require="admin">{children}</ProtectedRoute>;
}
