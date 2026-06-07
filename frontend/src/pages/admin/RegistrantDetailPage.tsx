import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { Alert } from '../../components/Alert';
import {
  getRegistrant,
  setManualAttendance,
  resendQr,
  downloadQr,
  type Registrant,
} from '../../services/adminApi';

const STATUS_LABELS: Record<number, string> = {
  0: 'Absent',
  1: 'Partial',
  2: 'Present',
};

const STATUS_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: '#FFEBEE', text: '#C62828' },
  1: { bg: '#FFF8E1', text: '#F57F17' },
  2: { bg: '#E8F5E9', text: '#2E7D32' },
};

export function RegistrantDetailPage() {
  const { code = '', id = '' } = useParams();
  const [registrant, setRegistrant] = useState<Registrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<number>(0);
  const [resending, setResending] = useState(false);

  const loadRegistrant = () => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getRegistrant(code, id);
        if (!cancelled) setRegistrant(data.registrant);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load registrant');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    const cleanup = loadRegistrant();
    return cleanup;
  }, [code, id]);

  const handleStatusEdit = (date: string, currentStatus: number) => {
    setEditingDate(date);
    setEditStatus(currentStatus);
  };

  const handleStatusSave = async (date: string) => {
    try {
      await setManualAttendance(code, id, date, editStatus as 0 | 1 | 2);
      setEditingDate(null);
      setSuccessMsg('Attendance updated');
      loadRegistrant();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attendance');
    }
  };

  const handleResendQr = async () => {
    setResending(true);
    try {
      const { data } = await resendQr(code, id);
      if (data.sent) {
        setSuccessMsg('QR email sent');
      } else {
        setError(data.reason ?? 'Failed to send QR email');
      }
    } catch {
      setError('Failed to send QR email');
    } finally {
      setResending(false);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const blob = await downloadQr(code, id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}_qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download QR code');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Spinner label="Loading registrant…" />
      </div>
    );
  }

  if (error && !registrant) {
    return (
      <div className="page">
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!registrant) {
    return (
      <div className="page">
        <Alert variant="warning">Registrant not found.</Alert>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{registrant.name}</h1>
          <p className="page-subtitle">
            <Link to={`/admin/departments/${encodeURIComponent(code)}`}>{code}</Link>
            {' · '}
            {registrant.matriculation_number}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleResendQr}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend QR Email'}
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadQr}>
            Download QR
          </button>
        </div>
      </div>

      {error ? (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {successMsg ? (
        <Alert variant="success" onDismiss={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      ) : null}

      <div className="page-card">
        <dl className="form-grid cols-2" style={{ gap: '0.75rem 1.5rem' }}>
          <div>
            <dt className="form-label">Email</dt>
            <dd>{registrant.email}</dd>
          </div>
          <div>
            <dt className="form-label">Phone</dt>
            <dd>{registrant.phone}</dd>
          </div>
          <div>
            <dt className="form-label">Registrant ID</dt>
            <dd>{registrant.id}</dd>
          </div>
        </dl>
      </div>

      <div className="page-card">
        <h2
          className="page-title"
          style={{ fontSize: 'var(--font-headline-md-size)', marginBottom: '1rem' }}
        >
          Attendance history
        </h2>
        {registrant.attendance_days && registrant.attendance_days.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrant.attendance_days.map((day) => {
                const style = STATUS_COLORS[day.status] ?? STATUS_COLORS[0];
                return (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>
                      {editingDate === day.date ? (
                        <select
                          className="form-input"
                          value={editStatus}
                          onChange={(e) => setEditStatus(Number(e.target.value))}
                        >
                          <option value={0}>Absent</option>
                          <option value={1}>Partial</option>
                          <option value={2}>Present</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          {STATUS_LABELS[day.status] ?? 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingDate === day.date ? (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleStatusSave(day.date)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setEditingDate(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleStatusEdit(day.date, day.status)}
                        >
                          Change
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No attendance records yet.</p>
        )}
      </div>
    </div>
  );
}