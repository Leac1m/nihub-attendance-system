import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { createDepartment } from '../../services/adminApi';

export function DepartmentCreatePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createDepartment({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        duration: duration.trim(),
      });
      navigate('/admin/departments', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department');
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">New department</h1>
          <p className="page-subtitle">Add a new program to the system.</p>
        </div>
      </div>

      <div className="page-card" style={{ maxWidth: 560 }}>
        {error ? <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert> : null}
        <form onSubmit={onSubmit} className="form-grid" style={{ marginTop: '1rem' }}>
          <div className="form-row">
            <label htmlFor="code" className="form-label">Code</label>
            <input
              id="code"
              name="code"
              required
              maxLength={20}
              className="form-input"
              placeholder="e.g. CS101"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="form-row">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              name="name"
              required
              maxLength={100}
              className="form-input"
              placeholder="e.g. Computer Science 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="duration" className="form-label">Duration</label>
            <input
              id="duration"
              name="duration"
              maxLength={50}
              className="form-input"
              placeholder="e.g. 12 weeks"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="page-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Spinner label="" /> : 'Create department'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/departments')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
