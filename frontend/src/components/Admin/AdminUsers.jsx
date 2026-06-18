import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, ShieldAlert, Check, UserMinus, UserCheck, RefreshCw } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      setUsers(data || []);
    } catch (err) {
      setError('Failed to fetch system users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchUsers();
      return;
    }
    setLoading(true);
    try {
      // Search email or name
      const results = await api.admin.searchUsers({ email: searchTerm, displayName: searchTerm });
      setUsers(results || []);
    } catch (err) {
      setError('Search query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (email, currentStatus) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.admin.updateUserStatus(email, !currentStatus);
      setSuccess(`User status updated successfully!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Status update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (email, newRole) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.admin.updateUserRole(email, newRole);
      setSuccess(`User role updated to ${newRole}!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Role change failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>User Directory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review profiles, adjust role assignments, and toggle active logins.</p>
        </div>
        <button onClick={fetchUsers} className="btn btn-outline" disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Users
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="glass-card">
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={styles.searchBar}>
          <div style={styles.inputContainer}>
            <Search size={18} color="var(--text-muted)" style={{ marginLeft: '12px' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by email or display name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '10px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }} disabled={loading}>
            Search
          </button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Loading user base...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No users matched the criteria.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td><strong>{u.displayName || 'Unnamed'}</strong></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <select
                        className="form-control"
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.email, e.target.value)}
                        disabled={submitting || u.role === 'ADMIN'}
                        style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="LAUNDRY_PARTNER">Laundry Partner</option>
                        <option value="DELIVERY_PARTNER">Delivery Partner</option>
                        <option value="ADMIN" disabled>Admin</option>
                      </select>
                    </td>
                    <td>
                      {u.active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-error">Deactivated</span>
                      )}
                    </td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u.email, u.active)}
                          className={u.active ? 'btn btn-outline' : 'btn btn-primary'}
                          disabled={submitting}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: u.active ? 'rgba(239, 68, 68, 0.1)' : undefined,
                            borderColor: u.active ? 'rgba(239, 68, 68, 0.3)' : undefined,
                            color: u.active ? 'var(--color-error)' : undefined,
                          }}
                        >
                          {u.active ? (
                            <>
                              <UserMinus size={12} /> Block
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} /> Activate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  searchBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
  },
};
