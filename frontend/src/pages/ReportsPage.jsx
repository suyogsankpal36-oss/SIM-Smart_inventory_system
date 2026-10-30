import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  BadgePercent,
  BarChart3,
  Boxes,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Package,
  Printer,
  RefreshCw,
  Scale,
  ShoppingBag,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import reportService from "../services/reportService";
import { useTheme } from "../context/ThemeContext";
import { Badge, Button, Card, StatsCard, Table } from "../components/ui";

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

export default function ReportsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Financial Studio & Reports
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Realtime balance sheets, profit & loss statements, inventory asset valuation, and revenue distribution channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadActiveTabReport(true)}
            loading={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            loading={exporting}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1.5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab h-11 text-xs md:text-sm font-bold gap-2 transition-all rounded-xl ${
                isActive ? "tab-active bg-primary text-primary-content shadow-md" : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar (Hidden for live Inventory) */}
      {activeTab !== "inventory" && (
        <Card>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-base-content/60 mr-1">Time Horizon:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`btn btn-xs ${
                    datePreset === p.id ? "btn-primary font-bold shadow-sm" : "btn-ghost"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-base-100 px-3 py-1.5 rounded-lg border border-base-content/20">
                <Calendar size={13} className="text-primary shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setStartDate(e.target.value);
                  }}
                  className="bg-transparent text-base-content focus:outline-none text-xs"
                />
              </div>
              <span className="text-base-content/40 font-semibold">to</span>
              <div className="flex items-center gap-1.5 bg-base-100 px-3 py-1.5 rounded-lg border border-base-content/20">
                <Calendar size={13} className="text-primary shrink-0" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setEndDate(e.target.value);
                  }}
                  className="bg-transparent text-base-content focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center">
          <RefreshCw size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-base-content/60">Synthesizing executive analytics report...</p>
        </div>
      ) : (
        <>
          {/* ================= 1. PROFIT & LOSS TAB ================= */}
          {activeTab === "profit_loss" && plData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Revenue"
                  value={formatCurrency(plData.revenue)}
                  icon={ShoppingBag}
                  color="primary"
                  description="Gross customer sales"
                />
                <StatsCard
                  title="COGS (Inventory Cost)"
                  value={formatCurrency(plData.cost_of_goods_sold)}
                  icon={Boxes}
                  color="secondary"
                  description="Product acquisition cost"
                />
                <StatsCard
                  title="Gross Profit"
                  value={formatCurrency(plData.gross_profit)}
                  icon={TrendingUp}
                  color="accent"
                  description={`${plData.gross_margin_pct || "0"}% gross margin`}
                />
                <StatsCard
                  title="Net Profit"
                  value={formatCurrency(plData.net_profit)}
                  icon={Scale}
                  color={plData.net_profit >= 0 ? "accent" : "error"}
                  description={`${plData.net_margin_pct || "0"}% net margin`}
                />
              </div>

              {/* Financial Statement Breakdown */}
              <Card>
                <h3 className="font-bold text-base-content text-base mb-4 flex items-center gap-2">
                  <Scale size={18} className="text-primary" />
                  Financial Statement Breakdown
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-base-content/10">
                    <span className="text-base-content/80 font-semibold">(+) Total Gross Revenue</span>
                    <span className="font-mono text-base-content font-bold">{formatCurrency(plData.revenue)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-base-content/10 text-base-content/60">
                    <span>(-) Cost of Goods Sold (COGS)</span>
                    <span className="font-mono text-info">-{formatCurrency(plData.cost_of_goods_sold)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 px-3 border-b border-base-content/10 bg-base-200 rounded-lg">
                    <span className="text-primary font-bold">(=) Gross Profit</span>
                    <span className="font-mono text-primary font-black">{formatCurrency(plData.gross_profit)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-base-content/10 text-base-content/60">
                    <span>(-) Total Operating Expenses</span>
                    <span className="font-mono text-error">-{formatCurrency(plData.operating_expenses)}</span>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-base-200 border border-primary/30">
                    <span className="text-sm font-black uppercase tracking-wider text-base-content">
                      (=) Net Business Profit
                    </span>
                    <span
                      className={`font-mono text-xl font-black ${
                        plData.net_profit >= 0 ? "text-accent" : "text-error"
                      }`}
                    >
                      {formatCurrency(plData.net_profit)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ================= 2. SALES & REVENUE TAB ================= */}
          {activeTab === "sales" && salesData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Sales"
                  value={formatCurrency(salesData.total_sales)}
                  icon={DollarSign}
                  color="primary"
                  description="Timeframe volume"
                />
                <StatsCard
                  title="Invoiced Orders"
                  value={salesData.order_count || 0}
                  icon={FileText}
                  color="secondary"
                  description="Completed orders"
                />
                <StatsCard
                  title="Average Basket"
                  value={formatCurrency(salesData.average_order_value)}
                  icon={TrendingUp}
                  color="accent"
                  description="Mean ticket size"
                />
                <StatsCard
                  title="Tax Collected"
                  value={formatCurrency(salesData.total_tax)}
                  icon={BadgePercent}
                  color="primary"
                  description="Collected GST"
                />
              </div>

              {/* Daily Sales Curve */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base-content">Sales Volume Trajectory</h3>
                    <p className="text-xs text-base-content/60">Daily performance curve across horizon</p>
                  </div>
                  <BarChart3 size={16} className="text-primary" />
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData.daily_trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={isDark ? "#a39d91" : "#64748b"}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={isDark ? "#a39d91" : "#64748b"}
                        fontSize={11}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#12141c" : "#ffffff",
                          borderColor: isDark ? "rgba(212,175,55,0.3)" : "#e2e8f0",
                          borderRadius: "0.5rem",
                          color: isDark ? "#f5f3ef" : "#0f172a",
                          fontSize: "0.85rem",
                        }}
                        formatter={(val) => [formatCurrency(val), "Revenue"]}
                      />
                      <Area type="monotone" dataKey="total" stroke="#d4af37" strokeWidth={2} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Top Performing Products */}
              <Card>
                <h3 className="font-bold text-base-content mb-3">Top Performing Products</h3>
                <Table
                  data={salesData.top_products || []}
                  emptyTitle="No product sales recorded in range"
                  columns={[
                    {
                      header: "Product Name",
                      render: (p) => <div className="font-semibold text-base-content">{p.name}</div>,
                    },
                    {
                      header: "Units Sold",
                      render: (p) => (
                        <span className="badge badge-ghost badge-sm font-semibold">
                          {p.quantity_sold} units
                        </span>
                      ),
                    },
                    {
                      header: "Revenue Generated",
                      className: "text-right",
                      render: (p) => (
                        <div className="font-mono font-bold text-primary">
                          {formatCurrency(p.revenue)}
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>
          )}

          {/* ================= 3. INVENTORY VALUATION TAB ================= */}
          {activeTab === "inventory" && inventoryData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Catalog SKUs"
                  value={inventoryData.total_items || 0}
                  icon={Package}
                  color="primary"
                  description="Live product lines"
                />
                <StatsCard
                  title="Cost Valuation"
                  value={formatCurrency(inventoryData.total_cost_value)}
                  icon={Boxes}
                  color="secondary"
                  description="Working capital locked"
                />
                <StatsCard
                  title="Retail Potential"
                  value={formatCurrency(inventoryData.total_retail_value)}
                  icon={DollarSign}
                  color="accent"
                  description="Projected retail yield"
                />
                <StatsCard
                  title="Unrealized Profit"
                  value={formatCurrency(inventoryData.potential_profit)}
                  icon={TrendingUp}
                  color="primary"
                  description="Asset profit margin"
                />
              </div>

              {/* Category Valuation Bar Chart */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base-content">Asset Valuation by Category</h3>
                    <p className="text-xs text-base-content/60">Capital allocation across product families</p>
                  </div>
                  <Boxes size={16} className="text-primary" />
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData.category_breakdown || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                      />
                      <XAxis
                        dataKey="category"
                        stroke={isDark ? "#a39d91" : "#64748b"}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={isDark ? "#a39d91" : "#64748b"}
                        fontSize={11}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#12141c" : "#ffffff",
                          borderColor: isDark ? "rgba(212,175,55,0.3)" : "#e2e8f0",
                          borderRadius: "0.5rem",
                          color: isDark ? "#f5f3ef" : "#0f172a",
                          fontSize: "0.85rem",
                        }}
                        formatter={(val) => [formatCurrency(val), "Cost Value"]}
                      />
                      <Bar dataKey="cost_value" fill="#d4af37" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* ================= 4. OPERATING EXPENSES TAB ================= */}
          {activeTab === "expenses" && expensesData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Outlay"
                  value={formatCurrency(expensesData.total_expenses)}
                  icon={Wallet}
                  color="error"
                  description="Period expenditure"
                />
                <StatsCard
                  title="Vouchers Posted"
                  value={expensesData.count || 0}
                  icon={FileText}
                  color="primary"
                  description="Recorded disbursements"
                />
                <StatsCard
                  title="Lead Cost Driver"
                  value={expensesData.top_category || "None"}
                  icon={BadgePercent}
                  color="secondary"
                  description="Primary category"
                />
                <StatsCard
                  title="Daily Mean Outflow"
                  value={formatCurrency(expensesData.daily_average)}
                  icon={TrendingDown}
                  color="error"
                  description="Average daily cash burn"
                />
              </div>

              {/* Expense Category Breakdown Chart */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base-content">Category Outlay Comparison</h3>
                    <p className="text-xs text-base-content/60">Spending allocation across accounts</p>
                  </div>
                  <BarChart3 size={16} className="text-primary" />
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesData.category_breakdown || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                      />
                      <XAxis
                        dataKey="category"
                        stroke={isDark ? "#a39d91" : "#64748b"}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={isDark ? "#a39d91" : "#64748b"}
                        fontSize={11}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#12141c" : "#ffffff",
                          borderColor: isDark ? "rgba(212,175,55,0.3)" : "#e2e8f0",
                          borderRadius: "0.5rem",
                          color: isDark ? "#f5f3ef" : "#0f172a",
                          fontSize: "0.85rem",
                        }}
                        formatter={(val) => [formatCurrency(val), "Outlay"]}
                      />
                      <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
