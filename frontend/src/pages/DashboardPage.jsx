import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
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
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useTheme } from "../context/ThemeContext";
import { Badge, Button, Card, StatsCard, Table } from "../components/ui";

// Smooth 60fps Animated Number Counter
function AnimatedCounter({ value, prefix = "", decimals = 0, duration = 900 }) {
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
      {prefix}
      {displayValue.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isOnline = useOnlineStatus();
  const { isDark } = useTheme();

  const fetchDashboardStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get("/dashboard/");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

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

  // Theme-aware chart stroke & grid colors
  const chartGridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const chartTextColor = isDark ? "#9ca3af" : "#64748b";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton h-10 w-64 rounded-2xl" />
          <div className="skeleton h-10 w-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton h-32 rounded-2xl w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl w-full" />
          <div className="skeleton h-80 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Realtime Telemetry Active
            </span>
            <span className="badge badge-success badge-sm font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping mr-1" />
              LIVE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
            Executive Command Suite
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            Realtime operations, fiscal telemetry, and inventory dynamics for{" "}
            <strong className="text-base-content font-bold">{data?.business?.name || "Smart Business"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/pos">
            <Button variant="gold" icon={ShoppingCart} size="sm">
              Launch POS
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" icon={Plus} size="sm">
              New Product
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchDashboardStats(true)}
            loading={refreshing}
            icon={RefreshCw}
            title="Refresh telemetry"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Today's Revenue"
          value={<AnimatedCounter value={kpis.today_sales} prefix={currencySymbol} decimals={2} />}
          icon={DollarSign}
          trend={kpis.today_orders_count ? `${kpis.today_orders_count} orders today` : "No orders yet"}
          trendPositive={kpis.today_sales > 0}
          accentColor="primary"
        />

        <StatsCard
          title="Monthly Gross Sales"
          value={<AnimatedCounter value={kpis.month_sales} prefix={currencySymbol} decimals={2} />}
          icon={TrendingUp}
          trend={kpis.total_orders_count ? `${kpis.total_orders_count} lifetime orders` : "0 orders"}
          trendPositive={true}
          trendLabel="All channels"
          accentColor="success"
        />

        <StatsCard
          title="Estimated Net Profit"
          value={<AnimatedCounter value={kpis.estimated_profit} prefix={currencySymbol} decimals={2} />}
          icon={Wallet}
          trend={`Operating exp: ${formatCurrency(kpis.month_expenses)}`}
          trendPositive={kpis.estimated_profit >= 0}
          accentColor="info"
        />

        <StatsCard
          title="Stock Health"
          value={<AnimatedCounter value={kpis.low_stock_count} decimals={0} />}
          icon={AlertTriangle}
          trend={kpis.low_stock_count > 0 ? "Requires restocking" : "All stock healthy"}
          trendPositive={kpis.low_stock_count === 0}
          description={`From ${kpis.total_products || 0} catalog products`}
          accentColor={kpis.low_stock_count > 0 ? "warning" : "success"}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Revenue Trend */}
        <Card
          title="7-Day Sales Velocity"
          subtitle="Realtime transactional order volume & revenue trend"
          icon={TrendingUp}
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="date" stroke={chartTextColor} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currencySymbol}${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#12141c" : "#ffffff",
                    borderColor: isDark ? "rgba(212, 175, 55, 0.4)" : "#cbd5e1",
                    borderRadius: "1rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    fontSize: "12px",
                    color: isDark ? "#f5f3ef" : "#0f172a",
                  }}
                  formatter={(val) => [formatCurrency(val), "Sales Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#d4af37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#goldAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 6-Month Comparison (Revenue vs Operating Expenses) */}
        <Card
          title="Trailing 6-Month Fiscal Performance"
          subtitle="Comparative monthly revenue versus operational expenditure"
          icon={DollarSign}
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComp} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="month" stroke={chartTextColor} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currencySymbol}${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#12141c" : "#ffffff",
                    borderColor: isDark ? "rgba(212, 175, 55, 0.4)" : "#cbd5e1",
                    borderRadius: "1rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    fontSize: "12px",
                    color: isDark ? "#f5f3ef" : "#0f172a",
                  }}
                  formatter={(val, name) => [
                    formatCurrency(val),
                    name === "revenue" ? "Sales Revenue" : "Operating Expenses",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#d4af37" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Operational Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Stream (2 Columns) */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Sales Orders"
            subtitle="Latest finalized transactions from POS and online channels"
            icon={Receipt}
            action={
              <Link to="/orders">
                <Button variant="ghost" size="xs" iconRight={ArrowRight}>
                  View All Orders
                </Button>
              </Link>
            }
          >
            <Table
              data={recentOrders}
              columns={[
                {
                  header: "Order #",
                  key: "order_number",
                  render: (row) => (
                    <span className="font-mono font-bold text-primary">{row.order_number}</span>
                  ),
                },
                {
                  header: "Customer",
                  key: "customer_name",
                  render: (row) => (
                    <span className="font-medium text-base-content">
                      {row.customer_name || "Walk-in Customer"}
                    </span>
                  ),
                },
                {
                  header: "Total",
                  key: "total_amount",
                  render: (row) => (
                    <span className="font-bold text-base-content">{formatCurrency(row.total_amount)}</span>
                  ),
                },
                {
                  header: "Method",
                  key: "payment_method",
                  render: (row) => (
                    <span className="badge badge-neutral text-[10px] uppercase font-bold">
                      {row.payment_method}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  key: "status",
                  render: (row) => <Badge status={row.status}>{row.status}</Badge>,
                },
                {
                  header: "Time",
                  key: "created_at",
                  render: (row) => (
                    <span className="text-xs text-base-content/60">{row.created_at}</span>
                  ),
                },
              ]}
              emptyMessage="No recent orders found"
              emptyDescription="Orders completed at the POS terminal will appear here in real-time."
            />
          </Card>
        </div>

        {/* Low Stock Watchlist (1 Column) */}
        <div className="lg:col-span-1">
          <Card
            title="Low Stock Watchlist"
            subtitle="Products reaching replenishment threshold"
            icon={AlertTriangle}
            action={
              <Link to="/inventory">
                <Button variant="ghost" size="xs" iconRight={ArrowRight}>
                  Audit
                </Button>
              </Link>
            }
          >
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-success/10 text-success mb-2">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-base-content">Inventory Optimal</h4>
                <p className="text-xs text-base-content/60 mt-1 max-w-xs">
                  All catalog items currently satisfy their required minimum safety stock levels.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-base-300/40 border border-base-300 hover:border-warning/40 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-base-content truncate">{prod.name}</div>
                      <div className="text-[10px] text-base-content/50 font-mono mt-0.5">
                        SKU: {prod.sku}
                      </div>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <Badge status="low_stock" size="xs">
                        {prod.stock_quantity} left
                      </Badge>
                      <div className="text-[10px] text-base-content/50 mt-0.5">
                        Min: {prod.minimum_stock}
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/inventory" className="block pt-2">
                  <Button variant="outline" size="xs" fullWidth iconRight={ArrowRight}>
                    Go to Restock Management
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
