import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgePercent,
  Bell,
  Boxes,
  FileSpreadsheet,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  QrCode,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  Truck,
  User,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import NotificationDropdown from "../components/NotificationDropdown";
import Scene3DBackground from "../components/3d/Scene3DBackground";

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const isOnline = useOnlineStatus();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "POS Terminal", path: "/pos", icon: ShoppingCart },
    { name: "Products", path: "/products", icon: Package },
    { name: "Categories", path: "/categories", icon: Layers },
    { name: "Inventory", path: "/inventory", icon: Boxes },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Suppliers", path: "/suppliers", icon: Truck },
    { name: "Orders", path: "/orders", icon: Receipt },
    { name: "Invoices", path: "/invoices", icon: FileSpreadsheet },
    { name: "Notifications", path: "/notifications", icon: Bell },
    ...(isAdmin || user?.role === "manager"
      ? [
          { name: "Barcodes & Labels", path: "/barcodes", icon: QrCode },
          { name: "Expenses", path: "/expenses", icon: BadgePercent },
          { name: "Reports", path: "/reports", icon: TrendingUp },
        ]
      : []),
    ...(isAdmin
      ? [
          { name: "Staff & Users", path: "/employees", icon: UserCheck, adminOnly: true },
          { name: "Audit Trail", path: "/audit-logs", icon: History, adminOnly: true },
          { name: "Settings", path: "/settings", icon: Settings, adminOnly: true },
        ]
      : []),
  ];

  const currentNav = navItems.find((item) =>
    item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNav ? currentNav.name : "Smart Inventory";

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={styles.layoutContainer}>
      {/* Ambient Gold Constellation Background */}
      <Scene3DBackground opacity={0.28} particleCount={36} color="212, 175, 55" />

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div style={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={styles.sidebar}
        className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}
      >
        {/* Brand Header with Floating Gold Shield */}
        <div style={styles.brandHeader}>
          <div style={styles.brandLogo} className="wobble-3d">
            <Shield size={22} color="#0c0e14" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
          </div>
          <div style={styles.brandInfo}>
            <span style={styles.brandName} className="text-gradient-gold">Smart Inventory</span>
            <span style={styles.brandTag}>Dark Gold Edition</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            style={styles.closeBtn}
            className="mobile-close-btn"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items List with Hover & Active Extrusion */}
        <nav style={styles.navContainer}>
          <div style={styles.navSectionLabel}>EXECUTIVE MODULES</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className="table-row-3d"
                style={{
                  ...styles.navLink,
                  background: isActive
                    ? "linear-gradient(135deg, rgba(212, 175, 55, 0.22) 0%, rgba(153, 101, 21, 0.12) 100%)"
                    : "transparent",
                  color: isActive ? "#f7df8f" : "#a39d91",
                  fontWeight: isActive ? "700" : "500",
                  transform: isActive ? "translate3d(0, -1px, 6px)" : "translate3d(0, 0, 0)",
                  boxShadow: isActive
                    ? "0 4px 14px rgba(0, 0, 0, 0.6), 0 0 12px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 240, 180, 0.35)"
                    : "none",
                  borderLeft: isActive ? "3px solid #d4af37" : "3px solid transparent",
                }}
              >
                <Icon
                  size={18}
                  color={isActive ? "#d4af37" : "#878072"}
                  style={{
                    flexShrink: 0,
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                />
                <span>{item.name}</span>
                {item.adminOnly && (
                  <span style={styles.adminPill} className="badge-3d-gold">VIP</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Pill with Extruded Medallion */}
        <div style={styles.userFooter}>
          <div style={styles.userCard} className="card-3d">
            <div style={styles.userAvatar}>
              {(user?.first_name?.[0] || user?.username?.[0] || "U").toUpperCase()}
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>
                {user?.get_full_name || user?.username || "User"}
              </span>
              <span style={styles.userRoleBadge} className="badge-3d-gold">
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={styles.logoutIconBtn}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} color="#d4af37" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.mainWrapper}>
        {/* Top Navbar with Glassmorphic Elevation */}
        <header style={styles.topNavbar} className="card-3d-glass app-top-navbar">
          <div style={styles.navbarLeft}>
            <button
              onClick={() => setMobileOpen(true)}
              className="mobile-hamburger-btn"
              aria-label="Open navigation menu"
            >
              <Menu size={20} color="#d4af37" />
            </button>
            <div style={styles.breadcrumb}>
              <h2 style={styles.breadcrumbTitle} className="text-gradient-gold">{pageTitle}</h2>
            </div>
          </div>

          <div style={styles.navbarRight}>
            {/* Live Network Connectivity Badge */}
            <div
              title={isOnline ? "System connected to network" : "Internet disconnected (Offline Mode)"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all ${
                isOnline
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/15 border border-rose-500/40 text-rose-300 animate-pulse"
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="hide-on-mobile">Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-rose-400" />
                  <span>Offline</span>
                </>
              )}
            </div>

            <div style={styles.dateBadge} className="badge-3d hide-on-mobile">
              <span>📅 {todayStr}</span>
            </div>

            <NotificationDropdown />

            <div style={styles.navUserGreeting} className="badge-3d-gold">
              <User size={15} color="#d4af37" />
              <span>{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Global Offline Bar */}
        {!isOnline && (
          <div className="w-full bg-rose-950/80 border-b border-rose-500/30 text-rose-200 px-4 py-2 text-xs flex items-center justify-between gap-2 backdrop-blur-md z-30">
            <div className="flex items-center gap-2">
              <WifiOff size={14} className="text-rose-400 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Internet disconnected. You can browse cached modules; new records will sync once reconnected.
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Page Content in Perspective Viewport */}
        <main style={styles.contentArea} className="app-content-area">
          <div key={location.pathname} className="perspective-page-viewport">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  layoutContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#0a0b10",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#f5f3ef",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(4px)",
    zIndex: 40,
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#0d0f17",
    borderRight: "1px solid rgba(212, 175, 55, 0.22)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    zIndex: 50,
    boxShadow: "4px 0 24px rgba(0, 0, 0, 0.6)",
  },
  brandHeader: {
    padding: "1.25rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    borderBottom: "1px solid rgba(212, 175, 55, 0.18)",
  },
  brandLogo: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #f7df8f 0%, #d4af37 60%, #b38210 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
  },
  brandInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: "0.9375rem",
    fontWeight: "800",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    letterSpacing: "0.02em",
  },
  brandTag: {
    fontSize: "0.6875rem",
    color: "#998f7e",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#d4af37",
    cursor: "pointer",
  },
  navContainer: {
    padding: "1rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    flex: 1,
    overflowY: "auto",
  },
  navSectionLabel: {
    fontSize: "0.65rem",
    fontWeight: "800",
    color: "#8c7847",
    letterSpacing: "0.08em",
    padding: "0.5rem 0.5rem 0.25rem 0.5rem",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.65rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    textDecoration: "none",
    transition: "all 0.15s ease",
  },
  adminPill: {
    marginLeft: "auto",
    fontSize: "0.6rem",
    fontWeight: "800",
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
  },
  userFooter: {
    padding: "1rem 0.75rem",
    borderTop: "1px solid rgba(212, 175, 55, 0.15)",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    padding: "0.55rem 0.75rem",
    backgroundColor: "#131622",
    borderRadius: "10px",
    border: "1px solid rgba(212, 175, 55, 0.25)",
  },
  userAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f7df8f 0%, #d4af37 100%)",
    color: "#0c0d12",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "0.875rem",
    flexShrink: 0,
    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: "0.8125rem",
    fontWeight: "700",
    color: "#f5f3ef",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRoleBadge: {
    fontSize: "0.6rem",
    fontWeight: "800",
    padding: "0.1rem 0.35rem",
    borderRadius: "4px",
    width: "fit-content",
    marginTop: "2px",
  },
  logoutIconBtn: {
    background: "rgba(212, 175, 55, 0.1)",
    border: "1px solid rgba(212, 175, 55, 0.25)",
    padding: "6px",
    cursor: "pointer",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  topNavbar: {
    height: "64px",
    backgroundColor: "rgba(13, 15, 23, 0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(212, 175, 55, 0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.75rem",
    position: "sticky",
    top: 0,
    zIndex: 30,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  },
  navbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  hamburgerBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#d4af37",
    display: "none",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
  },
  breadcrumbTitle: {
    fontSize: "1.2rem",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "0.01em",
  },
  navbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  dateBadge: {
    fontSize: "0.75rem",
    color: "#d4af37",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    border: "1px solid rgba(212, 175, 55, 0.25)",
    padding: "0.35rem 0.75rem",
    borderRadius: "8px",
    fontWeight: "600",
  },
  navUserGreeting: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    fontSize: "0.8125rem",
    fontWeight: "700",
    padding: "0.35rem 0.75rem",
    borderRadius: "8px",
  },
  contentArea: {
    padding: "1.75rem",
    flex: 1,
  },
};
