import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  CreditCard,
  Edit,
  FileText,
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
  X,
} from "lucide-react";
import supplierService from "../services/supplierService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

const PAYMENT_TERMS_CONFIG = {
  immediate: { label: "Immediate / Cash", color: "#34d399", border: "rgba(16, 185, 129, 0.4)", bg: "rgba(16, 185, 129, 0.15)" },
  net_15: { label: "Net 15 Days", color: "#f7df8f", border: "rgba(212, 175, 55, 0.4)", bg: "rgba(212, 175, 55, 0.15)" },
  net_30: { label: "Net 30 Days", color: "#d4af37", border: "rgba(212, 175, 55, 0.5)", bg: "rgba(212, 175, 55, 0.2)" },
  net_60: { label: "Net 60 Days", color: "#f59e0b", border: "rgba(245, 158, 11, 0.4)", bg: "rgba(245, 158, 11, 0.15)" },
  advance: { label: "Advance Payment", color: "#fbbf24", border: "rgba(251, 191, 36, 0.4)", bg: "rgba(251, 191, 36, 0.15)" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }} className="text-gradient-gold">
            Suppliers & Vendors
          </h1>
          <p style={{ color: "#a39d91", fontSize: "0.875rem", marginTop: "0.35rem" }}>
            Manage wholesale vendors, distribution contracts, credit payment terms, and procurement supply chains.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button3D
            variant="dark"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchSuppliers(true)}
            loading={refreshing}
          >
            Refresh
          </Button3D>
          {canEdit && (
            <Button3D
              variant="gold"
              icon={Plus}
              onClick={openCreateModal}
            >
              Add Supplier
            </Button3D>
          )}
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
              <Truck size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Suppliers
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f5f3ef" }}>{totalCount}</div>
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
              <CheckCircle size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Active Partners
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#10b981" }}>{activeCount}</div>
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
              <CreditCard size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Credit Vendors
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800 }} className="text-gradient-gold">
                {creditCount}
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
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateZ(18px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                GSTIN Verified
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f59e0b" }}>{gstCount}</div>
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search company, contact person, phone, email, GSTIN..."
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
            value={termsFilter}
            onChange={(e) => setTermsFilter(e.target.value)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
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
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.6rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                background: "rgba(212, 175, 55, 0.1)",
                color: "#d4af37",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              <X size={15} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Suppliers Table */}
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
                  COMPANY / VENDOR
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  CONTACT PERSON
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  PHONE & EMAIL
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  LOCATION
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  GSTIN
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  PAYMENT TERMS
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  STATUS
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
                    Loading suppliers directory...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3.5rem", textAlign: "center" }}>
                    <Truck size={44} style={{ color: "rgba(212, 175, 55, 0.4)", margin: "0 auto 0.75rem" }} />
                    <p style={{ color: "#a39d91", fontWeight: 600, margin: 0 }}>No suppliers found.</p>
                    {canEdit && (
                      <Button3D
                        variant="gold"
                        size="sm"
                        onClick={openCreateModal}
                        style={{ marginTop: "1rem" }}
                      >
                        + Add your first supplier
                      </Button3D>
                    )}
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => {
                  const term = PAYMENT_TERMS_CONFIG[s.payment_terms] || PAYMENT_TERMS_CONFIG.net_30;
                  return (
                    <tr
                      key={s.id}
                      className="table-row-3d"
                      style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.12)" }}
                    >
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "10px",
                              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(153, 101, 21, 0.15) 100%)",
                              border: "1px solid rgba(212, 175, 55, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#d4af37",
                              fontWeight: 800,
                              boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                            }}
                          >
                            <Building size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#f7df8f", fontSize: "0.875rem" }}>{s.name}</div>
                            {s.notes && <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>{s.notes}</div>}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        {s.contact_person ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#f5f3ef", fontSize: "0.875rem" }}>
                            <User size={14} color="#d4af37" />
                            <span>{s.contact_person}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#686358" }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: "1rem", fontSize: "0.8125rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <a href={`tel:${s.phone}`} style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#e5e7eb" }}>
                            <Phone size={13} color="#d4af37" />
                            <span>{s.phone}</span>
                          </a>
                          {s.email && (
                            <a href={`mailto:${s.email}`} style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#a39d91" }}>
                              <Mail size={13} color="#a39d91" />
                              <span>{s.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "1rem", fontSize: "0.8125rem" }}>
                        {s.city || s.state ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#e5e7eb" }}>
                            <MapPin size={13} color="#d4af37" />
                            <span>{[s.city, s.state].filter(Boolean).join(", ")}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#686358" }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: "1rem" }}>
                        {s.gst_number ? (
                          <span
                            className="badge-3d"
                            style={{
                              background: "rgba(212, 175, 55, 0.12)",
                              color: "#f7df8f",
                              border: "1px solid rgba(212, 175, 55, 0.3)",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            {s.gst_number}
                          </span>
                        ) : (
                          <span style={{ color: "#686358", fontSize: "0.8125rem" }}>Unregistered</span>
                        )}
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge-3d"
                          style={{
                            background: term.bg,
                            color: term.color,
                            border: `1px solid ${term.border}`,
                          }}
                        >
                          {term.label}
                        </span>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge-3d"
                          style={{
                            background: s.status === "active" ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.2)",
                            color: s.status === "active" ? "#34d399" : "#a39d91",
                            border: `1px solid ${s.status === "active" ? "rgba(16, 185, 129, 0.4)" : "rgba(148, 163, 184, 0.3)"}`,
                          }}
                        >
                          {s.status === "active" ? <CheckCircle size={12} /> : <X size={12} />}
                          {s.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                          {canEdit && (
                            <Button3D
                              variant="dark"
                              size="sm"
                              icon={Edit}
                              onClick={() => openEditModal(s)}
                              title="Edit Supplier"
                            />
                          )}
                          {isAdmin && (
                            <Button3D
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setDeleteTarget(s)}
                              title="Delete Supplier"
                            />
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

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
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
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div
            className="card-3d"
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: "16px",
              animation: "perspectiveSlideIn 0.35s ease forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
              }}
            >
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }} className="text-gradient-gold">
                {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : "Add New Supplier"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Company / Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Distributors Pvt Ltd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                  {formErrors.name && <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{formErrors.name}</div>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                  {formErrors.phone && <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{formErrors.phone}</div>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="vendor@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="immediate">Immediate / Cash</option>
                    <option value="net_15">Net 15 Days</option>
                    <option value="net_30">Net 30 Days</option>
                    <option value="net_60">Net 60 Days</option>
                    <option value="advance">Advance Payment</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Street Address & Location
                  </label>
                  <input
                    type="text"
                    placeholder="Warehouse 12, Industrial Area, City, State"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "2rem",
                  borderTop: "1px solid rgba(212, 175, 55, 0.2)",
                  paddingTop: "1.25rem",
                }}
              >
                <Button3D
                  variant="dark"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button3D>
                <Button3D
                  variant="gold"
                  type="submit"
                  loading={submitting}
                >
                  {editingSupplier ? "Update Supplier" : "Save Supplier"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
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
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="card-3d"
            style={{
              width: "100%",
              maxWidth: "440px",
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
                <AlertCircle size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#f87171" }}>
                Delete Supplier?
              </h3>
            </div>

            <p style={{ color: "#a39d91", fontSize: "0.875rem", margin: "1.25rem 0 1.75rem", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: "#f7df8f" }}>"{deleteTarget.name}"</strong>? This will remove their
              procurement profile from the active supplier directory.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button3D
                variant="dark"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button3D>
              <Button3D
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
              >
                Confirm Delete
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
