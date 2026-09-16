import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FileText,
  Search,
  Filter,
  Eye,
  XCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  X,
  Receipt,
  Printer,
} from "lucide-react";
import salesService from "../services/salesService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

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
      setSummary(data);
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
      await salesService.cancelOrder(cancelTarget.id, cancelReason);
      toast.success(`Order ${cancelTarget.order_number} cancelled & stock restored!`);
      setCancelTarget(null);
      setCancelReason("");
      fetchOrders();
      fetchSummary();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Could not cancel order.";
      toast.error(detail);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }} className="text-gradient-gold">
            Sales Orders & History
          </h1>
          <p style={{ color: "#a39d91", fontSize: "0.875rem", marginTop: "0.35rem" }}>
            Audit all finalized customer transactions, itemized sales snapshots, and refund/restocking workflows.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button3D variant="gold" size="sm" icon={ShoppingBag} onClick={() => window.location.href = "/pos"}>
            New POS Sale
          </Button3D>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <Tilt3D scale={1.03} maxTilt={10}>
          <div
            className="card-3d card-3d-interactive"
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(153, 101, 21, 0.15) 100%)",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                color: "#d4af37",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateZ(18px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <ShoppingBag size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Orders
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f5f3ef" }}>
                {summary.total_orders}
              </div>
            </div>
          </div>
        </Tilt3D>

        <Tilt3D scale={1.03} maxTilt={10}>
          <div
            className="card-3d card-3d-interactive"
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateZ(18px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Completed Sales
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#10b981" }}>
                {summary.completed_orders}
              </div>
            </div>
          </div>
        </Tilt3D>

        <Tilt3D scale={1.03} maxTilt={10}>
          <div
            className="card-3d card-3d-interactive"
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateZ(18px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <XCircle size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cancelled / Refunded
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ef4444" }}>
                {summary.cancelled_orders}
              </div>
            </div>
          </div>
        </Tilt3D>

        <Tilt3D scale={1.03} maxTilt={10}>
          <div
            className="card-3d card-3d-interactive"
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 130, 15, 0.2) 100%)",
                border: "1px solid rgba(212, 175, 55, 0.5)",
                color: "#f7df8f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateZ(18px)",
                boxShadow: "0 4px 14px rgba(212, 175, 55, 0.25)",
              }}
            >
              <DollarSign size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Revenue
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800 }} className="text-gradient-gold">
                ₹{Number(summary.total_revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card-3d-glass"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "14px",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#d4af37",
            }}
          />
          <input
            type="text"
            placeholder="Search by order #, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem 0.6rem 2.4rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <option value="all">All Order Status</option>
            <option value="completed">Completed Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div
        className="card-3d"
        style={{
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(18, 20, 28, 0.95)", borderBottom: "1px solid rgba(212, 175, 55, 0.2)" }}>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  ORDER #
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  CUSTOMER
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  DATE & TIME
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  ITEMS
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  PAYMENT
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  STATUS
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  AMOUNT
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "#d4af37",
                    textAlign: "right",
                    letterSpacing: "0.05em",
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3.5rem", textAlign: "center", color: "#a39d91" }}>
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3.5rem", textAlign: "center", color: "#a39d91" }}>
                    <ShoppingBag size={44} style={{ color: "rgba(212, 175, 55, 0.4)", margin: "0 auto 0.75rem" }} />
                    <div>No sales orders found matching criteria.</div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isCompleted = o.status === "completed";

                  return (
                    <tr
                      key={o.id}
                      className="table-row-3d"
                      style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.12)" }}
                    >
                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontWeight: 800, color: "#f7df8f" }}>{o.order_number}</span>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 700, color: "#f5f3ef", fontSize: "0.875rem" }}>
                          {o.customer_name}
                        </div>
                        {o.customer_phone && (
                          <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>{o.customer_phone}</div>
                        )}
                      </td>

                      <td style={{ padding: "1rem", fontSize: "0.8125rem", color: "#a39d91", whiteSpace: "nowrap" }}>
                        {new Date(o.created_at).toLocaleString()}
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge-3d"
                          style={{
                            background: "rgba(212, 175, 55, 0.12)",
                            color: "#f5f3ef",
                            border: "1px solid rgba(212, 175, 55, 0.25)",
                          }}
                        >
                          {o.items ? o.items.length : "—"} items
                        </span>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge-3d-gold"
                        >
                          {o.payment_method_display}
                        </span>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge-3d"
                          style={{
                            background: isCompleted ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: isCompleted ? "#34d399" : "#f87171",
                            border: `1px solid ${isCompleted ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                          }}
                        >
                          {isCompleted ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {o.status_display}
                        </span>
                      </td>

                      <td style={{ padding: "1rem", fontWeight: 800, color: "#f7df8f", fontSize: "0.9375rem" }}>
                        ₹{parseFloat(o.total_amount).toFixed(2)}
                      </td>

                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                          <Button3D
                            variant="dark"
                            size="sm"
                            icon={Eye}
                            onClick={() => openOrderDetail(o)}
                            title="View Order Details"
                          >
                            View
                          </Button3D>
                          {canCancel && isCompleted && (
                            <Button3D
                              variant="danger"
                              size="sm"
                              icon={RotateCcw}
                              onClick={() => {
                                setCancelTarget(o);
                                setCancelReason("");
                              }}
                              title="Cancel & Restock Order"
                            >
                              Cancel
                            </Button3D>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: "1rem",
            perspective: "1200px",
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="card-3d"
            style={{
              width: "100%",
              maxWidth: "660px",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: "16px",
              animation: "perspectiveSlideIn 0.35s ease forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }} className="text-gradient-gold">
                  Order Details: {selectedOrder.order_number}
                </h3>
                <div style={{ fontSize: "0.75rem", color: "#a39d91", marginTop: "0.25rem" }}>
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()} • Cashier: {selectedOrder.created_by_name}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Customer & Status Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  background: "rgba(20, 24, 34, 0.8)",
                  padding: "1.1rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(212, 175, 55, 0.2)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#d4af37", fontWeight: 800, letterSpacing: "0.05em" }}>CUSTOMER</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f5f3ef", marginTop: "0.2rem" }}>
                    {selectedOrder.customer_name}
                  </div>
                  {selectedOrder.customer_phone && (
                    <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>{selectedOrder.customer_phone}</div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#d4af37", fontWeight: 800, letterSpacing: "0.05em" }}>PAYMENT & STATUS</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f7df8f", marginTop: "0.2rem" }}>
                    {selectedOrder.payment_method_display}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: selectedOrder.status === "completed" ? "#34d399" : "#f87171",
                    }}
                  >
                    Status: {selectedOrder.status_display}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 800, color: "#d4af37", marginBottom: "0.5rem", letterSpacing: "0.03em" }}>
                  Itemized Products
                </h4>
                <div style={{ border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: "10px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                    <thead style={{ background: "rgba(18, 20, 28, 0.95)" }}>
                      <tr>
                        <th style={{ padding: "0.75rem", textAlign: "left", color: "#d4af37" }}>PRODUCT</th>
                        <th style={{ padding: "0.75rem", textAlign: "center", color: "#d4af37" }}>QTY</th>
                        <th style={{ padding: "0.75rem", textAlign: "right", color: "#d4af37" }}>PRICE</th>
                        <th style={{ padding: "0.75rem", textAlign: "right", color: "#d4af37" }}>TAX</th>
                        <th style={{ padding: "0.75rem", textAlign: "right", color: "#d4af37" }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id} style={{ borderTop: "1px solid rgba(212, 175, 55, 0.1)" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <div style={{ fontWeight: 700, color: "#f5f3ef" }}>{item.product_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>
                              <code>{item.product_sku}</code>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: 800, color: "#f7df8f" }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "right", color: "#e5e7eb" }}>
                            ₹{parseFloat(item.price).toFixed(2)}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "right", color: "#a39d91" }}>
                            ₹{parseFloat(item.tax || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 800, color: "#f7df8f" }}>
                            ₹{parseFloat(item.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div
                style={{
                  background: "rgba(20, 24, 34, 0.8)",
                  padding: "1.1rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(212, 175, 55, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                  fontSize: "0.875rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#a39d91" }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 700, color: "#f5f3ef" }}>
                    ₹{parseFloat(selectedOrder.subtotal).toFixed(2)}
                  </span>
                </div>
                {parseFloat(selectedOrder.discount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#f87171" }}>
                    <span>Discount:</span>
                    <span>-₹{parseFloat(selectedOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", color: "#a39d91" }}>
                  <span>GST Tax:</span>
                  <span style={{ fontWeight: 700, color: "#f5f3ef" }}>
                    ₹{parseFloat(selectedOrder.tax).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid rgba(212, 175, 55, 0.25)",
                    fontWeight: 800,
                    fontSize: "1.15rem",
                  }}
                >
                  <span style={{ color: "#d4af37" }}>Grand Total:</span>
                  <span className="text-gradient-gold">
                    ₹{parseFloat(selectedOrder.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Linked Invoice */}
              {selectedOrder.invoice && (
                <div
                  className="badge-3d-gold"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.85rem 1.1rem",
                    borderRadius: "10px",
                    width: "100%",
                  }}
                >
                  <span>Linked Tax Invoice: <strong>{selectedOrder.invoice.invoice_number}</strong></span>
                  <Button3D variant="gold" size="sm" onClick={() => window.location.href = "/invoices"}>
                    Go to Invoices
                  </Button3D>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 65,
            padding: "1rem",
            perspective: "1200px",
          }}
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <div
            className="card-3d"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "1.75rem",
              borderRadius: "16px",
              animation: "perspectiveSlideIn 0.3s ease forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#ef4444" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#f87171" }}>
                  Cancel Order {cancelTarget.order_number}?
                </h3>
              </div>
            </div>

            <p style={{ color: "#a39d91", fontSize: "0.875rem", margin: "1.25rem 0", lineHeight: 1.5 }}>
              Cancelling will reverse this sale of <strong style={{ color: "#f7df8f" }}>₹{parseFloat(cancelTarget.total_amount).toFixed(2)}</strong>.
              All items will be <strong style={{ color: "#34d399" }}>automatically restocked</strong> back into warehouse inventory,
              and a Return transaction will be logged in the audit trail.
            </p>

            <form onSubmit={handleCancelOrder}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                Cancellation Reason:
              </label>
              <input
                type="text"
                placeholder="e.g. Customer returned items, Cashier input error"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <Button3D
                  variant="dark"
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelling}
                >
                  Back
                </Button3D>
                <Button3D
                  variant="danger"
                  type="submit"
                  loading={cancelling}
                >
                  Confirm Cancellation
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
