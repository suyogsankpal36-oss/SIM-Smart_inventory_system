import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileClock,
  History,
  RefreshCw,
  Search,
  ShieldAlert,
  Terminal,
  User,
  X,
} from "lucide-react";
import auditService from "../services/auditService";
import { Badge, Button, Card, Modal, Select, StatsCard, Table } from "../components/ui";

const ACTION_CONFIG = {
  create: { label: "Creation", badge: "badge-success" },
  update: { label: "Modification", badge: "badge-warning" },
  delete: { label: "Purged / Delete", badge: "badge-error" },
  login: { label: "Auth Sign-In", badge: "badge-info" },
  logout: { label: "Auth Sign-Out", badge: "badge-ghost" },
  price_change: { label: "Price Override", badge: "badge-primary" },
  stock_change: { label: "Stock Adjustment", badge: "badge-accent" },
};

const MODULE_CONFIG = {
  accounts: { label: "HR & Security", badge: "badge-secondary" },
  products: { label: "Product Catalog", badge: "badge-accent" },
  inventory: { label: "Inventory Stock", badge: "badge-info" },
  sales: { label: "Sales & POS", badge: "badge-primary" },
  customers: { label: "CRM Customers", badge: "badge-ghost" },
  suppliers: { label: "Vendors & Supply", badge: "badge-warning" },
  expenses: { label: "Expenses Ledger", badge: "badge-error" },
  settings: { label: "Store Config", badge: "badge-neutral" },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total_logs: 0,
    today_logs: 0,
    action_counts: {},
    module_counts: {},
    top_actors: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  // Inspect Changes Modal
  const [activeChanges, setActiveChanges] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [search, actionFilter, moduleFilter]);

  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      if (moduleFilter) params.module = moduleFilter;

      const data = await auditService.getLogs(params);
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await auditService.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load audit stats:", err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      if (moduleFilter) params.module = moduleFilter;

      await auditService.exportCSV(params);
      toast.success("Audit trail spreadsheet exported.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export audit logs.");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setModuleFilter("");
  };

  const hasActiveFilters = Boolean(search) || Boolean(actionFilter) || Boolean(moduleFilter);

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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
            System Security & Audit Trail
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Immutable chronicle of state mutations, staff authentication records, privilege escalations, and price revisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchLogs(true)}
            loading={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExport}
            loading={exporting}
          >
            Export Trail (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Audit Logs"
          value={stats.total_logs}
          icon={FileClock}
          color="primary"
          description="Indexed event records"
        />
        <StatsCard
          title="Today's Activity"
          value={stats.today_logs}
          icon={Activity}
          color="accent"
          description="Actions committed today"
        />
        <StatsCard
          title="Deletions / Overrides"
          value={(stats.action_counts?.delete || 0) + (stats.action_counts?.price_change || 0)}
          icon={ShieldAlert}
          color="error"
          description="High risk operations"
        />
        <StatsCard
          title="Leading Operator"
          value={stats.top_actors?.[0]?.user__username || "System Admin"}
          icon={User}
          color="secondary"
          description={`${stats.top_actors?.[0]?.count || 0} events dispatched`}
        />
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by user, description, IP, or record ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-10 bg-base-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="select select-bordered select-sm bg-base-100"
            >
              <option value="">All Actions</option>
              <option value="create">Creations</option>
              <option value="update">Modifications</option>
              <option value="delete">Deletions</option>
              <option value="price_change">Price Changes</option>
              <option value="stock_change">Stock Adjustments</option>
              <option value="login">Logins</option>
            </select>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="select select-bordered select-sm bg-base-100"
            >
              <option value="">All Modules</option>
              <option value="sales">Sales & POS</option>
              <option value="inventory">Inventory Stock</option>
              <option value="products">Products Catalog</option>
              <option value="accounts">Staff Accounts</option>
              <option value="customers">Customers</option>
              <option value="suppliers">Suppliers</option>
              <option value="expenses">Expenses</option>
              <option value="settings">Store Settings</option>
            </select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Table
        loading={loading}
        data={logs}
        emptyTitle="No audit events found"
        emptyDescription={
          hasActiveFilters
            ? "Try adjusting your filter parameters to broaden the search."
            : "System state mutations and user activities will be captured here."
        }
        columns={[
          {
            header: "Timestamp",
            render: (log) => (
              <div className="text-xs font-mono text-base-content/70 whitespace-nowrap">
                {formatDate(log.created_at)}
              </div>
            ),
          },
          {
            header: "Operator",
            render: (log) => (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                  {(log.user_username?.[0] || "S").toUpperCase()}
                </div>
                <span className="font-semibold text-base-content text-xs">
                  {log.user_username || "System"}
                </span>
              </div>
            ),
          },
          {
            header: "Action",
            render: (log) => {
              const act = ACTION_CONFIG[log.action] || {
                label: log.action,
                badge: "badge-ghost",
              };
              return (
                <span className={`badge ${act.badge} badge-sm font-bold`}>
                  {act.label}
                </span>
              );
            },
          },
          {
            header: "Module",
            render: (log) => {
              const mod = MODULE_CONFIG[log.module] || {
                label: log.module,
                badge: "badge-ghost",
              };
              return (
                <span className={`badge ${mod.badge} badge-outline badge-sm font-semibold`}>
                  {mod.label}
                </span>
              );
            },
          },
          {
            header: "Details / Object",
            render: (log) => (
              <div>
                <div className="font-medium text-base-content text-xs">{log.description}</div>
                {log.object_repr && (
                  <div className="text-[11px] text-base-content/50 font-mono mt-0.5">
                    Ref: {log.object_repr}
                  </div>
                )}
              </div>
            ),
          },
          {
            header: "Terminal IP",
            render: (log) => (
              <span className="text-xs font-mono text-base-content/60">
                {log.ip_address || "127.0.0.1"}
              </span>
            ),
          },
          {
            header: "Payload",
            className: "text-right",
            render: (log) => {
              const hasPayload = log.changes && Object.keys(log.changes).length > 0;
              return hasPayload ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-xs"
                  onClick={() => setActiveChanges(log)}
                >
                  <Eye size={12} className="mr-1" />
                  Inspect
                </Button>
              ) : (
                <span className="text-base-content/30 text-xs">—</span>
              );
            },
          },
        ]}
      />

      {/* Inspect Changes Payload Modal */}
      <Modal
        isOpen={Boolean(activeChanges)}
        onClose={() => setActiveChanges(null)}
        title="Forensic State Mutation"
        maxWidth="max-w-xl"
      >
        {activeChanges && (
          <div className="space-y-4 pt-2">
            <div className="text-xs text-base-content/60">
              Event #{activeChanges.id} dispatched by <strong className="text-base-content">@{activeChanges.user_username || "system"}</strong>
            </div>

            <div className="p-4 rounded-xl bg-base-200 border border-base-content/10 font-mono text-xs max-h-96 overflow-y-auto space-y-2">
              <div className="text-primary font-bold">
                # Target: {activeChanges.module} &gt; {activeChanges.object_repr || "Item"}
              </div>

              {typeof activeChanges.changes === "object" && activeChanges.changes !== null ? (
                <pre className="text-base-content/90 leading-relaxed overflow-x-auto text-[11px]">
                  {JSON.stringify(activeChanges.changes, null, 2)}
                </pre>
              ) : (
                <div className="text-base-content/60">{String(activeChanges.changes)}</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setActiveChanges(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
