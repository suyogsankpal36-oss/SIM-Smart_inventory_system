import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FileText,
  Search,
  Printer,
  Eye,
  DollarSign,
  Receipt,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  X,
  Award,
} from "lucide-react";
import salesService from "../services/salesService";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Print / View Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const data = await salesService.getInvoices(params);
      setInvoices(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  const openInvoiceModal = async (inv) => {
    try {
      setSelectedInvoice(inv);
      const detail = await salesService.getInvoice(inv.id);
      setSelectedInvoice(detail);
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalInvoices = invoices.length;
  const totalValue = invoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
  const avgValue = totalInvoices > 0 ? totalValue / totalInvoices : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }} className="text-gradient-gold">
          Tax Invoices & Receipts
        </h1>
        <p style={{ color: "#a39d91", fontSize: "0.875rem", marginTop: "0.35rem" }}>
          Browse sequential tax invoices, review GST compliance breakdowns, and print or save PDF invoices.
        </p>
      </div>

      {/* Metric Cards */}
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
              <Receipt size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Invoices
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f5f3ef" }}>{totalInvoices}</div>
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
              <DollarSign size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Invoiced Amount
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#10b981" }}>
                ₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
              <Building size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Average Value
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800 }} className="text-gradient-gold">
                ₹{avgValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Search Toolbar */}
      <div
        className="card-3d-glass"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          borderRadius: "14px",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
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
            placeholder="Search by invoice number, order number, customer name..."
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
      </div>

      {/* Invoices Table */}
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
                  INVOICE #
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  ORDER #
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  CUSTOMER
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  DATE
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  PAYMENT
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
                  <td colSpan={7} style={{ padding: "3.5rem", textAlign: "center", color: "#a39d91" }}>
                    Loading tax invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3.5rem", textAlign: "center", color: "#a39d91" }}>
                    <Receipt size={44} style={{ color: "rgba(212, 175, 55, 0.4)", margin: "0 auto 0.75rem" }} />
                    <div>No invoices generated yet.</div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="table-row-3d"
                    style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.12)" }}
                  >
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#f7df8f" }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: "1rem", color: "#a39d91", fontSize: "0.875rem" }}>
                      {inv.order_number}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700, color: "#f5f3ef", fontSize: "0.875rem" }}>
                        {inv.customer_name}
                      </div>
                      {inv.customer_gst && (
                        <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>GSTIN: {inv.customer_gst}</div>
                      )}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8125rem", color: "#a39d91", whiteSpace: "nowrap" }}>
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className="badge-3d-gold">
                        {inv.payment_method_display}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#f7df8f", fontSize: "0.9375rem" }}>
                      ₹{parseFloat(inv.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <Button3D
                        variant="gold"
                        size="sm"
                        icon={Printer}
                        onClick={() => openInvoiceModal(inv)}
                      >
                        View & Print
                      </Button3D>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Formal Tax Invoice Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: "1rem",
            perspective: "1200px",
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="card-3d"
            style={{
              width: "100%",
              maxWidth: "780px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "16px",
              animation: "perspectiveSlideIn 0.35s ease forwards",
              background: "#141722",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(212, 175, 55, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.75rem",
                borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
                background: "rgba(18, 20, 28, 0.95)",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Award size={18} color="#d4af37" />
                <span style={{ fontWeight: 800 }} className="text-gradient-gold">
                  Official Tax Invoice: {selectedInvoice.invoice_number}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Button3D
                  variant="gold"
                  size="sm"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print / Save PDF
                </Button3D>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    background: "rgba(212, 175, 55, 0.1)",
                    color: "#d4af37",
                    borderRadius: "8px",
                    padding: "0.45rem 0.65rem",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Formal Tax Invoice Document in Dark Gold Paper */}
            <div style={{ padding: "2rem", color: "#f5f3ef", fontFamily: "sans-serif" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid rgba(212, 175, 55, 0.4)", paddingBottom: "1.5rem", marginBottom: "1.75rem" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }} className="text-gradient-gold">
                    SMART BUSINESS ENTERPRISE
                  </h1>
                  <div style={{ fontSize: "0.875rem", color: "#a39d91", marginTop: "0.35rem" }}>
                    Commercial Boulevard, Sector 18, Business Hub
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#a39d91" }}>
                    GSTIN: <strong style={{ color: "#d4af37" }}>27AAAAA0000A1Z5</strong> • Phone: +91 98765 00000
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                    TAX INVOICE
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, marginTop: "0.25rem", color: "#f7df8f" }}>
                    Invoice #: {selectedInvoice.invoice_number}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#a39d91" }}>
                    Date: {new Date(selectedInvoice.invoice_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#a39d91" }}>
                    Order Ref: {selectedInvoice.order_number}
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.75rem" }}>
                <div style={{ background: "rgba(20, 24, 34, 0.8)", padding: "1.1rem", borderRadius: "12px", border: "1px solid rgba(212, 175, 55, 0.2)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", textTransform: "uppercase", marginBottom: "0.35rem", letterSpacing: "0.05em" }}>
                    BILLED TO:
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#f5f3ef" }}>
                    {selectedInvoice.customer_name}
                  </div>
                  {selectedInvoice.customer_phone && (
                    <div style={{ fontSize: "0.8125rem", color: "#a39d91" }}>Phone: {selectedInvoice.customer_phone}</div>
                  )}
                  {selectedInvoice.customer_gst && (
                    <div style={{ fontSize: "0.8125rem", color: "#a39d91" }}>
                      GSTIN: <strong style={{ color: "#d4af37" }}>{selectedInvoice.customer_gst}</strong>
                    </div>
                  )}
                  {selectedInvoice.customer_address && (
                    <div style={{ fontSize: "0.8125rem", color: "#a39d91", marginTop: "0.25rem" }}>
                      {[selectedInvoice.customer_address, selectedInvoice.customer_city, selectedInvoice.customer_state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>

                <div style={{ background: "rgba(20, 24, 34, 0.8)", padding: "1.1rem", borderRadius: "12px", border: "1px solid rgba(212, 175, 55, 0.2)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", textTransform: "uppercase", marginBottom: "0.35rem", letterSpacing: "0.05em" }}>
                    PAYMENT & DISPATCH DETAILS:
                  </div>
                  <div style={{ fontSize: "0.8125rem", margin: "0.35rem 0" }}>
                    <span style={{ color: "#a39d91" }}>Payment Mode:</span>{" "}
                    <strong style={{ color: "#f7df8f" }}>{selectedInvoice.payment_method_display}</strong>
                  </div>
                  <div style={{ fontSize: "0.8125rem", margin: "0.35rem 0" }}>
                    <span style={{ color: "#a39d91" }}>Cashier / Sales rep:</span>{" "}
                    <strong>{selectedInvoice.cashier_name}</strong>
                  </div>
                  <div style={{ fontSize: "0.8125rem", margin: "0.35rem 0" }}>
                    <span style={{ color: "#a39d91" }}>Payment Status:</span>{" "}
                    <span style={{ color: "#34d399", fontWeight: 800 }}>Paid in Full</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: "12px", overflow: "hidden", marginBottom: "1.75rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                  <thead style={{ background: "rgba(18, 20, 28, 0.95)", borderBottom: "1px solid rgba(212, 175, 55, 0.2)" }}>
                    <tr>
                      <th style={{ padding: "0.75rem", textAlign: "left", width: "40px", color: "#d4af37" }}>#</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", color: "#d4af37" }}>ITEM DESCRIPTION</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", color: "#d4af37" }}>SKU</th>
                      <th style={{ padding: "0.75rem", textAlign: "center", color: "#d4af37" }}>QTY</th>
                      <th style={{ padding: "0.75rem", textAlign: "right", color: "#d4af37" }}>RATE (₹)</th>
                      <th style={{ padding: "0.75rem", textAlign: "right", color: "#d4af37" }}>TAX (₹)</th>
                      <th style={{ padding: "0.75rem", textAlign: "right", color: "#d4af37" }}>AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.1)" }}>
                        <td style={{ padding: "0.75rem", color: "#a39d91" }}>{idx + 1}</td>
                        <td style={{ padding: "0.75rem", fontWeight: 700, color: "#f5f3ef" }}>{item.product_name}</td>
                        <td style={{ padding: "0.75rem", color: "#a39d91" }}>
                          <code>{item.product_sku}</code>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: 800, color: "#f7df8f" }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "right", color: "#e5e7eb" }}>
                          {parseFloat(item.price).toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "right", color: "#a39d91" }}>
                          {parseFloat(item.tax || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 800, color: "#f7df8f" }}>
                          {parseFloat(item.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax Breakup */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "2rem" }}>
                {/* GST Split Box */}
                <div style={{ flex: 1, background: "rgba(20, 24, 34, 0.8)", padding: "1.1rem", borderRadius: "12px", border: "1px solid rgba(212, 175, 55, 0.2)", fontSize: "0.8125rem" }}>
                  <div style={{ fontWeight: 800, marginBottom: "0.45rem", color: "#d4af37" }}>
                    GST Tax Breakdown (Intra-State)
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "0.25rem 0", color: "#a39d91" }}>
                    <span>CGST (Central Tax):</span>
                    <span>₹{(parseFloat(selectedInvoice.tax || 0) / 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "0.25rem 0", color: "#a39d91" }}>
                    <span>SGST (State Tax):</span>
                    <span>₹{(parseFloat(selectedInvoice.tax || 0) / 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(212, 175, 55, 0.2)", paddingTop: "0.35rem", marginTop: "0.35rem", fontWeight: 700, color: "#f7df8f" }}>
                    <span>Total Tax:</span>
                    <span>₹{parseFloat(selectedInvoice.tax || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Amount Summary */}
                <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#a39d91" }}>
                    <span>Taxable Subtotal:</span>
                    <span style={{ fontWeight: 700, color: "#f5f3ef" }}>
                      ₹{parseFloat(selectedInvoice.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(selectedInvoice.discount || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#f87171" }}>
                      <span>Trade Discount:</span>
                      <span>-₹{parseFloat(selectedInvoice.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#a39d91" }}>
                    <span>Total GST:</span>
                    <span style={{ fontWeight: 700, color: "#f5f3ef" }}>
                      ₹{parseFloat(selectedInvoice.tax || 0).toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "2px solid rgba(212, 175, 55, 0.4)",
                      paddingTop: "0.65rem",
                      marginTop: "0.35rem",
                      fontWeight: 800,
                      fontSize: "1.2rem",
                    }}
                  >
                    <span style={{ color: "#d4af37" }}>Total Invoice:</span>
                    <span className="text-gradient-gold">
                      ₹{parseFloat(selectedInvoice.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatory Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(212, 175, 55, 0.15)" }}>
                <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>
                  This is a computer-generated tax invoice verified under Digital GST protocols.
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "170px", borderBottom: "1px dashed #d4af37", marginBottom: "0.45rem" }} />
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d4af37" }}>Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
