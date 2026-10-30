import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import supplierService from "../services/supplierService";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Input, Modal, Select, StatsCard, Table } from "../components/ui";

const PAYMENT_TERMS_CONFIG = {
  immediate: { label: "Immediate / Cash", color: "badge-success" },
  net_15: { label: "Net 15 Days", color: "badge-primary" },
  net_30: { label: "Net 30 Days", color: "badge-warning" },
  net_60: { label: "Net 60 Days", color: "badge-secondary" },
  advance: { label: "Advance Payment", color: "badge-accent" },
};

export default function SuppliersPage() {
  const { isAdmin, isManager } = useAuth();
  const canEdit = isAdmin || isManager;

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [termsFilter, setTermsFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    payment_terms: "net_30",
    status: "active",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [search, statusFilter, termsFilter]);

  const fetchSuppliers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (termsFilter) params.payment_terms = termsFilter;

      const data = await supplierService.getSuppliers(params);
      setSuppliers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load suppliers directory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTermsFilter("");
  };

  const hasActiveFilters = Boolean(search) || Boolean(statusFilter) || Boolean(termsFilter);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      gst_number: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      payment_terms: "net_30",
      status: "active",
      notes: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      contact_person: s.contact_person || "",
      phone: s.phone,
      email: s.email || "",
      gst_number: s.gst_number || "",
      address: s.address || "",
      city: s.city || "",
      state: s.state || "",
      postal_code: s.postal_code || "",
      payment_terms: s.payment_terms || "net_30",
      status: s.status || "active",
      notes: s.notes || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Supplier / Company name is required.";
    if (!formData.phone.trim()) errors.phone = "Contact phone number is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        gst_number: formData.gst_number.trim().toUpperCase(),
      };

      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, payload);
        toast.success("Supplier updated successfully!");
      } else {
        await supplierService.createSupplier(payload);
        toast.success("Supplier added to directory!");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      const serverErrors = err.response?.data?.errors || err.response?.data;
      if (serverErrors && typeof serverErrors === "object") {
        setFormErrors(serverErrors);
      }
      toast.error(err.response?.data?.detail || "Failed to save supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supplierService.deleteSupplier(deleteTarget.id);
      toast.success("Supplier deleted successfully.");
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to delete supplier.");
    } finally {
      setDeleting(false);
    }
  };

  // KPIs
  const totalCount = suppliers.length;
  const activeCount = suppliers.filter((s) => s.status === "active").length;
  const creditCount = suppliers.filter((s) => ["net_15", "net_30", "net_60"].includes(s.payment_terms)).length;
  const gstCount = suppliers.filter((s) => Boolean(s.gst_number)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Suppliers & Vendors
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Manage wholesale vendors, distribution contracts, credit payment terms, and procurement supply chains.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchSuppliers(true)}
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
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Suppliers"
          value={totalCount}
          icon={Truck}
          color="primary"
          description="Registered vendors"
        />
        <StatsCard
          title="Active Partners"
          value={activeCount}
          icon={CheckCircle}
          color="accent"
          description="Operational accounts"
        />
        <StatsCard
          title="Credit Vendors"
          value={creditCount}
          icon={CreditCard}
          color="secondary"
          description="Net 15/30/60 terms"
        />
        <StatsCard
          title="GSTIN Verified"
          value={gstCount}
          icon={ShieldCheck}
          color="accent"
          description="Tax compliant entities"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search company, contact person, phone, email, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-10 bg-base-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={termsFilter}
              onChange={(e) => setTermsFilter(e.target.value)}
              className="select select-bordered select-sm bg-base-100"
            >
              <option value="">All Payment Terms</option>
              <option value="immediate">Immediate / Cash</option>
              <option value="net_15">Net 15 Days</option>
              <option value="net_30">Net 30 Days</option>
              <option value="net_60">Net 60 Days</option>
              <option value="advance">Advance Payment</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered select-sm bg-base-100"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Suppliers Table */}
      <Table
        loading={loading}
        data={suppliers}
        emptyTitle="No suppliers found"
        emptyDescription={
          hasActiveFilters
            ? "Try clearing your search query or filters."
            : "Get started by adding your first wholesale supplier or vendor."
        }
        emptyAction={
          canEdit && !hasActiveFilters ? (
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
              Add Supplier
            </Button>
          ) : null
        }
        columns={[
          {
            header: "Company & Contact",
            render: (s) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-base-content leading-snug">{s.name}</div>
                  {s.contact_person ? (
                    <div className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                      <User size={12} /> {s.contact_person}
                    </div>
                  ) : (
                    <div className="text-xs text-base-content/40 italic">No contact specified</div>
                  )}
                </div>
              </div>
            ),
          },
          {
            header: "Contact Details",
            render: (s) => (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-base-content/80 font-medium">
                  <Phone size={12} className="text-primary shrink-0" />
                  <span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center gap-1.5 text-base-content/60">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate max-w-[160px]">{s.email}</span>
                  </div>
                )}
              </div>
            ),
          },
          {
            header: "Location",
            render: (s) => (
              <div className="text-xs">
                {s.city || s.state ? (
                  <div className="flex items-center gap-1 text-base-content/80">
                    <MapPin size={12} className="text-base-content/50 shrink-0" />
                    <span>
                      {[s.city, s.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-base-content/40 italic">Not set</span>
                )}
              </div>
            ),
          },
          {
            header: "Payment Terms",
            render: (s) => {
              const term = PAYMENT_TERMS_CONFIG[s.payment_terms] || {
                label: s.payment_terms || "Standard",
                color: "badge-ghost",
              };
              return (
                <span className={`badge ${term.color} badge-sm font-semibold`}>
                  {term.label}
                </span>
              );
            },
          },
          {
            header: "Tax & Compliance",
            render: (s) => (
              <div className="text-xs font-mono">
                {s.gst_number ? (
                  <span className="badge badge-outline badge-sm border-base-content/20 text-base-content/80">
                    {s.gst_number}
                  </span>
                ) : (
                  <span className="text-base-content/40 italic">Unregistered</span>
                )}
              </div>
            ),
          },
          {
            header: "Status",
            render: (s) => <Badge status={s.status} />,
          },
          {
            header: "Actions",
            className: "text-right",
            render: (s) => (
              <div className="flex items-center justify-end gap-1">
                {canEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-square btn-xs"
                      onClick={() => openEditModal(s)}
                      title="Edit Supplier"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-square btn-xs text-error hover:bg-error/10"
                      onClick={() => setDeleteTarget(s)}
                      title="Delete Supplier"
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

      {/* Create / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : "Add Wholesale Supplier"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company / Vendor Name"
              required
              placeholder="e.g. Apex Global Distributors"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />
            <Input
              label="Contact Person Name"
              placeholder="e.g. Michael Scott"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Phone Number"
              required
              placeholder="e.g. +91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={formErrors.phone}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="vendor@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="GSTIN / Tax ID"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Payment Terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              options={[
                { value: "immediate", label: "Immediate / Cash on Delivery" },
                { value: "net_15", label: "Net 15 Days" },
                { value: "net_30", label: "Net 30 Days" },
                { value: "net_60", label: "Net 60 Days" },
                { value: "advance", label: "Advance Payment" },
              ]}
            />
            <Select
              label="Account Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: "active", label: "Active Supplier" },
                { value: "inactive", label: "Inactive / Suspended" },
              ]}
            />
          </div>

          <Input
            label="Street Address"
            placeholder="Building, street, industrial area..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State / Province"
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="Postal Code"
              placeholder="e.g. 400001"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
          </div>

          <div>
            <label className="label text-xs font-semibold uppercase text-base-content/70">
              Procurement Notes & Delivery Terms
            </label>
            <textarea
              rows={3}
              placeholder="Enter special shipping instructions, minimum order quantities, or supplier credit limits..."
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
              {editingSupplier ? "Save Changes" : "Register Supplier"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Supplier Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-error/10 text-error border border-error/20">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              Are you sure you want to delete <strong className="font-bold">{deleteTarget?.name}</strong>?
              This will remove them from the active vendor directory.
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Supplier
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
