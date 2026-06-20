import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { Search, ShieldAlert, Check, UserMinus, UserCheck, RefreshCw, Trash2 } from 'lucide-react';
import CustomSelect from '../Common/CustomSelect';

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
      setError(getFriendlyErrorMessage(err));
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
      const results = await api.admin.searchUsers({ email: searchTerm, displayName: searchTerm });
      setUsers(results || []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
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
      setError(getFriendlyErrorMessage(err));
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
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (email, displayName) => {
    const confirmed = window.confirm(`Are you absolutely sure you want to delete user ${displayName} (${email})? This action is permanent and cannot be undone.`);
    if (!confirmed) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.admin.deleteUser(email);
      setSuccess(`User ${displayName} has been successfully deleted.`);
      setTimeout(() => setSuccess(''), 4000);
      fetchUsers();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            User Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Review profiles, adjust role assignments, and toggle active logins.
          </p>
        </div>
        <button 
          onClick={fetchUsers} 
          className="velora-btn velora-btn-secondary" 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          Refresh Users
        </button>
      </div>

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)' }}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={styles.searchBar}>
          <div style={styles.inputContainer}>
            <Search size={18} color="var(--text-secondary)" style={{ marginLeft: '16px' }} />
            <input
              type="text"
              className="velora-input"
              placeholder="Search by email or display name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '12px 16px', boxShadow: 'none' }}
            />
          </div>
          <button type="submit" className="velora-btn velora-btn-primary" style={{ padding: '0 28px', height: '48px' }} disabled={loading}>
            Search
          </button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>Loading user base...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>No users matched the criteria.</p>
        ) : (
          <div className="table-container" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <table className="velora-table">
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
                    <td>
                      <strong style={{ color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                        {u.displayName || 'Unnamed User'}
                      </strong>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <CustomSelect
                        className="velora-input"
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.email, e.target.value)}
                        disabled={submitting || u.role === 'ADMIN'}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.85rem', 
                          background: '#FFFFFF', 
                          border: '1px solid var(--sky-blue-light)',
                          cursor: 'pointer',
                          borderRadius: '12px',
                          width: 'auto',
                          display: 'inline-block',
                          height: 'auto'
                        }}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="LAUNDRY_PARTNER">Laundry Partner</option>
                        <option value="DELIVERY_PARTNER">Delivery Partner</option>
                        <option value="ADMIN" disabled>Admin</option>
                      </CustomSelect>
                    </td>
                    <td>
                      {u.active ? (
                        <span className="velora-badge velora-badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} /> Active
                        </span>
                      ) : (
                        <span className="velora-badge velora-badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserMinus size={12} /> Deactivated
                        </span>
                      )}
                    </td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleToggleStatus(u.email, u.active)}
                            className={`velora-btn ${u.active ? 'velora-btn-secondary' : 'velora-btn-primary'}`}
                            disabled={submitting}
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              height: 'auto',
                              borderColor: u.active ? '#F87171' : undefined,
                              color: u.active ? '#EF4444' : undefined,
                              background: u.active ? '#FEF2F2' : undefined,
                            }}
                          >
                            {u.active ? (
                              <>
                                <UserMinus size={14} /> Block
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} /> Activate
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(u.email, u.displayName)}
                            className="velora-btn velora-btn-primary"
                            disabled={submitting}
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              height: 'auto',
                              borderColor: '#DC2626',
                              color: '#FFFFFF',
                              background: '#DC2626',
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
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
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '16px',
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    borderRadius: '16px',
    minWidth: '280px',
  },
};

