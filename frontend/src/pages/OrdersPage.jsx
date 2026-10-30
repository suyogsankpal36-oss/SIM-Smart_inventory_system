import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
  XCircle,
} from "lucide-react";
import salesService from "../services/salesService";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Input, Modal, Select, StatsCard, Table } from "../components/ui";

export default function OrdersPage() {
  const { isAdmin, isManager } = useAuth();
  const canCancel = isAdmin || isManager;

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    total_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Cancel Order Modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, paymentFilter]);

  const fetchSummary = async () => {
    try {
      const data = await salesService.getOrderSummary();
      if (data) setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter !== "all") params.payment_method = paymentFilter;

      const data = await salesService.getOrders(params);
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetail = async (order) => {
    try {
      setSelectedOrder(order);
      const detail = await salesService.getOrder(order.id);
      setSelectedOrder(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;

    try {
      setCancelling(true);
      await salesService.cancelOrder(cancelTarget.id, {
        reason: cancelReason.trim() || "Customer requested order cancellation",
      });
      toast.success(`Order #${cancelTarget.order_number} cancelled and stock restocked.`);
      setCancelTarget(null);
      setCancelReason("");
      fetchSummary();
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <Receipt className="w-3 h-3 mr-1" />
              Transactions & Revenue Ledger
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            Sales Orders History
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            Audit historical point-of-sale checkouts, itemized breakdowns, and cancellation restocks.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={summary.total_orders || 0}
          icon={Receipt}
          description="All-time transactions"
          accentColor="primary"
        />
        <StatsCard
          title="Completed Sales"
          value={summary.completed_orders || 0}
          icon={CheckCircle2}
          description="Finalized orders"
          accentColor="success"
        />
        <StatsCard
          title="Gross Revenue"
          value={`₹${Number(summary.total_revenue || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Net of discounts"
          accentColor="info"
        />
        <StatsCard
          title="Cancelled Orders"
          value={summary.cancelled_orders || 0}
          icon={XCircle}
          description="Restocked to warehouse"
          accentColor="error"
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by order #, customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-100 text-base-content"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card</option>
              <option value="upi">UPI / QR</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card bodyClassName="p-0">
        <Table
          loading={loading}
          data={orders}
          columns={[
            {
              header: "Order Number",
              key: "order_number",
              render: (row) => (
                <span className="font-mono font-bold text-primary">{row.order_number}</span>
              ),
            },
            {
              header: "Customer",
              key: "customer_name",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-base-content/50" />
                  <span className="font-medium text-base-content">
                    {row.customer?.name || row.customer_name || "Walk-in Customer"}
                  </span>
                </div>
              ),
            },
            {
              header: "Total Amount",
              key: "total_amount",
              render: (row) => (
                <div>
                  <span className="font-bold text-base-content">
                    ₹{Number(row.total_amount || 0).toFixed(2)}
                  </span>
                  {Number(row.discount) > 0 && (
                    <div className="text-[10px] text-success">
                      Disc: -₹{Number(row.discount).toFixed(2)}
                    </div>
                  )}
                </div>
              ),
            },
            {
              header: "Payment Mode",
              key: "payment_method",
              render: (row) => (
                <span className="badge badge-neutral text-xs font-bold uppercase">
                  {row.payment_method}
                </span>
              ),
            },
            {
              header: "Date & Time",
              key: "created_at",
              render: (row) => (
                <span className="text-xs text-base-content/70">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              ),
            },
            {
              header: "Status",
              key: "status",
              render: (row) => <Badge status={row.status}>{row.status?.toUpperCase()}</Badge>,
            },
            {
              header: "Actions",
              key: "actions",
              align: "right",
              render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openOrderDetail(row)}
                    className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                    title="View Itemized Order Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canCancel && row.status === "completed" && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(row)}
                      className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                      title="Cancel Order & Restock"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          emptyMessage="No orders found"
          emptyDescription="Transactions finalized at the POS terminal will appear here."
        />
      </Card>

      {/* Order Itemized Receipt Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details & Receipt"
        subtitle={`Order #${selectedOrder?.order_number || ""}`}
        maxWidth="max-w-lg"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} icon={Printer}>
              Print Invoice
            </Button>
            <Button variant="primary" size="sm" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs text-base-content">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-base-100 border border-base-300">
              <div>
                <span className="text-base-content/50 block">Customer:</span>
                <span className="font-bold">
                  {selectedOrder.customer?.name || selectedOrder.customer_name || "Walk-in Customer"}
                </span>
              </div>
              <div>
                <span className="text-base-content/50 block">Cashier / Staff:</span>
                <span className="font-bold">{selectedOrder.created_by_username || "Staff"}</span>
              </div>
              <div>
                <span className="text-base-content/50 block">Payment Mode:</span>
                <span className="font-bold uppercase">{selectedOrder.payment_method}</span>
              </div>
              <div>
                <span className="text-base-content/50 block">Order Status:</span>
                <Badge status={selectedOrder.status}>{selectedOrder.status?.toUpperCase()}</Badge>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-base-content/70 block mb-2">
                Itemized Line Items
              </span>
              <div className="overflow-x-auto rounded-xl border border-base-300">
                <table className="table table-xs w-full">
                  <thead>
                    <tr className="bg-base-300/40 border-b border-base-300">
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Tax</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((it, idx) => (
                      <tr key={idx} className="border-b border-base-300/30">
                        <td>
                          <div className="font-bold">
                            {it.product_name || it.product?.name || "Product"}
                          </div>
                          <div className="font-mono text-[10px] text-base-content/50">
                            {it.product_sku || it.product?.sku}
                          </div>
                        </td>
                        <td className="text-center font-bold">{it.quantity}</td>
                        <td className="text-right">₹{Number(it.price || 0).toFixed(2)}</td>
                        <td className="text-right">₹{Number(it.tax || 0).toFixed(2)}</td>
                        <td className="text-right font-bold">₹{Number(it.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Totals */}
            <div className="p-3 rounded-xl bg-base-100 border border-base-300 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax:</span>
                <span>₹{Number(selectedOrder.tax || 0).toFixed(2)}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount Applied:</span>
                  <span>-₹{Number(selectedOrder.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="divider my-1 opacity-40" />
              <div className="flex justify-between font-extrabold text-sm text-primary">
                <span>Grand Total:</span>
                <span>₹{Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Order & Restock Inventory"
        subtitle={`Order #${cancelTarget?.order_number || ""}`}
      >
        <form onSubmit={handleCancelOrder} className="space-y-4">
          <p className="text-xs text-base-content/80 leading-relaxed">
            Cancelling this order will mark the invoice as void, refund customer analytics, and
            automatically increment the warehouse inventory for all associated line items.
          </p>

          <Input
            label="Cancellation Reason"
            placeholder="e.g. Customer returned items, incorrect product purchased, etc."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>
              Keep Order
            </Button>
            <Button type="submit" variant="danger" loading={cancelling}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
