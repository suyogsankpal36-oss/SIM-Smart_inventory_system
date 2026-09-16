import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Code2,
  Download,
  Eye,
  FileClock,
  History,
  KeyRound,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  User,
  Users,
  X,
} from "lucide-react";
import auditService from "../services/auditService";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

const ACTION_CONFIG = {
  create: { label: "Creation", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)" },
  update: { label: "Modification", color: "#F7DF8F", bg: "rgba(212, 175, 55, 0.15)", border: "rgba(212, 175, 55, 0.4)" },
  delete: { label: "Purged / Delete", color: "#f87171", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)" },
  login: { label: "Auth Sign-In", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)" },
  logout: { label: "Auth Sign-Out", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.4)" },
  price_change: { label: "Price Override", color: "#fbbf24", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)" },
  stock_change: { label: "Stock Adjustment", color: "#38bdf8", bg: "rgba(14, 165, 233, 0.15)", border: "rgba(14, 165, 233, 0.4)" },
};

const MODULE_CONFIG = {
  accounts: { label: "HR & Security", color: "#c084fc", bg: "rgba(192, 132, 252, 0.12)" },
  products: { label: "Product Catalog", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)" },
  inventory: { label: "Inventory Stock", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
  sales: { label: "Sales & POS", color: "#F7DF8F", bg: "rgba(212, 175, 55, 0.12)" },
  customers: { label: "CRM Customers", color: "#818cf8", bg: "rgba(129, 140, 248, 0.12)" },
  suppliers: { label: "Vendors & Supply", color: "#fb923c", bg: "rgba(251, 146, 60, 0.12)" },
  expenses: { label: "Expenses Ledger", color: "#fb7185", bg: "rgba(251, 113, 133, 0.12)" },
  settings: { label: "Store Config", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)" },
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
    <div className="space-y-8 pb-14 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <History size={14} className="text-[#d4af37]" />
            Enterprise Forensic Compliance & Audit Log
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            System Security & Audit Trail
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Immutable chronicle of state mutations, staff authentication records, privilege escalations, and price revisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            icon={RefreshCw}
            className={refreshing ? "opacity-75" : ""}
          >
            {refreshing ? "Updating..." : "Refresh"}
          </Button3D>

          <Button3D
            variant="gold"
            onClick={handleExport}
            disabled={exporting}
            icon={Download}
          >
            {exporting ? "Exporting..." : "Export Trail (CSV)"}
          </Button3D>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Audit Logs</span>
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <FileClock size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-white tracking-tight">{stats.total_logs}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Indexed event records
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Today's Activity</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Activity size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-emerald-400 tracking-tight">{stats.today_logs}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Actions committed today
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Deletions / Overrides</span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-rose-400 tracking-tight">
              {(stats.action_counts?.delete || 0) + (stats.action_counts?.price_change || 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              High risk operations
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Leading Operator</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <User size={20} />
              </div>
            </div>
            <div className="text-xl font-black mt-3 text-amber-300 tracking-tight truncate">
              {stats.top_actors?.[0]?.user__username || "System Admin"}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {stats.top_actors?.[0]?.count || 0} events dispatched
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Filter Toolbar */}
      <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by user, description, IP, or record ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="" className="bg-[#12141c]">All Actions</option>
            <option value="create" className="bg-[#12141c]">Creations</option>
            <option value="update" className="bg-[#12141c]">Modifications</option>
            <option value="delete" className="bg-[#12141c]">Deletions</option>
            <option value="price_change" className="bg-[#12141c]">Price Changes</option>
            <option value="stock_change" className="bg-[#12141c]">Stock Adjustments</option>
            <option value="login" className="bg-[#12141c]">Logins</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="" className="bg-[#12141c]">All Modules</option>
            <option value="sales" className="bg-[#12141c]">Sales & POS</option>
            <option value="inventory" className="bg-[#12141c]">Inventory Stock</option>
            <option value="products" className="bg-[#12141c]">Products Catalog</option>
            <option value="accounts" className="bg-[#12141c]">Staff Accounts</option>
            <option value="customers" className="bg-[#12141c]">Customers</option>
            <option value="suppliers" className="bg-[#12141c]">Suppliers</option>
            <option value="expenses" className="bg-[#12141c]">Expenses</option>
            <option value="settings" className="bg-[#12141c]">Store Settings</option>
          </select>

          {(search || actionFilter || moduleFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs text-[#d4af37] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <RefreshCw size={28} className="animate-spin text-[#d4af37] mb-3" />
            <p className="text-sm text-neutral-400">Querying security records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mx-auto mb-3">
              <History size={26} />
            </div>
            <h3 className="text-base font-semibold text-neutral-200">No audit events found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {search || actionFilter || moduleFilter
                ? "Try adjusting your filter parameters to broaden the search."
                : "System state mutations and user activities will be captured here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#d4af37]/20 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Details / Object</th>
                  <th className="py-3.5 px-4">IP / Terminal</th>
                  <th className="py-3.5 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4af37]/10 text-sm">
                {logs.map((log) => {
                  const act = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    color: "#cbd5e1",
                    bg: "rgba(100, 116, 139, 0.15)",
                    border: "rgba(100, 116, 139, 0.4)",
                  };
                  const mod = MODULE_CONFIG[log.module] || {
                    label: log.module,
                    color: "#d4af37",
                    bg: "rgba(212, 175, 55, 0.1)",
                  };

                  const hasPayload = log.changes && Object.keys(log.changes).length > 0;

                  return (
                    <tr key={log.id} className="table-row-3d hover:bg-white/[0.02] transition">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-xs text-neutral-400 font-mono whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>

                      {/* Operator */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[10px] font-bold text-[#d4af37]">
                            {(log.user_username?.[0] || "S").toUpperCase()}
                          </div>
                          <span className="font-semibold text-neutral-200 text-xs">
                            {log.user_username || "System"}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: act.bg,
                            color: act.color,
                            border: `1px solid ${act.border}`,
                          }}
                        >
                          {act.label}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor: mod.bg,
                            color: mod.color,
                          }}
                        >
                          {mod.label}
                        </span>
                      </td>

                      {/* Object / Description */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-200 text-xs">{log.description}</div>
                        {log.object_repr && (
                          <div className="text-[11px] text-neutral-400 font-mono">
                            Ref: {log.object_repr}
                          </div>
                        )}
                      </td>

                      {/* IP / Terminal */}
                      <td className="py-3 px-4 text-xs font-mono text-neutral-400">
                        {log.ip_address || "127.0.0.1"}
                      </td>

                      {/* Payload Inspect */}
                      <td className="py-3 px-4 text-right">
                        {hasPayload ? (
                          <button
                            onClick={() => setActiveChanges(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/20 transition"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>
                        ) : (
                          <span className="text-neutral-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= INSPECT CHANGES PAYLOAD MODAL ================= */}
      {activeChanges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-xl rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Forensic State Mutation</h3>
                  <p className="text-xs text-neutral-400">
                    Event #{activeChanges.id} by @{activeChanges.user_username || "system"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveChanges(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-black/80 border border-[#d4af37]/30 font-mono text-xs max-h-96 overflow-y-auto space-y-3">
              <div className="text-[#d4af37] font-bold">
                # Target: {activeChanges.module} &gt; {activeChanges.object_repr || "Item"}
              </div>

              {typeof activeChanges.changes === "object" && activeChanges.changes !== null ? (
                <pre className="text-neutral-300 leading-relaxed overflow-x-auto">
                  {JSON.stringify(activeChanges.changes, null, 2)}
                </pre>
              ) : (
                <div className="text-neutral-400">{String(activeChanges.changes)}</div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end">
              <Button3D variant="gold" onClick={() => setActiveChanges(null)}>
                Close Inspector
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
