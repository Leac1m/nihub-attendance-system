import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { Alert } from '../../components/Alert';
import {
  listRegistrants,
  updateRegistrant,
  deleteRegistrant,
  createRegistrant,
  type Registrant,
  type CreateRegistrantPayload,
} from '../../services/adminApi';

interface EditForm {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export function RegistrantListPage() {
  const { code = '' } = useParams();
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ id: '', name: '', email: '', phone: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<CreateRegistrantPayload>({
    name: '',
    email: '',
    phone: '',
    matriculation_number: '',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadRegistrants = () => {
    setLoading(true);
    setError(null);
    listRegistrants(code)
      .then(({ data }) => {
        if (mountedRef.current) setRegistrants(data.registrants ?? []);
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load registrants');
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  };

  useEffect(() => {
    mountedRef.current = true;
    loadRegistrants();
    return () => {
      mountedRef.current = false;
    };
  }, [code]);

  const handleEditStart = (r: Registrant) => {
    setEditingId(r.id);
    setEditForm({ id: r.id, name: r.name, email: r.email, phone: r.phone });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ id: '', name: '', email: '', phone: '' });
  };

  const handleEditSave = async () => {
    try {
      await updateRegistrant(code, editForm.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
      });
      setEditingId(null);
      setSuccessMsg('Registrant updated');
      loadRegistrants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registrant');
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteRegistrant(code, id);
      setDeleteConfirmId(null);
      setSuccessMsg('Registrant deleted');
      loadRegistrants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete registrant');
    }
  };

  const handleAddSave = async () => {
    try {
      await createRegistrant(code, addForm);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', matriculation_number: '' });
      setSuccessMsg('Registrant created');
      loadRegistrants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create registrant');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registrants — {code}</h1>
          <p className="page-subtitle">{registrants.length} registered.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          Add Registrant
        </button>
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

      {loading ? (
        <Spinner label="Loading registrants…" />
      ) : registrants.length === 0 ? (
        <div className="page-card">No registrants for this department yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Matric</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrants.map((r, idx) => (
              <tr key={r.id}>
                <td>{idx + 1}</td>
                {editingId === r.id ? (
                  <>
                    <td>
                      <input
                        className="form-input"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                  </>
                )}
                <td>{r.matriculation_number}</td>
                <td>
                  {editingId === r.id ? (
                    <>
                      <button className="btn btn-primary" onClick={handleEditSave}>
                        Save
                      </button>
                      <button className="btn btn-secondary" onClick={handleEditCancel}>
                        Cancel
                      </button>
                    </>
                  ) : deleteConfirmId === r.id ? (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleDeleteConfirm(r.id)}
                      >
                        Confirm
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/admin/departments/${encodeURIComponent(code)}/registrants/${encodeURIComponent(r.id)}`}
                        className="btn btn-secondary"
                      >
                        View
                      </Link>
                      <button className="btn btn-secondary" onClick={() => handleEditStart(r)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setDeleteConfirmId(r.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="page-title">Add Registrant</h2>
            <div className="form-stack">
              <label className="form-label">
                Name
                <input
                  className="form-input"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </label>
              <label className="form-label">
                Email
                <input
                  className="form-input"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </label>
              <label className="form-label">
                Phone
                <input
                  className="form-input"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </label>
              <label className="form-label">
                Matriculation Number
                <input
                  className="form-input"
                  value={addForm.matriculation_number}
                  onChange={(e) =>
                    setAddForm({ ...addForm, matriculation_number: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleAddSave}>
                Create
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}