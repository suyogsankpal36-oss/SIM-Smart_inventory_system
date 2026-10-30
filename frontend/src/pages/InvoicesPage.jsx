import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Building,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Printer,
  Receipt,
  Search,
  User,
} from "lucide-react";
import salesService from "../services/salesService";
import { Badge, Button, Card, Modal, StatsCard, Table } from "../components/ui";

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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <FileSpreadsheet className="w-3 h-3 mr-1" />
              Tax Compliance & Invoicing
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            Tax Invoices & GST Receipts
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            Sequential invoice registry, tax breakdown calculations, and printable invoices.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Generated Invoices"
          value={totalInvoices}
          icon={FileText}
          description="Issued receipts"
          accentColor="primary"
        />
        <StatsCard
          title="Cumulative Tax Revenue"
          value={`₹${totalValue.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Total invoiced turnover"
          accentColor="success"
        />
        <StatsCard
          title="Average Invoice Value"
          value={`₹${avgValue.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={Receipt}
          description="Average ticket size"
          accentColor="info"
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search invoice #, order #, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-100 text-base-content"
          />
        </div>
      </Card>

      {/* Invoices Table */}
      <Card bodyClassName="p-0">
        <Table
          loading={loading}
          data={invoices}
          columns={[
            {
              header: "Invoice Number",
              key: "invoice_number",
              render: (row) => (
                <span className="font-mono font-bold text-primary">{row.invoice_number}</span>
              ),
            },
            {
              header: "Order Reference",
              key: "order_number",
              render: (row) => (
                <span className="font-mono text-xs text-base-content/80">
                  {row.order_number || row.order?.order_number || "—"}
                </span>
              ),
            },
            {
              header: "Customer",
              key: "customer_name",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-base-content/50" />
                  <span className="font-medium text-base-content">
                    {row.customer_name || row.order?.customer?.name || "Walk-in Customer"}
                  </span>
                </div>
              ),
            },
            {
              header: "Invoice Total",
              key: "total_amount",
              render: (row) => (
                <span className="font-bold text-base-content">
                  ₹{Number(row.total_amount || 0).toFixed(2)}
                </span>
              ),
            },
            {
              header: "Date Issued",
              key: "created_at",
              render: (row) => (
                <span className="text-xs text-base-content/70">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              ),
            },
            {
              header: "Actions",
              key: "actions",
              align: "right",
              render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => openInvoiceModal(row)}
                    icon={Eye}
                  >
                    View Invoice
                  </Button>
                </div>
              ),
            },
          ]}
          emptyMessage="No invoices found"
          emptyDescription="Invoices generated upon POS sales completion will be stored here."
        />
      </Card>

      {/* Invoice Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Official Tax Invoice"
        subtitle={`Invoice #${selectedInvoice?.invoice_number || ""}`}
        maxWidth="max-w-xl"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} icon={Printer}>
              Print / Save PDF
            </Button>
            <Button variant="primary" size="sm" onClick={() => setSelectedInvoice(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="p-4 sm:p-6 bg-base-100 rounded-2xl border border-base-300 font-sans text-xs space-y-4 text-base-content">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-base-300 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-primary">SMART INVENTORY STORE</h3>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  Enterprise Commercial Sales & Retail
                </p>
                <p className="text-[11px] text-base-content/60">GSTIN: 27ABCDE1234F1Z5</p>
              </div>
              <div className="text-right">
                <span className="badge badge-primary font-bold text-xs">TAX INVOICE</span>
                <p className="font-mono font-bold text-xs mt-1 text-primary">
                  {selectedInvoice.invoice_number}
                </p>
                <p className="text-[10px] text-base-content/60">
                  Date: {new Date(selectedInvoice.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-base-200/50 rounded-xl border border-base-300/60 text-[11px]">
              <div>
                <span className="text-base-content/50 block font-semibold">Billed To:</span>
                <p className="font-bold text-base-content">
                  {selectedInvoice.order?.customer?.name ||
                    selectedInvoice.customer_name ||
                    "Walk-in Customer"}
                </p>
                {selectedInvoice.order?.customer?.phone && (
                  <p className="text-base-content/60">
                    Ph: {selectedInvoice.order.customer.phone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-base-content/50 block font-semibold">Order Reference:</span>
                <p className="font-mono font-bold text-base-content">
                  {selectedInvoice.order?.order_number || selectedInvoice.order_number}
                </p>
                <p className="text-base-content/60 uppercase">
                  Payment: {selectedInvoice.order?.payment_method || "Cash"}
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto rounded-xl border border-base-300">
              <table className="table table-xs w-full">
                <thead>
                  <tr className="bg-base-200 border-b border-base-300 text-[10px] uppercase font-bold text-base-content/70">
                    <th>Description</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">GST</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.order?.items || []).map((it, idx) => (
                    <tr key={idx} className="border-b border-base-300/30">
                      <td>
                        <div className="font-bold text-[11px]">
                          {it.product_name || it.product?.name || "Product Item"}
                        </div>
                        <div className="font-mono text-[9px] text-base-content/50">
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

            {/* Totals Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-56 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    ₹{Number(selectedInvoice.order?.subtotal || selectedInvoice.total_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax Total:</span>
                  <span className="font-medium">
                    ₹{Number(selectedInvoice.order?.tax || 0).toFixed(2)}
                  </span>
                </div>
                {Number(selectedInvoice.order?.discount) > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount:</span>
                    <span>-₹{Number(selectedInvoice.order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="divider my-1 opacity-40" />
                <div className="flex justify-between text-sm font-extrabold text-primary">
                  <span>Grand Total:</span>
                  <span>₹{Number(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-base-300 text-[10px] text-base-content/50">
              This is a computer-generated tax invoice. Authorized Signatory not required.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
