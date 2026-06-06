/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { HomeRedirect } from './pages/HomeRedirect';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { LoginPage } from './pages/LoginPage';
import { PortalLoginPage } from './pages/PortalLoginPage';
import { PortalHomePage } from './pages/PortalHomePage';
import { PortalAttendancePage } from './pages/PortalAttendancePage';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { DepartmentListPage } from './pages/admin/DepartmentListPage';
import { DepartmentCreatePage } from './pages/admin/DepartmentCreatePage';
import { DepartmentDetailPage } from './pages/admin/DepartmentDetailPage';
import { RegistrantListPage } from './pages/admin/RegistrantListPage';
import { RegistrantDetailPage } from './pages/admin/RegistrantDetailPage';
import { StaffListPage } from './pages/admin/StaffListPage';

function NotFound() {
  return (
    <div className="page">
      <div className="page-card" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Not found</h1>
        <p className="page-subtitle">The page you’re looking for doesn’t exist.</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect /> },
  {
    element: <Layout />,
    children: [
      { path: 'register/:code', element: <RegisterPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'portal/login', element: <PortalLoginPage /> },
      {
        path: 'portal',
        element: (
          <ProtectedRoute require="registrant">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <PortalHomePage /> },
          { path: 'attendance', element: <PortalAttendancePage /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute require="admin">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminHomePage /> },
          { path: 'departments', element: <DepartmentListPage /> },
          { path: 'departments/new', element: <DepartmentCreatePage /> },
          { path: 'departments/:code', element: <DepartmentDetailPage /> },
          { path: 'departments/:code/registrants', element: <RegistrantListPage /> },
          { path: 'departments/:code/registrants/:id', element: <RegistrantDetailPage /> },
          { path: 'staff', element: <StaffListPage /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
