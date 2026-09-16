import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Calendar,
  CreditCard,
  Building,
  X,
  AlertCircle,
  Award,
} from "lucide-react";
import customerService from "../services/customerService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

export default function CustomersPage() {
  const { isAdmin, isManager } = useAuth();
  const canEdit = isAdmin || isManager;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Customer Profile View Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search, ordering]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (ordering) params.ordering = ordering;

      const data = await customerService.getCustomers(params);
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      gst_number: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone || "",
      email: cust.email || "",
      gst_number: cust.gst_number || "",
      address: cust.address || "",
      city: cust.city || "",
      state: cust.state || "",
      postal_code: cust.postal_code || "",
    });
    setIsModalOpen(true);
  };

  const openProfileModal = async (cust) => {
    try {
      setSelectedCustomer(cust);
      setLoadingDetail(true);
      const detail = await customerService.getCustomer(cust.id);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load detailed profile.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
        toast.success(`Updated customer "${formData.name}".`);
      } else {
        await customerService.createCustomer(formData);
        toast.success(`Created customer "${formData.name}".`);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.email?.[0] ||
        "Could not save customer.";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await customerService.deleteCustomer(deleteTarget.id);
      toast.success(`Customer "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalCount = customers.length;
  const activeBuyers = customers.filter((c) => c.total_purchases > 0).length;
  const totalSpend = customers.reduce((sum, c) => sum + parseFloat(c.total_amount_spent || 0), 0);
  const avgSpend = activeBuyers > 0 ? totalSpend / activeBuyers : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }} className="text-gradient-gold">
            Customer Directory
          </h1>
          <p style={{ color: "#a39d91", fontSize: "0.875rem", marginTop: "0.35rem" }}>
            Maintain customer contact directories, GSTIN records, and lifetime purchase analytics.
          </p>
        </div>

        <Button3D
          variant="gold"
          icon={UserPlus}
          onClick={openCreateModal}
        >
          Add Customer
        </Button3D>
      </div>

      {/* Metric Cards Grid */}
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
              <Users size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Customers
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
              <ShoppingBag size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Active Buyers
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#10b981" }}>{activeBuyers}</div>
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
                Lifetime Revenue
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800 }} className="text-gradient-gold">
                ₹{totalSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
              <TrendingUp size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Avg Spend / Buyer
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f59e0b" }}>
                ₹{avgSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
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
            placeholder="Search by name, phone, email, GSTIN, city..."
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

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <option value="-created_at">Sort: Newest First</option>
            <option value="name">Sort: Name (A → Z)</option>
            <option value="-total_amount_spent">Sort: Highest Spender</option>
            <option value="-total_purchases">Sort: Most Orders</option>
            <option value="-last_purchase_date">Sort: Recent Purchase</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
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
                  CUSTOMER NAME
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  CONTACT INFO
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  LOCATION / GSTIN
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  ORDERS
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  LIFETIME SPEND
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
                  <td colSpan={6} style={{ padding: "3.5rem", textAlign: "center", color: "#a39d91" }}>
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3.5rem", textAlign: "center" }}>
                    <Users size={44} style={{ color: "rgba(212, 175, 55, 0.4)", margin: "0 auto 0.75rem" }} />
                    <p style={{ color: "#a39d91", fontWeight: 600, margin: 0 }}>No customers found.</p>
                    <Button3D
                      variant="gold"
                      size="sm"
                      onClick={openCreateModal}
                      style={{ marginTop: "1rem" }}
                    >
                      + Add a new customer
                    </Button3D>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="table-row-3d"
                    style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.12)" }}
                  >
                    {/* Name & Avatar */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #f7df8f 0%, #d4af37 100%)",
                            color: "#0d0f15",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.9375rem",
                            boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                          }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#f5f3ef", fontSize: "0.875rem" }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>
                            Added {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td style={{ padding: "1rem", fontSize: "0.8125rem" }}>
                      {c.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#e5e7eb" }}>
                          <Phone size={13} color="#d4af37" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#a39d91", marginTop: "0.2rem" }}>
                          <Mail size={13} color="#a39d91" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {!c.phone && !c.email && <span style={{ color: "#686358" }}>No contact info</span>}
                    </td>

                    {/* Location / GSTIN */}
                    <td style={{ padding: "1rem", fontSize: "0.8125rem" }}>
                      {c.city || c.state ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#e5e7eb" }}>
                          <MapPin size={13} color="#d4af37" />
                          <span>{[c.city, c.state].filter(Boolean).join(", ")}</span>
                        </div>
                      ) : null}
                      {c.gst_number && (
                        <div style={{ marginTop: "0.25rem" }}>
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
                            GST: {c.gst_number}
                          </span>
                        </div>
                      )}
                      {!c.city && !c.state && !c.gst_number && <span style={{ color: "#686358" }}>—</span>}
                    </td>

                    {/* Purchases Count */}
                    <td style={{ padding: "1rem" }}>
                      <span className="badge-3d-gold">
                        {c.total_purchases} order{c.total_purchases !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Lifetime Spend */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 800, color: "#f7df8f", fontSize: "0.9375rem" }}>
                        ₹{parseFloat(c.total_amount_spent || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      {c.last_purchase_date && (
                        <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>
                          Last: {new Date(c.last_purchase_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                        <Button3D
                          variant="dark"
                          size="sm"
                          icon={Eye}
                          onClick={() => openProfileModal(c)}
                          title="View Profile & Orders"
                        />
                        {canEdit && (
                          <Button3D
                            variant="dark"
                            size="sm"
                            icon={Edit}
                            onClick={() => openEditModal(c)}
                            title="Edit Customer"
                          />
                        )}
                        {isAdmin && (
                          <Button3D
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteTarget(c)}
                            title="Delete Customer"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile View Modal */}
      {selectedCustomer && (
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
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="card-3d"
            style={{
              width: "100%",
              maxWidth: "620px",
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f7df8f 0%, #d4af37 100%)",
                    color: "#0d0f15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.125rem",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }} className="text-gradient-gold">
                    {selectedCustomer.name}
                  </h3>
                  <div style={{ fontSize: "0.75rem", color: "#a39d91" }}>
                    Customer ID #{selectedCustomer.id}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Financial Stats Bar */}
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
                  <div style={{ fontSize: "0.7rem", color: "#d4af37", fontWeight: 800, letterSpacing: "0.05em" }}>
                    TOTAL PURCHASES
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f5f3ef", marginTop: "0.2rem" }}>
                    {selectedCustomer.total_purchases} orders
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#d4af37", fontWeight: 800, letterSpacing: "0.05em" }}>
                    TOTAL AMOUNT SPENT
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#34d399", marginTop: "0.2rem" }}>
                    ₹{parseFloat(selectedCustomer.total_amount_spent || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Contact Directory */}
              <div>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 800, color: "#d4af37", marginBottom: "0.5rem", letterSpacing: "0.03em" }}>
                  Contact Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.875rem", background: "rgba(20, 24, 34, 0.8)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(212, 175, 55, 0.15)" }}>
                  <div>
                    <span style={{ color: "#a39d91" }}>Phone:</span>{" "}
                    <strong style={{ color: "#f5f3ef" }}>{selectedCustomer.phone || "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#a39d91" }}>Email:</span>{" "}
                    <strong style={{ color: "#f5f3ef" }}>{selectedCustomer.email || "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#a39d91" }}>GSTIN:</span>{" "}
                    <strong style={{ color: "#f7df8f" }}>{selectedCustomer.gst_number || "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#a39d91" }}>City / State:</span>{" "}
                    <strong style={{ color: "#f5f3ef" }}>{[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(", ") || "—"}</strong>
                  </div>
                  {selectedCustomer.address && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#a39d91" }}>Full Address:</span>{" "}
                      <strong style={{ color: "#f5f3ef" }}>{selectedCustomer.address}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders List */}
              <div>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 800, color: "#d4af37", marginBottom: "0.5rem", letterSpacing: "0.03em" }}>
                  Recent Orders History
                </h4>
                {loadingDetail ? (
                  <div style={{ color: "#a39d91", fontSize: "0.875rem" }}>Loading orders...</div>
                ) : !selectedCustomer.recent_orders || selectedCustomer.recent_orders.length === 0 ? (
                  <div style={{ color: "#a39d91", fontSize: "0.875rem", background: "rgba(20, 24, 34, 0.8)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(212, 175, 55, 0.15)" }}>
                    No purchase orders recorded yet for this customer.
                  </div>
                ) : (
                  <div style={{ border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: "10px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                      <thead style={{ background: "rgba(18, 20, 28, 0.95)" }}>
                        <tr>
                          <th style={{ padding: "0.65rem 0.75rem", textAlign: "left", color: "#d4af37" }}>ORDER #</th>
                          <th style={{ padding: "0.65rem 0.75rem", textAlign: "left", color: "#d4af37" }}>DATE</th>
                          <th style={{ padding: "0.65rem 0.75rem", textAlign: "left", color: "#d4af37" }}>METHOD</th>
                          <th style={{ padding: "0.65rem 0.75rem", textAlign: "right", color: "#d4af37" }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.recent_orders.map((ord) => (
                          <tr key={ord.id} style={{ borderTop: "1px solid rgba(212, 175, 55, 0.1)" }}>
                            <td style={{ padding: "0.65rem 0.75rem", fontWeight: 700, color: "#f7df8f" }}>{ord.order_number}</td>
                            <td style={{ padding: "0.65rem 0.75rem", color: "#a39d91" }}>
                              {new Date(ord.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "0.65rem 0.75rem", color: "#e5e7eb" }}>{ord.payment_method_display}</td>
                            <td style={{ padding: "0.65rem 0.75rem", textAlign: "right", fontWeight: 800, color: "#f7df8f" }}>
                              ₹{ord.total_amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
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
              maxWidth: "580px",
              borderRadius: "16px",
              overflow: "hidden",
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
                {editingCustomer ? `Edit: ${editingCustomer.name}` : "Add New Customer"}
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
                {/* Customer Name */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Traders or Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
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
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
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

                {/* GSTIN */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
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

                {/* Street Address */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="Shop #4, Commercial Street"
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

                {/* City */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* State */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#d4af37", marginBottom: "0.4rem" }}>
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                  {editingCustomer ? "Update Customer" : "Save Customer"}
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
                Delete Customer?
              </h3>
            </div>

            <p style={{ color: "#a39d91", fontSize: "0.875rem", margin: "1.25rem 0 1.75rem", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: "#f7df8f" }}>"{deleteTarget.name}"</strong>? Past sales orders linked
              to this customer will be preserved as walk-in orders.
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
