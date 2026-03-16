import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import ATCLogo from '../branding/ATCLogo';
import './WorkspaceLayout.css';

/* ─────────────────────────────────────────────────────────────────────────────
   WorkspaceLayout — sidebar-free layout for workspace-scoped module pages.
   Shows a slim top navbar with:
     · ATC Capital logo (→ console)
     · Active workspace name + org context
     · Production badge
     · Module quick-nav links
     · Profile / sign-out dropdown
   No sidebar. Full-width content area.
───────────────────────────────────────────────────────────────────────────── */

const WorkspaceLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { activeWorkspace } = useEnterprise();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const wsName = activeWorkspace?.name || 'Workspace';

  return (
    <div className="ws-layout">

      {/* ── TOP NAVBAR ───────────────────────────────────────────── */}
      <header className="ws-topnav">
        <div className="ws-topnav-left">
          {/* Logo → back to console */}
          <button
            className="ws-logo-btn"
            onClick={() => navigate('/app/console')}
            title="Back to Console"
          >
            <ATCLogo variant="dark" size="small" withText={false} />
          </button>

          {/* Breadcrumb context */}
          <div className="ws-context">
            <button
              className="ws-context-console"
              onClick={() => navigate('/app/console')}
              title="All Workspaces"
            >
              Console
            </button>
            <span className="ws-context-sep">›</span>
            <span className="ws-context-ws">{wsName}</span>
            <span className="ws-env-badge">Production</span>
          </div>
        </div>

        <div className="ws-topnav-right">
          {/* Profile */}
          <div className="ws-profile" ref={profileRef}>
            <button
              className="ws-avatar-btn"
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Profile menu"
            >
              {userInitial}
            </button>
            {profileOpen && (
              <div className="ws-dropdown">
                <div className="ws-dropdown-header">
                  <div className="ws-dropdown-avatar">{userInitial}</div>
                  <div>
                    <div className="ws-dropdown-name">{user?.name || 'User'}</div>
                    <div className="ws-dropdown-email">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="ws-dropdown-divider" />
                <div className="ws-dropdown-ws-row">
                  <span className="ws-dropdown-ws-label">Workspace</span>
                  <span className="ws-dropdown-ws-name">{wsName}</span>
                </div>
                <button
                  className="ws-dropdown-item"
                  onClick={() => { setProfileOpen(false); navigate('/app/console'); }}
                >
                  ← Switch Workspace
                </button>
                <div className="ws-dropdown-divider" />
                <button
                  className="ws-dropdown-item"
                  onClick={() => { setProfileOpen(false); navigate('/app/settings/security'); }}
                >
                  Security
                </button>
                <button
                  className="ws-dropdown-item"
                  onClick={() => { setProfileOpen(false); navigate('/app/support/help'); }}
                >
                  Help Center
                </button>
                <div className="ws-dropdown-divider" />
                <button
                  className="ws-dropdown-item ws-dropdown-logout"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ─────────────────────────────────────────── */}
      <main className="ws-main">
        {children}
      </main>
    </div>
  );
};

export default WorkspaceLayout;
