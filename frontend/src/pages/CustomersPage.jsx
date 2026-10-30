import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Award,
  DollarSign,
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import customerService from "../services/customerService";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Input, Modal, StatsCard, Table } from "../components/ui";

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
      const detail = await customerService.getCustomer(cust.id);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error(err);
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
        toast.success("Customer profile updated!");
      } else {
        await customerService.createCustomer(formData);
        toast.success("Customer registered successfully!");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Operation failed.");
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
      toast.error(err.response?.data?.detail || "Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalCustomers = customers.length;
  const totalSpentAll = customers.reduce((s, c) => s + parseFloat(c.total_amount_spent || 0), 0);
  const totalOrdersAll = customers.reduce((s, c) => s + parseInt(c.total_purchases || 0, 10), 0);
  const topSpender = [...customers].sort(
    (a, b) => parseFloat(b.total_amount_spent || 0) - parseFloat(a.total_amount_spent || 0)
  )[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <Users className="w-3 h-3 mr-1" />
              Customer Relationship Management (CRM)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            Customer Directory & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            Profiles, GST tax IDs, purchase frequency, and cumulative client expenditure.
          </p>
        </div>

        {canEdit && (
          <Button variant="primary" icon={UserPlus} onClick={openCreateModal} size="sm">
            Register Customer
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clients"
          value={totalCustomers}
          icon={Users}
          description="Registered profiles"
          accentColor="primary"
        />
        <StatsCard
          title="Cumulative Spend"
          value={`₹${totalSpentAll.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Total client revenue"
          accentColor="success"
        />
        <StatsCard
          title="Orders Completed"
          value={totalOrdersAll}
          icon={ShoppingBag}
          description="POS & online checkout orders"
          accentColor="info"
        />
        <StatsCard
          title="Top Account"
          value={topSpender ? `₹${parseFloat(topSpender.total_amount_spent || 0).toFixed(0)}` : "—"}
          icon={Award}
          description={topSpender ? topSpender.name : "No orders yet"}
          accentColor="warning"
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by name, phone, or GST number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-100 text-base-content"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-base-content/60 whitespace-nowrap">Sort:</span>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
            >
              <option value="-created_at">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="-total_amount_spent">Total Spend (High-Low)</option>
              <option value="-total_purchases">Order Count (High-Low)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card bodyClassName="p-0">
        <Table
          loading={loading}
          data={customers}
          columns={[
            {
              header: "Customer Name",
              key: "name",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder shrink-0">
                    <div className="bg-primary/20 text-primary border border-primary/40 rounded-xl w-9 h-9 font-bold text-xs flex items-center justify-center">
                      <span>{(row.name?.[0] || "C").toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-base-content">{row.name}</div>
                    {row.gst_number && (
                      <div className="text-[10px] font-mono text-primary">GST: {row.gst_number}</div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              header: "Contact Info",
              key: "contact",
              render: (row) => (
                <div className="text-xs space-y-0.5">
                  {row.phone && (
                    <div className="flex items-center gap-1.5 text-base-content/80">
                      <Phone className="w-3 h-3 text-primary" />
                      <span>{row.phone}</span>
                    </div>
                  )}
                  {row.email && (
                    <div className="flex items-center gap-1.5 text-base-content/60">
                      <Mail className="w-3 h-3" />
                      <span>{row.email}</span>
                    </div>
                  )}
                  {!row.phone && !row.email && <span className="text-base-content/40">—</span>}
                </div>
              ),
            },
            {
              header: "City / Location",
              key: "city",
              render: (row) => (
                <div className="flex items-center gap-1 text-xs text-base-content/70">
                  <MapPin className="w-3 h-3 text-base-content/40" />
                  <span>{row.city ? `${row.city}${row.state ? `, ${row.state}` : ""}` : "Not specified"}</span>
                </div>
              ),
            },
            {
              header: "Orders",
              key: "total_purchases",
              align: "center",
              render: (row) => (
                <span className="badge badge-neutral text-xs font-bold">
                  {row.total_purchases || 0} Orders
                </span>
              ),
            },
            {
              header: "Cumulative Spend",
              key: "total_amount_spent",
              render: (row) => (
                <span className="font-bold text-base-content">
                  ₹{Number(row.total_amount_spent || 0).toFixed(2)}
                </span>
              ),
            },
            {
              header: "Actions",
              key: "actions",
              align: "right",
              render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openProfileModal(row)}
                    className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                    title="View Customer Details & History"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openEditModal(row)}
                      className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-base-content"
                      title="Edit Customer Profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          emptyMessage="No customers found"
          emptyDescription="Register your first client or create one on the fly at the POS terminal."
          emptyAction={
            canEdit && (
              <Button variant="primary" size="sm" icon={UserPlus} onClick={openCreateModal}>
                Register Customer
              </Button>
            )
          }
        />
      </Card>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer Profile" : "Register Customer"}
        subtitle="Customer contact information, GST tax compliance, and location"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Ramesh Patel"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. customer@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="GSTIN / Tax Identification"
            placeholder="e.g. 27AAAAA0000A1Z5"
            value={formData.gst_number}
            onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
          />

          <Input
            label="Street Address"
            placeholder="e.g. 102 Business Hub, MG Road"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="PIN Code"
              placeholder="e.g. 400001"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-base-300/40">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingCustomer ? "Save Changes" : "Register Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile View Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Client Overview & Transaction History"
        subtitle={selectedCustomer?.name || ""}
        maxWidth="max-w-xl"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs text-base-content">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-base-100 rounded-2xl border border-base-300">
              <div>
                <span className="text-base-content/50 block font-semibold">Phone:</span>
                <span className="font-bold text-sm">{selectedCustomer.phone || "—"}</span>
              </div>
              <div>
                <span className="text-base-content/50 block font-semibold">Email:</span>
                <span className="font-bold text-sm truncate">{selectedCustomer.email || "—"}</span>
              </div>
              <div>
                <span className="text-base-content/50 block font-semibold">GSTIN:</span>
                <span className="font-mono font-bold text-primary">
                  {selectedCustomer.gst_number || "Unregistered (B2C)"}
                </span>
              </div>
              <div>
                <span className="text-base-content/50 block font-semibold">Lifetime Turnover:</span>
                <span className="font-bold text-sm text-success">
                  ₹{Number(selectedCustomer.total_amount_spent || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Historical Orders List */}
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-base-content/70 block mb-2">
                Recent Orders by Client
              </span>
              {(selectedCustomer.recent_orders || selectedCustomer.orders || []).length === 0 ? (
                <div className="p-4 bg-base-100 rounded-xl border border-base-300 text-center text-base-content/50">
                  No orders recorded for this customer account yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-base-300">
                  <table className="table table-xs w-full">
                    <thead>
                      <tr className="bg-base-200 border-b border-base-300">
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCustomer.recent_orders || selectedCustomer.orders || []).map((o) => (
                        <tr key={o.id} className="border-b border-base-300/30">
                          <td className="font-mono font-bold text-primary">{o.order_number}</td>
                          <td>{new Date(o.created_at).toLocaleDateString()}</td>
                          <td className="font-bold">₹{Number(o.total_amount || 0).toFixed(2)}</td>
                          <td>
                            <Badge status={o.status} size="xs">
                              {o.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer Profile"
        subtitle={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
              Delete Profile
            </Button>
          </div>
        }
      >
        <p className="text-xs text-base-content/70 leading-relaxed">
          Historical order and invoicing records linked to this customer account will be preserved,
          but the customer profile will be permanently deleted from CRM directory.
        </p>
      </Modal>
    </div>
  );
}
