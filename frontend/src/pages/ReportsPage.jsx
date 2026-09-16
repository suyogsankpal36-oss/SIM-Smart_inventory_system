import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  BarChart3,
  Boxes,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Package,
  Printer,
  RefreshCw,
  Scale,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import reportService from "../services/reportService";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

const TABS = [
  { id: "profit_loss", label: "Profit & Loss (P&L)", icon: Scale },
  { id: "sales", label: "Sales & Revenue", icon: ShoppingBag },
  { id: "inventory", label: "Inventory Valuation", icon: Boxes },
  { id: "expenses", label: "Operating Expenses", icon: BadgePercent },
];

const PRESETS = [
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "last_7d", label: "Last 7 Days" },
  { id: "this_year", label: "This Year" },
  { id: "today", label: "Today" },
];

const GOLD_CHART_PALETTE = [
  "#D4AF37",
  "#F7DF8F",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#A855F7",
  "#EC4899",
  "#64748B",
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("profit_loss");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Date range states
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report data states
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [expensesData, setExpensesData] = useState(null);
  const [plData, setPlData] = useState(null);

  useEffect(() => {
    applyPreset("this_month");
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadActiveTabReport();
    }
  }, [activeTab, startDate, endDate]);

  const applyPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "last_7d") {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      setStartDate(start);
      setEndDate(todayStr);
    } else if (preset === "last_month") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === "this_year") {
      const start = new Date(today.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
      setStartDate(start);
      setEndDate(todayStr);
    }
  };

  const loadActiveTabReport = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    const params = { start_date: startDate, end_date: endDate };

    try {
      if (activeTab === "profit_loss") {
        const data = await reportService.getProfitLossReport(params);
        setPlData(data);
      } else if (activeTab === "sales") {
        const data = await reportService.getSalesReport(params);
        setSalesData(data);
      } else if (activeTab === "inventory") {
        const data = await reportService.getInventoryReport();
        setInventoryData(data);
      } else if (activeTab === "expenses") {
        const data = await reportService.getExpensesReport(params);
        setExpensesData(data);
      }
    } catch (err) {
      console.error("Report fetch error:", err);
      toast.error("Failed to load analytics report.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await reportService.downloadCsv(activeTab, {
        start_date: startDate,
        end_date: endDate,
      });
      toast.success("CSV export downloaded successfully.");
    } catch (err) {
      console.error("CSV Export failed:", err);
      toast.error("Failed to generate CSV export.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-8 pb-14 text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <Scale size={14} className="text-[#d4af37]" />
            Business Intelligence & Executive Analytics
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Financial Studio & Reports
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Realtime balance sheets, profit & loss statements, inventory asset valuation, and revenue distribution channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={() => loadActiveTabReport(true)}
            disabled={refreshing}
            icon={RefreshCw}
            className={refreshing ? "opacity-75" : ""}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button3D>

          <Button3D
            variant="dark"
            onClick={handlePrint}
            icon={Printer}
          >
            Print
          </Button3D>

          <Button3D
            variant="gold"
            onClick={handleExportCsv}
            disabled={exporting}
            icon={Download}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </Button3D>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="card-3d p-1.5 rounded-2xl border border-[#d4af37]/20 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#d4af37] to-[#f7df8f] text-black shadow-[0_4px_20px_rgba(212,175,55,0.4)] scale-[1.01]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar (Hidden for Inventory as it represents live on-hand valuation) */}
      {activeTab !== "inventory" && (
        <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400 mr-1">Time Horizon:</span>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  datePreset === p.id
                    ? "bg-[#d4af37] text-black font-bold shadow"
                    : "bg-black/40 border border-[#d4af37]/20 text-neutral-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-[#d4af37]/25">
              <Calendar size={13} className="text-[#d4af37]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="bg-transparent text-neutral-200 focus:outline-none text-xs"
              />
            </div>
            <span className="text-neutral-500">to</span>
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-[#d4af37]/25">
              <Calendar size={13} className="text-[#d4af37]" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="bg-transparent text-neutral-200 focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content Area according to Active Tab */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center">
          <RefreshCw size={32} className="animate-spin text-[#d4af37] mb-3" />
          <p className="text-sm text-neutral-400">Synthesizing executive analytics report...</p>
        </div>
      ) : (
        <>
          {/* ================= 1. PROFIT & LOSS TAB ================= */}
          {activeTab === "profit_loss" && plData && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Revenue</span>
                      <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                        <ShoppingBag size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-white tracking-tight">
                      {formatCurrency(plData.revenue)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                      Gross customer sales
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">COGS (Inventory Cost)</span>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Boxes size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-blue-300 tracking-tight">
                      {formatCurrency(plData.cost_of_goods_sold)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Product acquisition cost
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Gross Margin</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <TrendingUp size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">
                      {formatCurrency(plData.gross_profit)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {plData.gross_margin_pct || "0"}% gross margin
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Net Profit</span>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          plData.net_profit >= 0
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        }`}
                      >
                        <Scale size={20} />
                      </div>
                    </div>
                    <div
                      className={`text-3xl font-black mt-3 tracking-tight ${
                        plData.net_profit >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(plData.net_profit)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          plData.net_profit >= 0 ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      ></span>
                      {plData.net_margin_pct || "0"}% net margin
                    </div>
                  </div>
                </Tilt3D>
              </div>

              {/* Waterfall Breakdown Card */}
              <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Scale size={18} className="text-[#d4af37]" />
                  Financial Statement Breakdown
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-[#d4af37]/10">
                    <span className="text-neutral-300 font-semibold">(+) Total Gross Revenue</span>
                    <span className="font-mono text-white font-bold">{formatCurrency(plData.revenue)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#d4af37]/10 text-neutral-400">
                    <span>(-) Cost of Goods Sold (COGS)</span>
                    <span className="font-mono text-blue-300">-{formatCurrency(plData.cost_of_goods_sold)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#d4af37]/20 bg-white/[0.02] px-3 rounded-lg">
                    <span className="text-amber-300 font-bold">(=) Gross Profit</span>
                    <span className="font-mono text-amber-300 font-black">{formatCurrency(plData.gross_profit)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#d4af37]/10 text-neutral-400">
                    <span>(-) Total Operating Expenses</span>
                    <span className="font-mono text-rose-300">-{formatCurrency(plData.operating_expenses)}</span>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-black/60 border border-[#d4af37]/40 shadow-inner">
                    <span className="text-sm font-black uppercase tracking-wider text-[#d4af37]">(=) Net Business Profit</span>
                    <span
                      className={`font-mono text-xl font-black ${
                        plData.net_profit >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(plData.net_profit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. SALES & REVENUE TAB ================= */}
          {activeTab === "sales" && salesData && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Sales</span>
                      <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-white tracking-tight">
                      {formatCurrency(salesData.total_sales)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                      Over selected timeframe
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Invoiced Orders</span>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <FileText size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-blue-300 tracking-tight">
                      {salesData.order_count || 0}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Completed transactions
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Average Order</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <TrendingUp size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-emerald-300 tracking-tight">
                      {formatCurrency(salesData.average_order_value)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Average basket size
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">GST / Tax Collected</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <BadgePercent size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">
                      {formatCurrency(salesData.total_tax)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Tax liability collected
                    </div>
                  </div>
                </Tilt3D>
              </div>

              {/* Sales Trend Chart */}
              <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#d4af37]" />
                  Sales Volume Curve
                </h3>
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData.daily_trend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#12141c",
                          border: "1px solid rgba(212, 175, 55, 0.4)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                        formatter={(val) => [formatCurrency(val), "Sales"]}
                      />
                      <Area type="monotone" dataKey="total" stroke="#D4AF37" strokeWidth={3} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Selling Products Table */}
              <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
                <div className="p-4 border-b border-[#d4af37]/20 bg-black/40">
                  <h3 className="text-sm font-bold text-white">Top Performing Products</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#d4af37]/20 bg-black/30 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Units Sold</th>
                        <th className="py-3 px-4 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/10 text-sm">
                      {(salesData.top_products || []).map((p, i) => (
                        <tr key={i} className="table-row-3d hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4 font-medium text-neutral-200">{p.name}</td>
                          <td className="py-3 px-4 text-neutral-400">{p.quantity_sold} units</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                            {formatCurrency(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. INVENTORY VALUATION TAB ================= */}
          {activeTab === "inventory" && inventoryData && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Catalog</span>
                      <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                        <Package size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-white tracking-tight">
                      {inventoryData.total_items || 0}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                      Active product lines
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Cost Asset Valuation</span>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Boxes size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-blue-300 tracking-tight">
                      {formatCurrency(inventoryData.total_cost_value)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Working capital locked in stock
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Retail Potential</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-emerald-300 tracking-tight">
                      {formatCurrency(inventoryData.total_retail_value)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Projected retail recovery
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Unrealized Profit</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <TrendingUp size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">
                      {formatCurrency(inventoryData.potential_profit)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Embedded asset margin
                    </div>
                  </div>
                </Tilt3D>
              </div>

              {/* Category Valuation Bar Chart */}
              <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#d4af37]" />
                  Asset Valuation by Product Category
                </h3>
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData.category_breakdown || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                      <XAxis dataKey="category" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#12141c",
                          border: "1px solid rgba(212, 175, 55, 0.4)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                        formatter={(val) => [formatCurrency(val), "Cost Valuation"]}
                      />
                      <Bar dataKey="cost_value" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. OPERATING EXPENSES TAB ================= */}
          {activeTab === "expenses" && expensesData && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Outlay</span>
                      <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Wallet size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-rose-400 tracking-tight">
                      {formatCurrency(expensesData.total_expenses)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      Total period expenditure
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Vouchers Posted</span>
                      <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                        <FileText size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-white tracking-tight">
                      {expensesData.count || 0}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                      Recorded expense tickets
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Primary Outlay Category</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <BadgePercent size={20} />
                      </div>
                    </div>
                    <div className="text-2xl font-black mt-3 text-amber-300 tracking-tight truncate">
                      {expensesData.top_category || "None"}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Highest expenditure driver
                    </div>
                  </div>
                </Tilt3D>

                <Tilt3D intensity={12}>
                  <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Daily Average Outflow</span>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <TrendingDown size={20} />
                      </div>
                    </div>
                    <div className="text-3xl font-black mt-3 text-blue-300 tracking-tight">
                      {formatCurrency(expensesData.daily_average)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Mean daily cash burn
                    </div>
                  </div>
                </Tilt3D>
              </div>

              {/* Expense Category Breakdown Chart */}
              <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#d4af37]" />
                  Category Outlay Comparison
                </h3>
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesData.category_breakdown || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                      <XAxis dataKey="category" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#12141c",
                          border: "1px solid rgba(212, 175, 55, 0.4)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                        formatter={(val) => [formatCurrency(val), "Outlay"]}
                      />
                      <Bar dataKey="total" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
