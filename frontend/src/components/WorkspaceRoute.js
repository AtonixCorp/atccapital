import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEnterprise } from '../context/EnterpriseContext';

/**
 * WorkspaceRoute — guards workspace-scoped routes.
 * Requires the user to be authenticated AND have an active workspace selected.
 * If no workspace is active, redirects to /app/console so the user can pick one.
 *
 * NOTE: React state updates from setActiveWorkspace() are asynchronous, so on
 * the very first render after navigation the context value may still be null
 * even though it was just set. We fall back to localStorage (which is written
 * synchronously by setActiveWorkspace) to avoid a false redirect back to the
 * console on that initial render.
 */
const WorkspaceRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { activeWorkspace } = useEnterprise();
  const location = useLocation();

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

  // Check context first; fall back to localStorage for the render that fires
  // immediately after navigate() before the React state update has propagated.
  const hasWorkspace = !!activeWorkspace || (() => {
    try { return !!localStorage.getItem('atc_active_workspace'); } catch { return false; }
  })();

  if (!hasWorkspace) {
    return <Navigate to="/app/console" state={{ from: location }} replace />;
  }

  return children;
};

export default WorkspaceRoute;
