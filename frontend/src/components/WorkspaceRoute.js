import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEnterprise } from '../context/EnterpriseContext';

/**
 * WorkspaceRoute — guards workspace-scoped routes.
 * Requires authentication AND a resolvable workspace for the URL :workspaceId.
 * Also syncs activeWorkspace from the entities list if context is stale/null.
 */
const WorkspaceRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { activeWorkspace, entities } = useEnterprise();
  const location = useLocation();
  const { workspaceId } = useParams();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size-base)',
        color: 'var(--color-silver-dark)',
        background: 'var(--color-silver-very-light)',
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Resolve the workspace for this URL
  let resolvedWorkspace = null;

  if (workspaceId) {
    // 1. Active context matches URL
    if (activeWorkspace && String(activeWorkspace.id) === String(workspaceId)) {
      resolvedWorkspace = activeWorkspace;
    }
    // 2. Find it in the already-loaded entities list
    if (!resolvedWorkspace) {
      resolvedWorkspace = (entities || []).find(e => String(e.id) === String(workspaceId)) || null;
    }
    // 3. Fall back to localStorage snapshot
    if (!resolvedWorkspace) {
      try {
        const saved = localStorage.getItem('atc_active_workspace');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(workspaceId)) resolvedWorkspace = parsed;
        }
      } catch { /* ignore */ }
    }
  } else {
    // No workspaceId in URL — accept whatever is active
    resolvedWorkspace = activeWorkspace || (() => {
      try {
        const saved = localStorage.getItem('atc_active_workspace');
        return saved ? JSON.parse(saved) : null;
      } catch { return null; }
    })();
  }

  if (!resolvedWorkspace) {
    return <Navigate to="/app/console" state={{ from: location }} replace />;
  }

  return children;
};

export default WorkspaceRoute;
