import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { AttendeeForm } from './AttendeeForm';

export function RegisterPage() {
  const params = useParams();
  const code = (params.code ?? 'CS101').toUpperCase();
  const [registered, setRegistered] = useState(false);

  return (
    <div className="page">
      {registered ? (
        <Alert variant="success" title="Registration complete">
          Please check your email — we sent you a verification link to set
          up your portal password. Once verified, you can sign in to your
          attendee portal.
        </Alert>
      ) : null}
      <AttendeeForm
        courseCode={code}
        onSuccess={() => setRegistered(true)}
      />
    </div>
  );
}
