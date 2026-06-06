import { Alert } from '../../components/Alert';

export function StaffListPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="page-subtitle">Manage staff accounts and admin permissions.</p>
        </div>
      </div>

      <Alert variant="info" title="Coming soon">
        The staff list endpoint (<code>GET /admin/staff</code>) hasn't been
        added to the server yet. Once it lands, this page will show every
        staff account, their verification status, and admin flag.
      </Alert>
    </div>
  );
}
