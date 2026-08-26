import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Upload, History, User, LogOut } from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Resumes', path: '/resumes', icon: FileText },
    { label: 'Upload Resume', path: '/resumes/upload', icon: Upload },
    { label: 'Analysis History', path: '/history', icon: History },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(11, 16, 26, 0.95)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 'calc(100vh - 73px)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em', padding: '0 0.75rem 0.5rem 0.75rem', fontWeight: 700 }}>
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                fontSize: '0.925rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              })}
            >
              <Icon size={18} color={item.path === window.location.pathname ? 'var(--primary-500)' : 'currentColor'} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="sidebar-link"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.8rem 1rem',
          borderRadius: '10px',
          fontSize: '0.925rem',
          fontWeight: 500,
          color: '#fb7185',
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          cursor: 'pointer',
          marginTop: '1.5rem',
          width: '100%',
        }}
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
