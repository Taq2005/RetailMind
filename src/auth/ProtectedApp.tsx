import { Navigate, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceProvider } from "@/data/workspace/WorkspaceContext";
import { useAuth } from "./AuthContext";

export function ProtectedApp() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500" aria-busy="true">Loading your workspace…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <WorkspaceProvider key={user.id}>
      <AppShell />
    </WorkspaceProvider>
  );
}
