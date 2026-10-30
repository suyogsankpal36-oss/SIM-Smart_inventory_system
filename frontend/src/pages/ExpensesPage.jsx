import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Filter,
  PieChart as PieIcon,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Tag,
  Trash2,
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
import expenseService from "../services/expenseService";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Badge, Button, Card, Input, Modal, Select, StatsCard, Table } from "../components/ui";

const CATEGORY_STYLES = {
  rent: { label: "Facility Rent", badge: "badge-primary", chartColor: "#d4af37" },
  salary: { label: "Payroll & Salary", badge: "badge-accent", chartColor: "#10b981" },
  electricity: { label: "Utilities / Power", badge: "badge-warning", chartColor: "#f59e0b" },
  transportation: { label: "Logistics & Freight", badge: "badge-info", chartColor: "#3b82f6" },
  marketing: { label: "Marketing / Ads", badge: "badge-secondary", chartColor: "#ec4899" },
  maintenance: { label: "Equipment Upkeep", badge: "badge-warning", chartColor: "#f97316" },
  other: { label: "General & Misc", badge: "badge-ghost", chartColor: "#64748b" },
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
    else setLoading(true);
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

  const hasActiveFilters = Boolean(search) || Boolean(selectedCategory) || Boolean(selectedPaymentMethod) || Boolean(fromDate) || Boolean(toDate);

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
    value: parseFloat(cat.total),
    count: cat.count,
    percentage: cat.percentage,
    color: CATEGORY_STYLES[cat.category]?.chartColor || "#d4af37",
  }));

  const trendData = summary?.monthly_trend || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Expense & Outlay Ledger
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Supervise operating outlays, categorize recurring store costs, and maintain financial discipline across departments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchData(true)}
            loading={refreshing}
          >
            Refresh
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openCreateModal}
            >
              Record Expense
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Outlay"
          value={formatCurrency(summary?.today_total || 0)}
          icon={Calendar}
          color="primary"
          description="Daily operational spend"
        />
        <StatsCard
          title="This Month"
          value={formatCurrency(summary?.this_month_total || 0)}
          icon={TrendingDown}
          color="secondary"
          description="Current billing cycle"
        />
        <StatsCard
          title="Total Recorded"
          value={formatCurrency(summary?.total_expenses || 0)}
          icon={Wallet}
          color="error"
          description="Cumulative expenditure"
        />
        <StatsCard
          title="Entries Count"
          value={summary?.total_count || expenses.length}
          icon={Receipt}
          color="accent"
          description="Total expense vouchers"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base-content">Monthly Expense Trajectory</h3>
              <p className="text-xs text-base-content/60">Historical outflow evolution over billing months</p>
            </div>
            <div className="badge badge-outline badge-sm">Trailing Months</div>
          </div>
          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                  />
                  <XAxis
                    dataKey="month"
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
                    formatter={(v) => [formatCurrency(v), "Outlay"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#d4af37"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-base-content/40">
                Insufficient trend data to plot chart
              </div>
            )}
          </div>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base-content">Distribution by Category</h3>
              <p className="text-xs text-base-content/60">Breakdown of operational capital</p>
            </div>
            <PieIcon size={16} className="text-primary" />
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#12141c" : "#ffffff",
                      borderColor: isDark ? "rgba(212,175,55,0.3)" : "#e2e8f0",
                      borderRadius: "0.5rem",
                      color: isDark ? "#f5f3ef" : "#0f172a",
                      fontSize: "0.85rem",
                    }}
                    formatter={(v) => [formatCurrency(v), "Total"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-base-content/40">No category breakdown available</div>
            )}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search description, recipient, remarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-bordered input-sm w-full pl-10 bg-base-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["all", "today", "this_month", "last_month", "this_year"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleDatePreset(preset)}
                  className={`btn btn-xs ${
                    datePreset === preset ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {preset.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-base-content/10">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select select-bordered select-sm bg-base-100"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="select select-bordered select-sm bg-base-100"
            >
              <option value="">All Payment Methods</option>
              {paymentMethodsList.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-base-content/60">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="input input-bordered input-xs bg-base-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-base-content/60">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="input input-bordered input-xs bg-base-100"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <Table
        loading={loading}
        data={expenses}
        emptyTitle="No expense vouchers recorded"
        emptyDescription={
          hasActiveFilters
            ? "Try resetting the filters or date range parameters."
            : "Keep an exact audit trail of all store outlays and supplier disbursements."
        }
        emptyAction={
          canEdit && !hasActiveFilters ? (
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
              Record Expense
            </Button>
          ) : null
        }
        columns={[
          {
            header: "Date",
            render: (exp) => (
              <div className="text-xs font-medium text-base-content/80 whitespace-nowrap">
                {exp.date}
              </div>
            ),
          },
          {
            header: "Category & Description",
            render: (exp) => {
              const catCfg = CATEGORY_STYLES[exp.category] || {
                label: exp.category,
                badge: "badge-ghost",
              };
              return (
                <div>
                  <div className="font-semibold text-base-content leading-snug">
                    {exp.description}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${catCfg.badge} badge-xs font-semibold`}>
                      {catCfg.label}
                    </span>
                    {exp.notes && (
                      <span className="text-xs text-base-content/50 truncate max-w-[200px]">
                        {exp.notes}
                      </span>
                    )}
                  </div>
                </div>
              );
            },
          },
          {
            header: "Payment Method",
            render: (exp) => (
              <span className="badge badge-outline badge-sm text-xs capitalize">
                {PAYMENT_METHOD_LABELS[exp.payment_method] || exp.payment_method}
              </span>
            ),
          },
          {
            header: "Recorded By",
            render: (exp) => (
              <span className="text-xs text-base-content/70">
                {exp.recorded_by_name || "System"}
              </span>
            ),
          },
          {
            header: "Amount",
            className: "text-right",
            render: (exp) => (
              <div className="font-mono font-bold text-error text-sm">
                -{formatCurrency(exp.amount)}
              </div>
            ),
          },
          {
            header: "Actions",
            className: "text-right",
            render: (exp) => (
              <div className="flex items-center justify-end gap-1">
                {canEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-square btn-xs"
                      onClick={() => openEditModal(exp)}
                      title="Edit Expense"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-square btn-xs text-error hover:bg-error/10"
                      onClick={() => setDeleteTarget(exp)}
                      title="Delete Expense"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Record / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? "Edit Expense Voucher" : "Record New Expense Outlay"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Expense Category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categoriesList.map((c) => ({ value: c.value, label: c.label }))}
            />
            <Select
              label="Disbursement Method"
              required
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              options={paymentMethodsList.map((p) => ({ value: p.value, label: p.label }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              error={formErrors.amount}
            />
            <Input
              label="Expense Date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              error={formErrors.date}
            />
          </div>

          <Input
            label="Expense Description / Purpose"
            required
            placeholder="e.g. October Store Electric Utility Invoice"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={formErrors.description}
          />

          <div>
            <label className="label text-xs font-semibold uppercase text-base-content/70">
              Audit Notes & Reference Number
            </label>
            <textarea
              rows={2}
              placeholder="Enter receipt/bill number, vendor tax memo, or payment reference..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea textarea-bordered w-full bg-base-100 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-base-content/10">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingExpense ? "Update Voucher" : "Commit Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Purge Expense Voucher"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-error/10 text-error border border-error/20">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              Are you sure you want to purge voucher{" "}
              <strong className="font-bold">"{deleteTarget?.description}"</strong> for{" "}
              <strong className="font-bold">{formatCurrency(deleteTarget?.amount)}</strong>? This will permanently remove the record from ledger calculations.
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Purge Voucher
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
