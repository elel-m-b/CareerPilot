import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { User, Mail, Calendar, Save, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username) {
      setError('Username cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const updated = await authApi.updateProfile(username);
      updateUser(updated);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Account Profile</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Manage your user credentials and account details.
              </p>
            </div>

            <ErrorMessage message={error} />

            {success && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.9rem',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#ffffff'
                }}>
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{user?.username}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ paddingLeft: '2.75rem' }}
                      required
                    />
                    <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Read-only)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      disabled
                      style={{ paddingLeft: '2.75rem', opacity: 0.6, cursor: 'not-allowed' }}
                    />
                    <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {user?.createdAt && (
                  <div className="form-group">
                    <label className="form-label">Member Since</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={new Date(user.createdAt).toLocaleDateString()}
                        disabled
                        style={{ paddingLeft: '2.75rem', opacity: 0.6, cursor: 'not-allowed' }}
                      />
                      <Calendar size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ marginTop: '1rem', padding: '0.8rem 1.5rem' }}
                >
                  <Save size={18} />
                  {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
