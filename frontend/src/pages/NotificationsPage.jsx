import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Filter,
  Info,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import notificationService from "../services/notificationService";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical Urgency",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    text: "#f87171",
    icon: AlertCircle,
  },
  warning: {
    label: "Stock Advisory",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    text: "#fde68a",
    icon: AlertTriangle,
  },
  info: {
    label: "System Event",
    bg: "rgba(212, 175, 55, 0.15)",
    border: "rgba(212, 175, 55, 0.4)",
    text: "#F7DF8F",
    icon: Info,
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState("all"); // all, unread, stock, system
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, search, severityFilter]);

  const fetchNotifications = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (severityFilter) params.severity = severityFilter;

      if (activeTab === "unread") {
        params.is_read = "false";
      } else if (activeTab === "system") {
        params.notification_type = "system";
      }

      const data = await notificationService.getNotifications(params);
      let items = Array.isArray(data) ? data : data.results || [];

      if (activeTab === "stock") {
        items = items.filter(
          (n) => n.notification_type === "low_stock" || n.notification_type === "out_of_stock"
        );
      }

      setNotifications(items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkRead = async (notif) => {
    try {
      await notificationService.markRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      toast.success("Notification marked as read.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notification.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read.");
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationService.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast.success("Read notifications cleared.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear notifications.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notification.");
    }
  };

  // Metrics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const outOfStockCount = notifications.filter((n) => n.notification_type === "out_of_stock").length;
  const lowStockCount = notifications.filter((n) => n.notification_type === "low_stock").length;

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-8 pb-14 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <Bell size={14} className="text-[#d4af37]" />
            Operational Alerts & Activity Feed
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Live Telemetry & Notifications
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Realtime supply chain alerts, zero-inventory emergencies, threshold breaches, and audit triggers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            icon={RefreshCw}
            className={refreshing ? "opacity-75" : ""}
          >
            {refreshing ? "Syncing..." : "Refresh"}
          </Button3D>

          {unreadCount > 0 && (
            <Button3D
              variant="gold"
              onClick={handleMarkAllRead}
              icon={CheckCheck}
            >
              Mark All Read
            </Button3D>
          )}

          <Button3D
            variant="dark"
            onClick={handleClearRead}
            icon={Trash2}
          >
            Clear Read
          </Button3D>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Alerts</span>
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Bell size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-white tracking-tight">{totalCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Active feed events
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Unread Warnings</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">{unreadCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Awaiting acknowledgement
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Out of Stock</span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-rose-400 tracking-tight">{outOfStockCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              Zero-inventory emergencies
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Low Stock Reorders</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Package size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-blue-300 tracking-tight">{lowStockCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Near threshold depletion
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: "all", label: "All Telemetry" },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "stock", label: "Stock Alerts" },
            { id: "system", label: "System Triggers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#d4af37] text-black shadow-[0_2px_12px_rgba(212,175,55,0.4)]"
                  : "bg-black/40 border border-[#d4af37]/20 text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Severity Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="" className="bg-[#12141c]">All Severities</option>
            <option value="critical" className="bg-[#12141c]">Critical Only</option>
            <option value="warning" className="bg-[#12141c]">Warnings Only</option>
            <option value="info" className="bg-[#12141c]">Info Only</option>
          </select>
        </div>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="card-3d p-20 rounded-2xl border border-[#d4af37]/20 flex flex-col items-center justify-center">
          <RefreshCw size={32} className="animate-spin text-[#d4af37] mb-3" />
          <p className="text-sm text-neutral-400">Retrieving notification log...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-3d p-16 rounded-2xl border border-[#d4af37]/20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mx-auto mb-3">
            <BellOff size={30} />
          </div>
          <h3 className="text-base font-bold text-neutral-200">No Notifications in Feed</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Your inventory is healthy and all system telemetry channels report optimal operating parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((notif) => {
            const sev = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
            const SevIcon = sev.icon;

            return (
              <div
                key={notif.id}
                className={`card-3d rounded-2xl p-5 border transition-all duration-200 relative group overflow-hidden ${
                  !notif.is_read
                    ? "bg-[#12141c] border-l-4 border-l-[#d4af37] border-y-[#d4af37]/40 border-r-[#d4af37]/40 shadow-[0_10px_30px_rgba(212,175,55,0.08)]"
                    : "bg-[#0d0e15] border-white/5 opacity-85 hover:opacity-100 hover:border-[#d4af37]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Severity Icon Indicator */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: sev.bg,
                        border: `1px solid ${sev.border}`,
                        color: sev.text,
                      }}
                    >
                      <SevIcon size={18} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-white tracking-tight">
                          {notif.title}
                        </h4>

                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: sev.bg,
                            border: `1px solid ${sev.border}`,
                            color: sev.text,
                          }}
                        >
                          {sev.label}
                        </span>

                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          {formatDate(notif.created_at)}
                        </span>
                        {notif.link && (
                          <button
                            onClick={() => navigate(notif.link)}
                            className="text-[#d4af37] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Inspect Resource</span>
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif)}
                        className="p-2 rounded-xl bg-black/40 border border-[#d4af37]/30 text-neutral-300 hover:text-amber-300 hover:bg-[#d4af37]/10 transition"
                        title="Acknowledge & Mark Read"
                      >
                        <Check size={15} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 rounded-xl bg-black/40 border border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                      title="Dismiss & Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
