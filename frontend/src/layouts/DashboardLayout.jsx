import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgePercent,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  QrCode,
  Receipt,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
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
import ThemeToggle from "../components/ui/ThemeToggle";

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const isOnline = useOnlineStatus();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen flex bg-base-100 text-base-content relative overflow-x-hidden">
      {/* Ambient Gold Constellation Particles */}
      <Scene3DBackground opacity={0.22} particleCount={36} color="212, 175, 55" />

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-base-200 border-r border-base-300 shadow-xl transition-all duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-20" : "lg:w-64"} w-72`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-base-300">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-[#d4af37] to-amber-200 flex items-center justify-center shrink-0 shadow-md">
              <Shield className="w-5 h-5 text-black" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-amber-200 via-primary to-amber-500 bg-clip-text text-transparent truncate">
                  Smart Inventory
                </span>
                <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-widest">
                  Enterprise Suite
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="btn btn-ghost btn-sm btn-circle lg:hidden text-base-content/60"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 mobile-touch-scroll">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-base-content/50">
              Operations & Modules
            </div>
          )}

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
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group relative ${
                  isActive
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-300/60"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-black" : "text-base-content/60 group-hover:text-primary"
                  }`}
                />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{item.name}</span>
                    {item.adminOnly && (
                      <span className="badge badge-xs badge-neutral border-base-300 text-[9px] uppercase font-bold">
                        VIP
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer with Collapse Toggle & Profile */}
        <div className="p-3 border-t border-base-300 bg-base-200/80 flex flex-col gap-2">
          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center gap-2 w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-base-content/60 hover:text-base-content hover:bg-base-300/50 transition cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>

          {/* User Profile Mini Bar */}
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-base-300/40 border border-base-300 ${
              collapsed ? "justify-center p-1" : ""
            }`}
          >
            <div className="avatar placeholder shrink-0">
              <div className="bg-primary/20 text-primary border border-primary/40 rounded-xl w-8 h-8 font-bold text-xs flex items-center justify-center">
                <span>{userInitial}</span>
              </div>
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate text-base-content">
                  {user?.first_name || user?.username || "Staff User"}
                </div>
                <div className="text-[10px] text-base-content/50 uppercase font-semibold">
                  {user?.role || "Employee"}
                </div>
              </div>
            )}

            {!collapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost btn-xs btn-circle text-error/80 hover:text-error hover:bg-error/10"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 bg-base-200/85 backdrop-blur-md border-b border-base-300 shadow-sm">
          {/* Left: Mobile hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="btn btn-ghost btn-sm btn-circle lg:hidden text-primary border border-base-300"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <div className="breadcrumbs text-xs font-medium hidden sm:block">
              <ul>
                <li>
                  <Link to="/" className="text-base-content/60 hover:text-primary">
                    Inventory
                  </Link>
                </li>
                <li className="font-bold text-base-content">{pageTitle}</li>
              </ul>
            </div>

            <h1 className="sm:hidden font-bold text-sm tracking-tight text-base-content truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Right: Quick Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Network Status */}
            <div
              title={isOnline ? "Connected to Cloud API" : "Offline Mode"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                isOnline
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-error/10 border-error/30 text-error animate-pulse"
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                  <span className="hidden md:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Date Display */}
            <span className="text-xs text-base-content/60 hidden xl:inline-block font-medium">
              {todayStr}
            </span>

            {/* Guest Demo Indicator */}
            {(user?.is_guest_demo || user?.username === "guest_demo") && (
              <div
                title="Live Guest Demo mode active"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/15 border border-primary/40 text-primary shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span>Guest Demo</span>
              </div>
            )}

            {/* Theme Toggle (Dark / Light) */}
            <ThemeToggle size="sm" />

            {/* Notifications Dropdown */}
            <NotificationDropdown />

            {/* User Profile Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar placeholder border border-base-300 hover:border-primary/50 cursor-pointer"
              >
                <div className="bg-primary/20 text-primary font-bold rounded-full w-9 text-xs">
                  <span>{userInitial}</span>
                </div>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-2xl bg-base-200 border border-base-300 rounded-2xl w-56 mt-2 z-50 text-xs"
              >
                <li className="menu-title px-4 py-2 border-b border-base-300 mb-1">
                  <div className="font-bold text-sm text-base-content">
                    {user?.first_name || user?.username || "Staff User"}
                  </div>
                  <div className="text-[11px] text-base-content/60 font-normal truncate">
                    {user?.email || "staff@smartinventory.com"}
                  </div>
                </li>
                <li>
                  <Link to="/pos" className="py-2.5 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    <span>Launch POS Terminal</span>
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/settings" className="py-2.5 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-base-content/70" />
                      <span>Business Settings</span>
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/notifications" className="py-2.5 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-base-content/70" />
                    <span>Notifications Inbox</span>
                  </Link>
                </li>
                <div className="divider my-1 opacity-40" />
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2.5 text-error flex items-center gap-2 hover:bg-error/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Global Offline Bar Banner */}
        {!isOnline && (
          <div className="w-full bg-error/90 text-white px-4 py-2 text-xs flex items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Network connectivity lost. Local changes are
                queued and telemetry will resume automatically.
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
