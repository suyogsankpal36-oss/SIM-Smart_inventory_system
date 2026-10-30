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
  Info,
  Package,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import notificationService from "../services/notificationService";
import { Badge, Button, Card, StatsCard } from "../components/ui";

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical Urgency",
    badge: "badge-error",
    icon: AlertCircle,
  },
  warning: {
    label: "Stock Advisory",
    badge: "badge-warning",
    icon: AlertTriangle,
  },
  info: {
    label: "System Event",
    badge: "badge-primary",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Live Telemetry & Notifications
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Realtime supply chain alerts, zero-inventory emergencies, threshold breaches, and audit triggers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchNotifications(true)}
            loading={refreshing}
          >
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCheck}
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleClearRead}
          >
            Clear Read
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Alerts"
          value={totalCount}
          icon={Bell}
          color="primary"
          description="Active feed events"
        />
        <StatsCard
          title="Unread Warnings"
          value={unreadCount}
          icon={Clock}
          color="secondary"
          description="Awaiting review"
        />
        <StatsCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={AlertCircle}
          color="error"
          description="Zero-stock emergencies"
        />
        <StatsCard
          title="Low Stock Reorders"
          value={lowStockCount}
          icon={Package}
          color="primary"
          description="Near depletion"
        />
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "all", label: "All Telemetry" },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "stock", label: "Stock Alerts" },
              { id: "system", label: "System Triggers" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-xs ${
                  activeTab === tab.id ? "btn-primary font-bold shadow-sm" : "btn-ghost"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 bg-base-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="select select-bordered select-sm bg-base-100"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications Feed */}
      {loading ? (
        <Card className="py-20 text-center">
          <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Retrieving notification log...</p>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="py-16 text-center">
          <BellOff size={40} className="text-base-content/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-base-content">All caught up</h3>
          <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
            No active notification alerts match your selected filter criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const sev = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.info;
            const Icon = sev.icon;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  n.is_read
                    ? "bg-base-100 border-base-content/10 opacity-75"
                    : "bg-base-200/50 border-primary/30 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.severity === "critical"
                      ? "bg-error/15 text-error border border-error/30"
                      : n.severity === "warning"
                      ? "bg-warning/15 text-warning border border-warning/30"
                      : "bg-primary/15 text-primary border border-primary/30"
                  }`}>
                    <Icon size={18} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-base-content">{n.title}</h4>
                      <span className={`badge ${sev.badge} badge-xs font-semibold`}>
                        {sev.label}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-base-content/50 mt-1.5 font-mono">
                      <span>{formatDate(n.created_at)}</span>
                      {n.link && (
                        <button
                          onClick={() => navigate(n.link)}
                          className="link link-primary inline-flex items-center gap-0.5 font-sans"
                        >
                          View Related <ArrowUpRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-xs"
                      onClick={() => handleMarkRead(n)}
                      title="Mark as read"
                    >
                      <Check size={13} className="mr-1" />
                      Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-xs btn-square text-error hover:bg-error/10"
                    onClick={() => handleDelete(n.id)}
                    title="Delete notification"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
