import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Download,
  Filter,
  History,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import inventoryService from "../services/inventoryService";
import productService from "../services/productService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

export default function InventoryPage() {
  const { isAdmin, isManager } = useAuth();
  const canAdjust = isAdmin || isManager;

  const [activeTab, setActiveTab] = useState("levels"); // "levels" | "history"

  // Stock Levels State
  const [stockItems, setStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_cost_valuation: "0.00",
    total_retail_valuation: "0.00",
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const [loadingLevels, setLoadingLevels] = useState(true);

  // Filters for Levels
  const [levelSearch, setLevelSearch] = useState("");
  const [levelCategory, setLevelCategory] = useState("all");
  const [levelStatus, setLevelStatus] = useState("all");

  // Stock History State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState("all");

  // Stock Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === "levels") {
      fetchStockLevels();
    } else {
      fetchStockLogs();
    }
  }, [activeTab, levelSearch, levelCategory, levelStatus, logTypeFilter]);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockLevels = async () => {
    setLoadingLevels(true);
    try {
      const params = {};
      if (levelSearch.trim()) params.search = levelSearch.trim();
      if (levelCategory !== "all") params.category = levelCategory;
      if (levelStatus !== "all") params.status = levelStatus;

      const [levelsData, summaryData] = await Promise.all([
        inventoryService.getStockLevels(params),
        inventoryService.getSummary(),
      ]);

      setStockItems(Array.isArray(levelsData) ? levelsData : levelsData.results || []);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory levels.");
    } finally {
      setLoadingLevels(false);
    }
  };

  const fetchStockLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = {};
      if (logTypeFilter !== "all") params.adjustment_type = logTypeFilter;
      const data = await inventoryService.getAdjustmentLogs(params);
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit history.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || parseInt(quantity, 10) <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.adjustStock(selectedProduct.id, {
        adjustment_type: adjustmentType,
        quantity: parseInt(quantity, 10),
        reason: reason.trim() || "Manual adjustment from inventory management",
      });

      toast.success(`Inventory updated for ${selectedProduct.name}!`);
      setSelectedProduct(null);
      setQuantity("");
      setReason("");
      fetchStockLevels();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to commit adjustment.";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-14 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <Boxes size={14} className="text-[#d4af37]" />
            Asset Custody & Stock Valuation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Inventory Valuation & Adjustments
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Live stock audits, safety threshold tracking, capital valuation, and historical inventory movement reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={activeTab === "levels" ? fetchStockLevels : fetchStockLogs}
            disabled={loadingLevels || loadingLogs}
            icon={RefreshCw}
            className={loadingLevels || loadingLogs ? "opacity-75" : ""}
          >
            Refresh Data
          </Button3D>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Items Tracked</span>
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Package size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-white tracking-tight">{summary.total_products}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Active product units
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Cost Asset Valuation</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Coins size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-blue-300 tracking-tight">
              ₹{Number(summary.total_cost_valuation || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Working capital invested
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Potential Retail Value</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-emerald-300 tracking-tight">
              ₹{Number(summary.total_retail_valuation || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Projected sales revenue
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Reorder Alerts</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="text-2xl font-black mt-3 text-amber-300 tracking-tight">
              {summary.low_stock_count} Low / {summary.out_of_stock_count} Out
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Action required
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Tab Navigation */}
      <div className="card-3d p-1.5 rounded-2xl border border-[#d4af37]/20 flex gap-2">
        <button
          onClick={() => setActiveTab("levels")}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${
            activeTab === "levels"
              ? "bg-[#d4af37] text-black shadow-[0_4px_15px_rgba(212,175,55,0.4)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Boxes size={16} />
          <span>Current Stock Levels & Reorder</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${
            activeTab === "history"
              ? "bg-[#d4af37] text-black shadow-[0_4px_15px_rgba(212,175,55,0.4)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <History size={16} />
          <span>Transaction Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: Current Stock Levels */}
      {activeTab === "levels" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filters Toolbar */}
          <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Filter by product name or SKU..."
                value={levelSearch}
                onChange={(e) => setLevelSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
              {levelSearch && (
                <button
                  onClick={() => setLevelSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={levelCategory}
                onChange={(e) => setLevelCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="all" className="bg-[#12141c]">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#12141c]">
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={levelStatus}
                onChange={(e) => setLevelStatus(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="all" className="bg-[#12141c]">All Statuses</option>
                <option value="in_stock" className="bg-[#12141c]">In Stock</option>
                <option value="low_stock" className="bg-[#12141c]">Low Stock Warning</option>
                <option value="out_of_stock" className="bg-[#12141c]">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d4af37]/20 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3.5 px-4">Item & SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">On Hand Stock</th>
                    <th className="py-3.5 px-4">Cost Value</th>
                    <th className="py-3.5 px-4">Retail Value</th>
                    <th className="py-3.5 px-4">Health Status</th>
                    {canAdjust && <th className="py-3.5 px-4 text-right">Adjustment</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 text-sm">
                  {loadingLevels ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-neutral-400 text-xs">
                        Loading inventory ledger...
                      </td>
                    </tr>
                  ) : stockItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Boxes size={40} className="text-[#d4af37]/40 mx-auto mb-2" />
                        <p className="text-xs text-neutral-400">No stock entries found.</p>
                      </td>
                    </tr>
                  ) : (
                    stockItems.map((item) => {
                      const isLow = item.stock_quantity <= item.minimum_stock && item.stock_quantity > 0;
                      const isOut = item.stock_quantity <= 0;

                      return (
                        <tr key={item.id} className="table-row-3d hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-xs">{item.name}</div>
                            <div className="font-mono text-[11px] text-neutral-500">{item.sku}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]">
                              {item.category_name || "General"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-black text-white text-sm">
                              {item.stock_quantity}
                              <span className="text-[10px] font-normal text-neutral-500 ml-1">
                                (Min: {item.minimum_stock})
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">
                            ₹{item.total_cost_value}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300 text-xs">
                            ₹{item.total_retail_value}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isOut
                                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                                  : isLow
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOut ? "bg-rose-400" : isLow ? "bg-amber-400" : "bg-emerald-400"
                                }`}
                              />
                              {isOut ? "Depleted" : isLow ? "Low Stock" : "Normal"}
                            </span>
                          </td>

                          {canAdjust && (
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedProduct(item);
                                  setAdjustmentType("add");
                                  setQuantity("");
                                  setReason("");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/20 transition"
                              >
                                <Boxes size={12} />
                                <span>Adjust</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Transaction Audit Trail */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* History Filters */}
          <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <History size={14} />
              Chronological Movement Log
            </span>

            <select
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
            >
              <option value="all" className="bg-[#12141c]">All Movements</option>
              <option value="add" className="bg-[#12141c]">Stock Replenishment (+)</option>
              <option value="reduce" className="bg-[#12141c]">Damage / Loss (-)</option>
              <option value="sale" className="bg-[#12141c]">POS Sales Outflow (-)</option>
              <option value="return" className="bg-[#12141c]">Customer Return (+)</option>
            </select>
          </div>

          {/* History Table */}
          <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d4af37]/20 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Item & SKU</th>
                    <th className="py-3.5 px-4">Movement</th>
                    <th className="py-3.5 px-4">Quantity</th>
                    <th className="py-3.5 px-4">Before → After</th>
                    <th className="py-3.5 px-4">Reason / Notes</th>
                    <th className="py-3.5 px-4 text-right">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 text-xs">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-neutral-400">
                        Loading transaction history...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-neutral-400">
                        No movement audit records found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="table-row-3d hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-mono text-neutral-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{log.product_name}</div>
                          <div className="font-mono text-neutral-500 text-[11px]">{log.product_sku}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.adjustment_type === "add" || log.adjustment_type === "return"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {log.adjustment_type}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={
                              log.adjustment_type === "add" || log.adjustment_type === "return"
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {log.adjustment_type === "add" || log.adjustment_type === "return" ? "+" : "-"}
                            {log.quantity}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {log.old_quantity} → <strong className="text-white">{log.new_quantity}</strong>
                        </td>

                        <td className="py-3 px-4 text-neutral-300 max-w-xs truncate">
                          {log.reason || "—"}
                        </td>

                        <td className="py-3 px-4 text-right text-neutral-400">
                          {log.created_by_name || "System"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADJUSTMENT MODAL ================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-[#d4af37]" />
                <h3 className="font-bold text-base text-white">Adjust Stock Level</h3>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-[#d4af37]/20 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{selectedProduct.name}</div>
                  <div className="text-neutral-400 font-mono text-[11px]">{selectedProduct.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-neutral-400">Current Stock</div>
                  <div className="font-bold font-mono text-amber-300 text-sm">{selectedProduct.stock_quantity}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("add")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    adjustmentType === "add"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-black/40 border-neutral-800 text-neutral-400"
                  }`}
                >
                  + Add Stock (Received)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("reduce")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    adjustmentType === "reduce"
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-black/40 border-neutral-800 text-neutral-400"
                  }`}
                >
                  - Deduct (Damage/Loss)
                </button>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-white font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Audit Reason / Shipment Ref</label>
                <input
                  type="text"
                  placeholder="Supplier consignment, damaged carton, audit recount..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setSelectedProduct(null)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={submitting}>
                  {submitting ? "Committing..." : "Commit Adjustment"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
