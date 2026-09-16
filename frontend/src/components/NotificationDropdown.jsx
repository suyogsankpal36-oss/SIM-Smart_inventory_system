import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronRight,
  Info,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import notificationService from "../services/notificationService";

export default function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();

    // Polling interval (every 30 seconds for live stock alerts)
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      // Silently ignore background polling errors
    }
  };

  const handleToggle = async () => {
    if (!isOpen) {
      setIsOpen(true);
      setLoading(true);
      try {
        const data = await notificationService.getNotifications({ page_size: 5 });
        setNotifications(Array.isArray(data) ? data : data.results || []);
        fetchUnreadCount();
      } catch (err) {
        console.error("Failed to fetch recent notifications:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark notifications as read.");
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markRead(notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }

    setIsOpen(false);

    // If stock alert, deep link to inventory
    if (notif.notification_type === "low_stock" || notif.notification_type === "out_of_stock") {
      navigate("/inventory");
    } else {
      navigate("/notifications");
    }
  };

  const getIcon = (type, severity) => {
    if (type === "out_of_stock" || severity === "critical") {
      return <AlertCircle size={16} color="#dc2626" />;
    }
    if (type === "low_stock" || severity === "warning") {
      return <AlertTriangle size={16} color="#d97706" />;
    }
    if (type === "sales") {
      return <TrendingUp size={16} color="#16a34a" />;
    }
    return <Info size={16} color="#2563eb" />;
  };

  const getIconBg = (type, severity) => {
    if (type === "out_of_stock" || severity === "critical") return "#fef2f2";
    if (type === "low_stock" || severity === "warning") return "#fffbeb";
    if (type === "sales") return "#f0fdf4";
    return "#eff6ff";
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffSecs = Math.floor((now - past) / 1000);

      if (diffSecs < 60) return "Just now";
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        style={{
          ...styles.bellBtn,
          backgroundColor: isOpen ? "#f1f5f9" : "transparent",
        }}
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={20} color={unreadCount > 0 ? "#1e293b" : "#64748b"} />
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTitleRow}>
              <span style={styles.headerTitle}>Notifications</span>
              {unreadCount > 0 && (
                <span style={styles.unreadCountChip}>{unreadCount} unread</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={styles.markAllBtn}
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div style={styles.listArea}>
            {loading ? (
              <div style={styles.emptyNotice}>
                <span style={styles.mutedText}>Loading alerts...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={styles.emptyNotice}>
                <div style={styles.sparkleCircle}>
                  <Sparkles size={20} color="#16a34a" />
                </div>
                <span style={{ fontWeight: "600", color: "#0f172a", fontSize: "0.875rem" }}>
                  All Caught Up!
                </span>
                <span style={styles.mutedText}>
                  No active stock alerts or system notices.
                </span>
              </div>
            ) : (
              notifications.map((notif) => {
                const bg = getIconBg(notif.notification_type, notif.severity);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      ...styles.item,
                      backgroundColor: notif.is_read ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        ...styles.iconBox,
                        backgroundColor: bg,
                      }}
                    >
                      {getIcon(notif.notification_type, notif.severity)}
                    </div>

                    <div style={styles.itemContent}>
                      <div style={styles.itemTitleRow}>
                        <span
                          style={{
                            ...styles.itemTitle,
                            fontWeight: notif.is_read ? "500" : "700",
                          }}
                        >
                          {notif.title}
                        </span>
                        <span style={styles.timeTag}>
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p style={styles.itemMessage}>{notif.message}</p>
                    </div>

                    {!notif.is_read && <div style={styles.unreadDot} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={styles.viewAllLink}
            >
              <span>View all notifications</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    display: "inline-block",
  },
  bellBtn: {
    position: "relative",
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.45rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s ease",
  },
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontSize: "0.625rem",
    fontWeight: "700",
    borderRadius: "10px",
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    boxShadow: "0 0 0 2px #ffffff",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    width: "360px",
    maxWidth: "90vw",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
    zIndex: 100,
    overflow: "hidden",
  },
  header: {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  headerTitle: {
    fontSize: "0.9375rem",
    fontWeight: "700",
    color: "#0f172a",
  },
  unreadCountChip: {
    fontSize: "0.6875rem",
    fontWeight: "700",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "0.1rem 0.45rem",
    borderRadius: "12px",
  },
  markAllBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    cursor: "pointer",
    padding: "0.2rem 0.4rem",
    borderRadius: "4px",
  },
  listArea: {
    maxHeight: "340px",
    overflowY: "auto",
  },
  item: {
    padding: "0.85rem 1rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    borderBottom: "1px solid #f8fafc",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  iconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  itemTitle: {
    fontSize: "0.8125rem",
    color: "#0f172a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  timeTag: {
    fontSize: "0.6875rem",
    color: "#94a3b8",
    flexShrink: 0,
  },
  itemMessage: {
    fontSize: "0.75rem",
    color: "#64748b",
    margin: "0.2rem 0 0 0",
    lineHeight: "1.35",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  unreadDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    flexShrink: 0,
    marginTop: "6px",
  },
  emptyNotice: {
    padding: "2.5rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "0.4rem",
  },
  sparkleCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#f0fdf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.25rem",
  },
  mutedText: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  footer: {
    padding: "0.65rem 1rem",
    borderTop: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
    textAlign: "center",
  },
  viewAllLink: {
    fontSize: "0.8125rem",
    fontWeight: "600",
    color: "#2563eb",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
  },
};
