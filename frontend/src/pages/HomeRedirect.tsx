import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Spinner } from '../components/Spinner';

export function HomeRedirect() {
  const { state, currentRole } = useAuth();

  if (state.kind === 'unknown') {
    return <Spinner fullPage label="Loading your session…" />;
  }

  if (currentRole === 'admin' || currentRole === 'staff') {
    return <Navigate to="/admin" replace />;
  }
  if (currentRole === 'registrant') {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>Welcome to NIHUB Attendance</h1>
        <p>Register for a program, or sign in to your portal.</p>
      </div>

      <div className="landing-cards">
        <Link to="/portal/login" className="landing-card">
          <h2>Attendee Portal</h2>
          <p>Already registered? Sign in to view your profile and attendance history.</p>
        </Link>
        <Link to="/login" className="landing-card">
          <h2>Staff Sign In</h2>
          <p>Department admins and staff, sign in to manage programs and attendance.</p>
        </Link>
        <Link to="/register/CS101" className="landing-card">
          <h2>New Registration</h2>
          <p>Register for a program. Have your matriculation number ready.</p>
        </Link>
      </div>
    </div>
  );
}
