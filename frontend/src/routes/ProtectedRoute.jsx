import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#4b5563", fontSize: "1.1rem" }}>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={{ padding: "3rem", maxWidth: "600px", margin: "4rem auto", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>403 — Access Restricted</h2>
        <p style={{ color: "#4b5563", marginBottom: "1.5rem" }}>
          Your current role (<strong>{role.toUpperCase()}</strong>) does not have permission to view this section.
        </p>
        <a href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>Return to Overview</a>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
