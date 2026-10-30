import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  History,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import inventoryService from "../services/inventoryService";
import productService from "../services/productService";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Input, Modal, Select, StatsCard, Table } from "../components/ui";

export default function InventoryPage() {
  const { isAdmin, isManager } = useAuth();
  const canAdjust = isAdmin || isManager;

  const [activeTab, setActiveTab] = useState("levels"); // "levels" | "history"

  // Stock Levels State
  const [stockItems, setStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_cost_valuation: 0,
    total_retail_valuation: 0,
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
  const [adjustmentType, setAdjustmentType] = useState("stock_in");
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
      if (summaryData) setSummary(summaryData);
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
      if (logTypeFilter !== "all") params.transaction_type = logTypeFilter;
      const data = await inventoryService.getTransactions(params);
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory movement log.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    try {
      setSubmitting(true);
      await inventoryService.adjustStock({
        product: selectedProduct.id,
        adjustment_type: adjustmentType,
        quantity: qty,
        notes: reason.trim() || "Manual adjustment from inventory screen",
      });
      toast.success(`Stock updated for "${selectedProduct.name}"!`);
      setSelectedProduct(null);
      setQuantity("");
      setReason("");
      fetchStockLevels();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Stock adjustment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const potentialProfit =
    (Number(summary.total_retail_valuation) || 0) - (Number(summary.total_cost_valuation) || 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <Boxes className="w-3 h-3 mr-1" />
              Stock Operations & Valuation
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            Inventory & Stock Audit
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            Monitor real-time warehouse counts, cost valuations, and immutable movement logs.
          </p>
        </div>

        {/* Tab Toggle Switch */}
        <div className="join bg-base-200 border border-base-300 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("levels")}
            className={`btn btn-sm join-item rounded-xl font-bold ${
              activeTab === "levels" ? "btn-primary text-black" : "btn-ghost"
            }`}
          >
            <Boxes className="w-4 h-4 mr-1.5" />
            Stock Levels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`btn btn-sm join-item rounded-xl font-bold ${
              activeTab === "history" ? "btn-primary text-black" : "btn-ghost"
            }`}
          >
            <History className="w-4 h-4 mr-1.5" />
            Movement History
          </button>
        </div>
      </div>

      {/* Financial Valuation KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Cost Valuation"
          value={`₹${Number(summary.total_cost_valuation || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Capital tied in stock"
          accentColor="primary"
        />

        <StatsCard
          title="Retail Valuation"
          value={`₹${Number(summary.total_retail_valuation || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={TrendingUp}
          description="Total potential revenue"
          accentColor="success"
        />

        <StatsCard
          title="Potential Gross Margin"
          value={`₹${Math.max(0, potentialProfit).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={TrendingUp}
          description="Retail minus acquisition cost"
          accentColor="info"
        />

        <StatsCard
          title="Replenishment Risk"
          value={Number(summary.low_stock_count || 0) + Number(summary.out_of_stock_count || 0)}
          icon={AlertTriangle}
          trend={
            summary.out_of_stock_count > 0
              ? `${summary.out_of_stock_count} completely depleted`
              : "0 depleted"
          }
          trendPositive={summary.out_of_stock_count === 0}
          accentColor="warning"
        />
      </div>

      {/* Main Tab Content */}
      {activeTab === "levels" ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Filter stock by name or SKU..."
                  value={levelSearch}
                  onChange={(e) => setLevelSearch(e.target.value)}
                  className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-100 text-base-content"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={levelCategory}
                  onChange={(e) => setLevelCategory(e.target.value)}
                  className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={levelStatus}
                  onChange={(e) => setLevelStatus(e.target.value)}
                  className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
                >
                  <option value="all">All Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock (Alert)</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Stock Levels Table */}
          <Card bodyClassName="p-0">
            <Table
              loading={loadingLevels}
              data={stockItems}
              columns={[
                {
                  header: "Product / SKU",
                  key: "name",
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base-content truncate max-w-xs">{row.name}</div>
                        <div className="text-xs font-mono text-primary font-semibold mt-0.5">
                          {row.sku}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Category",
                  key: "category_name",
                  render: (row) => (
                    <span className="text-xs text-base-content/70">
                      {row.category_name || "Uncategorized"}
                    </span>
                  ),
                },
                {
                  header: "Units in Stock",
                  key: "stock_quantity",
                  align: "center",
                  render: (row) => (
                    <div>
                      <span className="font-extrabold text-base text-base-content">
                        {row.stock_quantity}
                      </span>
                      <span className="text-[10px] text-base-content/50 block">
                        Min Threshold: {row.minimum_stock}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Valuation (Cost)",
                  key: "valuation",
                  render: (row) => (
                    <div>
                      <span className="font-bold text-base-content">
                        ₹{(Number(row.purchase_price || 0) * row.stock_quantity).toFixed(2)}
                      </span>
                      <div className="text-[10px] text-base-content/50">
                        Unit: ₹{Number(row.purchase_price || 0).toFixed(2)}
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  key: "status",
                  render: (row) => (
                    <Badge status={row.status}>
                      {String(row.status || "").replace("_", " ").toUpperCase()}
                    </Badge>
                  ),
                },
                ...(canAdjust
                  ? [
                      {
                        header: "Quick Action",
                        key: "actions",
                        align: "right",
                        render: (row) => (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setSelectedProduct(row)}
                            icon={Boxes}
                          >
                            Adjust Stock
                          </Button>
                        ),
                      },
                    ]
                  : []),
              ]}
              emptyMessage="No stock records found"
              emptyDescription="No inventory items match your current filter parameters."
            />
          </Card>
        </div>
      ) : (
        /* History / Movement Log Tab */
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                Filter Movement Type:
              </span>
              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value)}
                className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
              >
                <option value="all">All Transaction Types</option>
                <option value="STOCK_IN">Stock In (Purchases / Restock)</option>
                <option value="STOCK_OUT">Stock Out (Damaged / Discarded)</option>
                <option value="SALE">Sale (POS Deductions)</option>
                <option value="RETURN">Return (Restocked from Cancel)</option>
                <option value="ADJUSTMENT">Physical Adjustment</option>
              </select>
            </div>
          </Card>

          <Card bodyClassName="p-0">
            <Table
              loading={loadingLogs}
              data={logs}
              columns={[
                {
                  header: "Timestamp",
                  key: "created_at",
                  render: (row) => (
                    <div className="text-xs">
                      <span className="font-bold text-base-content block">
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-base-content/50">
                        {new Date(row.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Product Item",
                  key: "product_name",
                  render: (row) => (
                    <div>
                      <div className="font-bold text-base-content">{row.product_name || "Product"}</div>
                      <div className="font-mono text-xs text-primary">{row.product_sku}</div>
                    </div>
                  ),
                },
                {
                  header: "Type",
                  key: "transaction_type",
                  render: (row) => {
                    const isPositive = ["STOCK_IN", "RETURN"].includes(row.transaction_type);
                    return (
                      <span
                        className={`badge badge-sm font-bold ${
                          isPositive ? "badge-success text-black" : "badge-neutral text-base-content"
                        }`}
                      >
                        {row.transaction_type}
                      </span>
                    );
                  },
                },
                {
                  header: "Quantity Delta",
                  key: "quantity",
                  align: "center",
                  render: (row) => {
                    const qty = Number(row.quantity || 0);
                    return (
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          qty > 0 ? "text-success" : "text-error"
                        }`}
                      >
                        {qty > 0 ? `+${qty}` : qty}
                      </span>
                    );
                  },
                },
                {
                  header: "Previous -> New",
                  key: "stock_change",
                  align: "center",
                  render: (row) => (
                    <span className="text-xs font-mono text-base-content/80">
                      {row.previous_stock} &rarr; <strong>{row.new_stock}</strong>
                    </span>
                  ),
                },
                {
                  header: "Reference / User",
                  key: "reference",
                  render: (row) => (
                    <div className="text-xs">
                      <span className="font-medium text-base-content block">
                        {row.reference || "Direct adjustment"}
                      </span>
                      <span className="text-base-content/50">
                        By: {row.user_username || "Staff"}
                      </span>
                    </div>
                  ),
                },
              ]}
              emptyMessage="No transaction logs recorded"
              emptyDescription="Inventory stock updates and POS deductions will appear here in chronological order."
            />
          </Card>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Adjust Inventory Stock"
        subtitle={`Current stock for "${selectedProduct?.name}": ${selectedProduct?.stock_quantity} units`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <Select
            label="Adjustment Type"
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value)}
            options={[
              { value: "stock_in", label: "Stock In (+ Restock from Supplier)" },
              { value: "stock_out", label: "Stock Out (- Damaged / Discarded)" },
              { value: "adjustment", label: "Physical Count Reconciliation (= Set exact)" },
            ]}
          />

          <Input
            label="Quantity Units"
            type="number"
            min="1"
            placeholder="e.g. 50"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Audit Notes / Reference"
            placeholder="e.g. Purchase order PO-9921, routine inventory count, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
