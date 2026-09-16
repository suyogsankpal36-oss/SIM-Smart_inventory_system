import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  BadgePercent,
  BarChart3,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Filter,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import expenseService from "../services/expenseService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

const CATEGORY_STYLES = {
  rent: { label: "Facility Rent", bg: "rgba(212, 175, 55, 0.15)", text: "#F7DF8F", border: "rgba(212, 175, 55, 0.4)", chartColor: "#D4AF37" },
  salary: { label: "Payroll & Salary", bg: "rgba(16, 185, 129, 0.15)", text: "#6ee7b7", border: "rgba(16, 185, 129, 0.4)", chartColor: "#10b981" },
  electricity: { label: "Utilities / Power", bg: "rgba(245, 158, 11, 0.15)", text: "#fde68a", border: "rgba(245, 158, 11, 0.4)", chartColor: "#f59e0b" },
  transportation: { label: "Logistics & Freight", bg: "rgba(14, 165, 233, 0.15)", text: "#7dd3fc", border: "rgba(14, 165, 233, 0.4)", chartColor: "#0ea5e9" },
  marketing: { label: "Marketing / Ads", bg: "rgba(168, 85, 247, 0.15)", text: "#d8b4fe", border: "rgba(168, 85, 247, 0.4)", chartColor: "#a855f7" },
  maintenance: { label: "Equipment Upkeep", bg: "rgba(249, 115, 22, 0.15)", text: "#fdba74", border: "rgba(249, 115, 22, 0.4)", chartColor: "#f97316" },
  other: { label: "General & Misc", bg: "rgba(100, 116, 139, 0.15)", text: "#cbd5e1", border: "rgba(100, 116, 139, 0.4)", chartColor: "#94a3b8" },
};

const PAYMENT_METHOD_LABELS = {
  cash: "Cash Currency",
  upi: "UPI Digital Instant",
  card: "Credit / Debit Card",
  bank_transfer: "Wire / NEFT Transfer",
};

export default function ExpensesPage() {
  const { isAdmin, isManager } = useAuth();
  const canEdit = isAdmin || isManager;

  // Data states
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [datePreset, setDatePreset] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: "rent",
    description: "",
    amount: "",
    payment_method: "cash",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedPaymentMethod, fromDate, toDate]);

  const loadMetadata = async () => {
    try {
      const [cats, pms] = await Promise.all([
        expenseService.getCategories(),
        expenseService.getPaymentMethods(),
      ]);
      setCategoriesList(cats || []);
      setPaymentMethodsList(pms || []);
    } catch (err) {
      console.error("Failed to load options metadata:", err);
    }
  };

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedPaymentMethod) params.payment_method = selectedPaymentMethod;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const [listRes, summaryRes] = await Promise.all([
        expenseService.getExpenses(params),
        expenseService.getSummary(),
      ]);

      const items = Array.isArray(listRes) ? listRes : listRes.results || [];
      setExpenses(items);
      setSummary(summaryRes);
    } catch (err) {
      console.error("Error fetching expense data:", err);
      toast.error("Failed to load expenses data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Date Preset handler
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "all") {
      setFromDate("");
      setToDate("");
    } else if (preset === "today") {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === "this_month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      setFromDate(startOfMonth);
      setToDate(todayStr);
    } else if (preset === "last_month") {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      setFromDate(startOfLastMonth);
      setToDate(endOfLastMonth);
    } else if (preset === "this_year") {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
      setFromDate(startOfYear);
      setToDate(todayStr);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedPaymentMethod("");
    setFromDate("");
    setToDate("");
    setDatePreset("all");
  };

  // Form handling
  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      category: categoriesList[0]?.value || "rent",
      description: "",
      amount: "",
      payment_method: "cash",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      payment_method: exp.payment_method,
      date: exp.date,
      notes: exp.notes || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.description.trim()) {
      errors.description = "Description is required.";
    }
    const num = parseFloat(formData.amount);
    if (!formData.amount || isNaN(num) || num <= 0) {
      errors.amount = "Amount must be a positive number greater than 0.";
    }
    if (!formData.date) {
      errors.date = "Expense date is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        category: formData.category,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount).toFixed(2),
        payment_method: formData.payment_method,
        date: formData.date,
        notes: formData.notes.trim(),
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, payload);
        toast.success("Expense updated successfully!");
      } else {
        await expenseService.createExpense(payload);
        toast.success("Expense recorded successfully!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setFormErrors(serverErrors);
      } else {
        toast.error(err.response?.data?.detail || "Failed to save expense.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handling
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseService.deleteExpense(deleteTarget.id);
      toast.success("Expense record purged successfully.");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to delete expense.");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Chart data
  const categoryData = (summary?.category_breakdown || []).map((cat) => ({
    name: cat.label,
    value: cat.total,
    count: cat.count,
    percentage: cat.percentage,
    color: CATEGORY_STYLES[cat.category]?.chartColor || "#d4af37",
  }));

  const trendData = summary?.monthly_trend || [];

  return (
    <div className="space-y-8 pb-14 text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <Receipt size={14} className="text-[#d4af37]" />
            Operating Outflows & Capital Expenditure
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Expense & Outlay Ledger
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Supervise operating outlays, categorize recurring store costs, and maintain financial discipline across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            icon={RefreshCw}
            className={refreshing ? "opacity-75" : ""}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button3D>

          {canEdit && (
            <Button3D
              variant="gold"
              onClick={openCreateModal}
              icon={Plus}
            >
              Record Expense
            </Button3D>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Today's Outlay</span>
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Calendar size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-white tracking-tight">
              {formatCurrency(summary?.today_total || 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Daily registered expenses
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">This Month</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">
              {formatCurrency(summary?.this_month_total || 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Current billing period
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Recorded</span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Wallet size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-rose-400 tracking-tight">
              {formatCurrency(summary?.total_expenses || 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {summary?.expense_count || 0} vouchers posted
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Primary Category</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Tag size={20} />
              </div>
            </div>
            <div className="text-2xl font-black mt-3 text-emerald-400 tracking-tight truncate">
              {summary?.top_category?.label || "None Recorded"}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {formatCurrency(summary?.top_category?.total || 0)} total
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Visual Analytics: Area Trend + Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 card-3d p-6 rounded-2xl border border-[#d4af37]/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-[#d4af37]" />
                Monthly Expenditure Trajectory
              </h3>
              <p className="text-xs text-neutral-400">Cash outflow timeline over the last 6 months</p>
            </div>
            <span className="badge-3d-gold text-[10px]">Realtime Financials</span>
          </div>

          <div className="h-64 w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                Insufficient data for trend visualization
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12141c",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      borderRadius: "12px",
                      color: "#fff",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                    }}
                    formatter={(val) => [formatCurrency(val), "Outflow"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#D4AF37"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#goldAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut (1 Col) */}
        <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BadgePercent size={18} className="text-[#d4af37]" />
                  Category Allocation
                </h3>
                <p className="text-xs text-neutral-400">Breakdown by expense classification</p>
              </div>
            </div>

            <div className="h-52 w-full">
              {categoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                  No categorical outlays recorded
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0a0b10" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#12141c",
                        border: "1px solid rgba(212, 175, 55, 0.4)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                      formatter={(val, name, item) => [
                        `${formatCurrency(val)} (${item.payload.percentage}%)`,
                        item.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Mini Category Legend List */}
          <div className="mt-2 space-y-1.5 text-xs max-h-28 overflow-y-auto pr-1">
            {categoryData.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-neutral-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className="font-semibold text-neutral-200">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Date Presets */}
      <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 space-y-3">
        {/* Top Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by description, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-[#d4af37]/25 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
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

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
            >
              <option value="" className="bg-[#12141c]">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#12141c]">
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
            >
              <option value="" className="bg-[#12141c]">All Payment Modes</option>
              {paymentMethodsList.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#12141c]">
                  {p.label}
                </option>
              ))}
            </select>

            {/* Presets Pills */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-[#d4af37]/20">
              {["all", "today", "this_month", "last_month", "this_year"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleDatePreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    datePreset === preset
                      ? "bg-[#d4af37] text-black font-bold shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {preset === "all"
                    ? "All Time"
                    : preset === "today"
                    ? "Today"
                    : preset === "this_month"
                    ? "This Month"
                    : preset === "last_month"
                    ? "Last Month"
                    : "This Year"}
                </button>
              ))}
            </div>

            {(search || selectedCategory || selectedPaymentMethod || fromDate || toDate) && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1 text-xs text-[#d4af37] hover:underline font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <RefreshCw size={28} className="animate-spin text-[#d4af37] mb-3" />
            <p className="text-sm text-neutral-400">Loading expense vouchers...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mx-auto mb-3">
              <Receipt size={26} />
            </div>
            <h3 className="text-base font-semibold text-neutral-200">No expense vouchers recorded</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {search || selectedCategory || selectedPaymentMethod
                ? "Try adjusting your search criteria or date range."
                : "Post your first expense voucher to monitor operating overheads."}
            </p>
            {canEdit && !search && !selectedCategory && (
              <Button3D variant="gold" onClick={openCreateModal} className="mt-4">
                Record First Expense
              </Button3D>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#d4af37]/20 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  {canEdit && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4af37]/10 text-sm">
                {expenses.map((exp) => {
                  const style = CATEGORY_STYLES[exp.category] || CATEGORY_STYLES.other;

                  return (
                    <tr key={exp.id} className="table-row-3d hover:bg-white/[0.02] transition">
                      {/* Date */}
                      <td className="py-3 px-4 text-xs text-neutral-300 font-mono">
                        {exp.date}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.chartColor }} />
                          {exp.category_display || style.label}
                        </span>
                      </td>

                      {/* Description & Notes */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-100">{exp.description}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-neutral-400 line-clamp-1 italic">
                            "{exp.notes}"
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-black/40 border border-[#d4af37]/25 text-neutral-300">
                          <CreditCard size={11} className="text-[#d4af37]" />
                          {PAYMENT_METHOD_LABELS[exp.payment_method] || exp.payment_method}
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 text-xs text-neutral-400">
                        {exp.created_by_name || "System"}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-amber-300">
                          {formatCurrency(exp.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-[#d4af37]/10 transition"
                              title="Edit Expense"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(exp)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-lg rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingExpense ? "Modify Expense Voucher" : "Post Operating Expense"}
                  </h3>
                  <p className="text-xs text-neutral-400">Record cash or bank outflow against business operations.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Expense Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#12141c]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                  {formErrors.amount && <p className="text-xs text-rose-400 mt-1">{formErrors.amount}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description / Purpose <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Server hosting renewal, office stationery, diesel for generator"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  required
                />
                {formErrors.description && <p className="text-xs text-rose-400 mt-1">{formErrors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  >
                    {paymentMethodsList.map((p) => (
                      <option key={p.value} value={p.value} className="bg-[#12141c]">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                  {formErrors.date && <p className="text-xs text-rose-400 mt-1">{formErrors.date}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Supplementary Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Invoice numbers, vendor contact or remarks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingExpense ? "Save Changes" : "Post Voucher"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl p-6 border-2 border-rose-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Purge Expense Voucher</h3>
                <p className="text-xs text-neutral-400">Irreversible accounting adjustment</p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 mt-4 leading-relaxed">
              Are you sure you want to permanently delete this expense voucher of{" "}
              <strong className="text-amber-300 font-mono">{formatCurrency(deleteTarget.amount)}</strong> for{" "}
              <strong className="text-white">"{deleteTarget.description}"</strong>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#d4af37]/20">
              <Button3D variant="dark" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button3D>
              <Button3D variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Purging..." : "Confirm Purge"}
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
