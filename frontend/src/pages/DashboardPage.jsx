import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Barcode,
  Boxes,
  CheckCircle,
  CreditCard,
  DollarSign,
  Layers,
  Package,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

// Smooth 60fps Animated Currency Counter
function AnimatedCounter({ value, currencySymbol = "₹", decimals = 2, duration = 1100 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(value) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(target * easeOut);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {currencySymbol}
      {displayValue.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

// Smooth 60fps Animated Integer Counter
function AnimatedInteger({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Math.round(Number(value) || 0);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * easeOut));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString("en-IN")}</span>;
}

export default function DashboardPage() {
  const isOnline = useOnlineStatus();
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem("smart_inventory_dashboard_cache");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem("smart_inventory_dashboard_cache");
    } catch {
      return true;
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError("");
    try {
      const res = await api.get("/dashboard/");
      setData(res.data);
      try {
        localStorage.setItem("smart_inventory_dashboard_cache", JSON.stringify(res.data));
      } catch (e) {}
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      // Fallback to cache if network fails
      try {
        const cached = localStorage.getItem("smart_inventory_dashboard_cache");
        if (cached) {
          setData(JSON.parse(cached));
        }
      } catch (e) {}

      if (!navigator.onLine) {
        setError("Internet connection is offline. Showing cached metrics.");
      } else {
        setError("Failed to load dashboard metrics. Please verify server connection.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Auto-refresh when network comes back online
  useEffect(() => {
    if (isOnline) {
      fetchDashboardStats();
    }
  }, [isOnline]);

  const currencySymbol = data?.business?.currency_symbol || "₹";
  const kpis = data?.kpis || {};
  const salesTrend = data?.sales_trend_7d || [];
  const monthlyComp = data?.monthly_comparison_6m || [];
  const recentOrders = data?.recent_orders || [];
  const lowStockItems = data?.low_stock_items || [];

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `${currencySymbol}${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 text-white">
        <div className="flex justify-between items-center">
          <div className="w-56 h-10 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="w-32 h-10 rounded-xl bg-white/[0.04] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-white/[0.04] border border-[#d4af37]/10 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-white/[0.04] border border-[#d4af37]/10 animate-pulse" />
          <div className="h-80 rounded-2xl bg-white/[0.04] border border-[#d4af37]/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14 text-white">
      {/* Top Header with Real-time Live Badge & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            {isOnline ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] uppercase">
                  <Sparkles size={13} />
                  <span>Realtime Telemetry Active</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE</span>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-xs font-semibold tracking-wider text-rose-300 uppercase">
                  <WifiOff size={13} className="text-rose-400" />
                  <span>Telemetry Paused (Offline)</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-[11px] font-bold text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>OFFLINE</span>
                </div>
              </>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Executive Command Suite
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Realtime operations, fiscal telemetry, and predictive inventory dynamics for{" "}
            <strong className="text-white">{data?.business?.name || "Smart Inventory"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/pos">
            <Button3D variant="gold" icon={ShoppingCart}>
              Launch POS
            </Button3D>
          </Link>

          <Link to="/barcodes">
            <Button3D variant="dark" icon={QrCode}>
              Label Studio
            </Button3D>
          </Link>

          <Button3D
            variant="dark"
            onClick={() => fetchDashboardStats(true)}
            disabled={!isOnline || refreshing}
            icon={!isOnline ? WifiOff : RefreshCw}
            className={refreshing || !isOnline ? "opacity-60 cursor-not-allowed" : ""}
          >
            {!isOnline ? "Offline" : refreshing ? "Syncing..." : "Sync Live"}
          </Button3D>
        </div>
      </div>

      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <WifiOff size={16} className="text-amber-400 shrink-0" />
            <span>
              <strong>Network Disconnected (Offline):</strong> You are currently disconnected from the internet. Displaying cached dashboard telemetry. Real-time updates will automatically resume when connection is restored.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardStats(true)}
            className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition shrink-0 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {error && (
        <div className="card-3d p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-sm text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardStats(true)}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500 text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Primary Financial KPI Cards (Staggered Tilt Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <Tilt3D intensity={14} glareColor="255, 235, 170">
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group border-t-2 border-t-[#d4af37]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Today's Revenue</span>
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-white tracking-tight">
              <AnimatedCounter value={kpis.today_sales} currencySymbol={currencySymbol} />
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">
                <AnimatedInteger value={kpis.today_orders_count} /> orders
              </span>{" "}
              finalized today
            </div>
          </div>
        </Tilt3D>

        {/* Monthly Revenue */}
        <Tilt3D intensity={14} glareColor="255, 235, 170">
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group border-t-2 border-t-amber-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">This Month's Revenue</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">
              <AnimatedCounter value={kpis.month_sales} currencySymbol={currencySymbol} />
            </div>
            <div className="text-xs text-neutral-400 mt-1 truncate">
              Lifetime: <strong className="text-neutral-200">{formatCurrency(kpis.total_sales)}</strong>
            </div>
          </div>
        </Tilt3D>

        {/* Monthly Expenses */}
        <Tilt3D intensity={14} glareColor="255, 235, 170">
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group border-t-2 border-t-rose-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Monthly Expenses</span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-rose-400 tracking-tight">
              <AnimatedCounter value={kpis.month_expenses} currencySymbol={currencySymbol} />
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Operating costs this period
            </div>
          </div>
        </Tilt3D>

        {/* Estimated Net Profit */}
        <Tilt3D intensity={14} glareColor="255, 235, 170">
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group border-t-2 border-t-emerald-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Estimated Net Profit</span>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow ${
                  kpis.estimated_profit >= 0
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                }`}
              >
                <Zap size={20} />
              </div>
            </div>
            <div
              className={`text-3xl font-black mt-3 tracking-tight ${
                kpis.estimated_profit >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <AnimatedCounter value={kpis.estimated_profit} currencySymbol={currencySymbol} />
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Sales minus direct operating outlays
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* 4 Secondary Quick Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-3d p-4 rounded-xl border border-[#d4af37]/20 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
            <Package size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              <AnimatedInteger value={kpis.total_products} />
            </div>
            <div className="text-xs text-neutral-400">Total Products</div>
          </div>
        </div>

        <div className="card-3d p-4 rounded-xl border border-[#d4af37]/20 flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              kpis.low_stock_count > 0
                ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div
              className={`text-xl font-bold tracking-tight ${
                kpis.low_stock_count > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              <AnimatedInteger value={kpis.low_stock_count} />
            </div>
            <div className="text-xs text-neutral-400">Low Stock Warnings</div>
          </div>
        </div>

        <div className="card-3d p-4 rounded-xl border border-[#d4af37]/20 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-blue-300 tracking-tight">
              <AnimatedInteger value={kpis.total_customers} />
            </div>
            <div className="text-xs text-neutral-400">Active Customers</div>
          </div>
        </div>

        <div className="card-3d p-4 rounded-xl border border-[#d4af37]/20 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <Boxes size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-300 tracking-tight">
              <AnimatedInteger value={kpis.total_suppliers} />
            </div>
            <div className="text-xs text-neutral-400">Active Suppliers</div>
          </div>
        </div>
      </div>

      {/* Quick Access Bar */}
      <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
          <Sparkles size={14} />
          Accelerated Workflows
        </span>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/products" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-[#d4af37]/30 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#d4af37]/10 transition">
            <Plus size={13} className="text-[#d4af37]" />
            <span>Register Product</span>
          </Link>

          <Link to="/expenses" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-[#d4af37]/30 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#d4af37]/10 transition">
            <Receipt size={13} className="text-[#d4af37]" />
            <span>Record Expense</span>
          </Link>

          <Link to="/customers" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-[#d4af37]/30 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#d4af37]/10 transition">
            <UserPlus size={13} className="text-[#d4af37]" />
            <span>New Customer</span>
          </Link>

          <Link to="/reports" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-[#d4af37]/30 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#d4af37]/10 transition">
            <ArrowUpRight size={13} className="text-[#d4af37]" />
            <span>Financial Reports</span>
          </Link>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Sales Trend */}
        <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-[#d4af37]" />
                7-Day Sales Trajectory
              </h3>
              <p className="text-xs text-neutral-400">Daily transaction volume</p>
            </div>
            <span className="badge-3d-gold text-[10px]">REALTIME</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashGoldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12141c",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(val) => [formatCurrency(val), "Sales"]}
                />
                <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={3} fill="url(#dashGoldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6-Month Monthly Comparison */}
        <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes size={18} className="text-[#d4af37]" />
                6-Month Revenue vs Outlays
              </h3>
              <p className="text-xs text-neutral-400">Operating performance comparison</p>
            </div>
            <span className="badge-3d-gold text-[10px]">FISCAL</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComp} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12141c",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(val) => [formatCurrency(val)]}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable Data Tables Section (Depth) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
          <div className="p-4 bg-black/40 border-b border-[#d4af37]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Recent Sales Orders</h3>
              <span className="badge-3d-gold text-[10px]">Latest 5</span>
            </div>
            <Link to="/orders" className="text-xs font-semibold text-[#d4af37] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              No sales orders finalized today. Complete checkout at POS terminal.
            </div>
          ) : (
            <div className="overflow-x-auto mobile-touch-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d4af37]/20 bg-black/30 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 text-xs">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="table-row-3d hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#d4af37]">{ord.order_number}</td>
                      <td className="py-3 px-4 text-neutral-200">{ord.customer_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-black/50 border border-[#d4af37]/30 text-neutral-300 uppercase text-[10px]">
                          {ord.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                        {formatCurrency(ord.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
          <div className="p-4 bg-black/40 border-b border-[#d4af37]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Low-Stock Warnings</h3>
              {kpis.low_stock_count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-bold text-rose-400">
                  {kpis.low_stock_count} Critical
                </span>
              )}
            </div>
            <Link to="/inventory" className="text-xs font-semibold text-[#d4af37] hover:underline flex items-center gap-1">
              <span>Stock Manager</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              <span>All product inventory levels are healthy!</span>
            </div>
          ) : (
            <div className="overflow-x-auto mobile-touch-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d4af37]/20 bg-black/30 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Stock</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 text-xs">
                  {lowStockItems.map((prod) => (
                    <tr key={prod.id} className="table-row-3d hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-semibold text-neutral-200">{prod.name}</td>
                      <td className="py-3 px-4 text-neutral-400 font-mono">{prod.sku}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-400 font-mono">
                        {prod.stock_quantity}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                          LOW STOCK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
