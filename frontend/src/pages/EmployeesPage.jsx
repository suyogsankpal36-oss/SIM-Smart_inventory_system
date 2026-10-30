import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  Power,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import staffService from "../services/staffService";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Input, Modal, Select, StatsCard, Table } from "../components/ui";

const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    badge: "badge-primary",
    icon: ShieldCheck,
    description: "Full system administration, security & staff control",
  },
  manager: {
    label: "Store Manager",
    badge: "badge-warning",
    icon: Briefcase,
    description: "Inventory, suppliers, customers, expenses & sales analytics",
  },
  employee: {
    label: "Staff / Cashier",
    badge: "badge-info",
    icon: Users,
    description: "Point-of-sale checkout, customer lookup & catalog browsing",
  },
};

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();

  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({
    total_staff: 0,
    active_staff: 0,
    inactive_staff: 0,
    admin_count: 0,
    manager_count: 0,
    employee_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Selected staff for ID Badge inspection
  const [selectedMember, setSelectedMember] = useState(null);

  // Add / Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "employee",
    password: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetData, setResetData] = useState({
    new_password: "",
    new_password_confirm: "",
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [resetting, setResetting] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStaff();
    fetchStats();
  }, [search, roleFilter, statusFilter]);

  const fetchStaff = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== "") params.is_active = statusFilter;

      const data = await staffService.getStaff(params);
      const list = Array.isArray(data) ? data : data.results || [];
      setStaff(list);
      if (!selectedMember && list.length > 0) {
        setSelectedMember(list[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await staffService.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch staff stats:", err);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchStaff(true), fetchStats()]);
    toast.success("Staff directory updated.");
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = Boolean(search) || Boolean(roleFilter) || statusFilter !== "";

  // ---------------- Add Staff ----------------
  const openAddModal = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "employee",
      password: "",
      is_active: true,
    });
    setFormErrors({});
    setShowAddPassword(false);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format.";

    if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        is_active: formData.is_active,
      };
      if (formData.username.trim()) payload.username = formData.username.trim();
      if (formData.password.trim()) payload.password = formData.password.trim();

      const created = await staffService.createStaff(payload);
      toast.success(
        `Staff member "${formData.first_name || formData.username || formData.email}" added successfully!`
      );
      setIsAddModalOpen(false);
      fetchStaff();
      fetchStats();
      if (created) setSelectedMember(created);
    } catch (err) {
      console.error(err);
      const errorsObj = err.response?.data?.errors || err.response?.data || {};
      setFormErrors(err.response?.data || errorsObj);
      const errorMsg =
        err.response?.data?.detail ||
        (typeof errorsObj === "object"
          ? Object.entries(errorsObj)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
              .join("; ")
          : "Failed to add staff member.");
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- Edit Staff ----------------
  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      username: member.username || "",
      email: member.email || "",
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      phone: member.phone || "",
      role: member.role || "employee",
      is_active: member.is_active,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setFormErrors({});

    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        is_active: formData.is_active,
      };

      const updated = await staffService.updateStaff(editingMember.id, payload);
      toast.success(`Account details for ${editingMember.username} updated!`);
      setIsEditModalOpen(false);
      fetchStaff();
      fetchStats();
      if (selectedMember?.id === editingMember.id) {
        setSelectedMember(updated);
      }
    } catch (err) {
      console.error(err);
      const errorsObj = err.response?.data?.errors || err.response?.data || {};
      setFormErrors(err.response?.data || errorsObj);
      const errorMsg =
        err.response?.data?.detail ||
        (typeof errorsObj === "object"
          ? Object.entries(errorsObj)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
              .join("; ")
          : "Failed to update staff member.");
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- Toggle Active ----------------
  const handleToggleActive = async (member) => {
    if (member.id === currentUser?.id) {
      toast.error("You cannot change the active status of your own account.");
      return;
    }

    const nextState = !member.is_active;
    const actionName = nextState ? "activate" : "deactivate";

    try {
      await staffService.updateStaff(member.id, { is_active: nextState });
      toast.success(
        `Staff member ${member.full_name || member.username} has been ${nextState ? "activated" : "deactivated"}.`
      );
      fetchStaff();
      fetchStats();
      if (selectedMember?.id === member.id) {
        setSelectedMember({ ...selectedMember, is_active: nextState });
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || `Failed to ${actionName} user.`;
      toast.error(detail);
    }
  };

  // ---------------- Reset Password ----------------
  const openResetModal = (member) => {
    setResetTarget(member);
    setResetData({ new_password: "", new_password_confirm: "" });
    setResetErrors({});
    setShowResetPassword(false);
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetErrors({});

    const errors = {};
    if (!resetData.new_password) errors.new_password = "Password is required.";
    else if (resetData.new_password.length < 6)
      errors.new_password = "Password must be at least 6 characters.";

    if (resetData.new_password !== resetData.new_password_confirm) {
      errors.new_password_confirm = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setResetErrors(errors);
      return;
    }

    setResetting(true);
    try {
      await staffService.resetPassword(resetTarget.id, {
        new_password: resetData.new_password,
        new_password_confirm: resetData.new_password_confirm,
      });
      toast.success(`Password for ${resetTarget.username} has been reset!`);
      setIsResetModalOpen(false);
    } catch (err) {
      console.error(err);
      const errorsObj = err.response?.data?.errors || err.response?.data || {};
      setResetErrors(errorsObj);
      toast.error(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  // ---------------- Delete Staff ----------------
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await staffService.deleteStaff(deleteTarget.id);
      toast.success(`Staff user "${deleteTarget.username}" permanently removed.`);
      if (selectedMember?.id === deleteTarget.id) setSelectedMember(null);
      setDeleteTarget(null);
      fetchStaff();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to delete staff member.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Staff & Access Control
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Provision operational privileges, enforce role-based segregation of duties, and manage security credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={openAddModal}
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Staff"
          value={stats.total_staff || staff.length}
          icon={Users}
          color="primary"
          description="Provisioned user accounts"
        />
        <StatsCard
          title="Active Users"
          value={stats.active_staff || 0}
          icon={UserCheck}
          color="accent"
          description="Active security sessions"
        />
        <StatsCard
          title="Managers"
          value={stats.manager_count || 0}
          icon={Briefcase}
          color="secondary"
          description="Store supervisors"
        />
        <StatsCard
          title="Cashiers / Staff"
          value={stats.employee_count || 0}
          icon={Shield}
          color="primary"
          description="POS terminal operators"
        />
      </div>

      {/* Main Grid: Staff Directory on Left, Selected Badge Profile on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Filters & Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search staff by username, name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-bordered input-sm w-full pl-10 bg-base-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="select select-bordered select-sm bg-base-100"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Store Manager</option>
                  <option value="employee">Cashier / Staff</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered select-sm bg-base-100"
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive / Suspended</option>
                </select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Staff Table */}
          <Table
            loading={loading}
            data={staff}
            emptyTitle="No staff members found"
            emptyDescription={
              hasActiveFilters
                ? "Try clearing your search query or filters."
                : "Get started by provisioning your first team member account."
            }
            emptyAction={
              !hasActiveFilters ? (
                <Button variant="primary" size="sm" icon={UserPlus} onClick={openAddModal}>
                  Add Staff Member
                </Button>
              ) : null
            }
            columns={[
              {
                header: "Staff Member",
                render: (m) => (
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setSelectedMember(m)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20">
                      {(m.first_name || m.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-base-content leading-snug">
                        {m.full_name || m.username}
                        {m.id === currentUser?.id && (
                          <span className="badge badge-primary badge-xs ml-2">You</span>
                        )}
                      </div>
                      <div className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                        <Mail size={11} /> {m.email}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                header: "Assigned Role",
                render: (m) => {
                  const roleCfg = ROLE_CONFIG[m.role] || {
                    label: m.role,
                    badge: "badge-ghost",
                  };
                  return (
                    <span className={`badge ${roleCfg.badge} badge-sm font-semibold capitalize`}>
                      {roleCfg.label}
                    </span>
                  );
                },
              },
              {
                header: "Contact",
                render: (m) => (
                  <div className="text-xs text-base-content/70">
                    {m.phone ? (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone size={11} className="text-primary" /> {m.phone}
                      </span>
                    ) : (
                      <span className="italic text-base-content/40">No phone</span>
                    )}
                  </div>
                ),
              },
              {
                header: "Status",
                render: (m) => (
                  <button
                    onClick={() => handleToggleActive(m)}
                    className="cursor-pointer group flex items-center gap-1.5"
                    title={`Click to ${m.is_active ? "deactivate" : "activate"}`}
                  >
                    <span
                      className={`badge ${
                        m.is_active ? "badge-success" : "badge-error"
                      } badge-sm font-semibold`}
                    >
                      {m.is_active ? "Active" : "Suspended"}
                    </span>
                  </button>
                ),
              },
              {
                header: "Actions",
                className: "text-right",
                render: (m) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-square btn-xs"
                      onClick={() => openResetModal(m)}
                      title="Reset Password"
                    >
                      <KeyRound size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-square btn-xs"
                      onClick={() => openEditModal(m)}
                      title="Edit Staff Member"
                    >
                      <Edit size={14} />
                    </Button>
                    {m.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="btn-square btn-xs text-error hover:bg-error/10"
                        onClick={() => setDeleteTarget(m)}
                        title="Delete Account"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Right Column (1 col): Selected Staff Plaque */}
        <div>
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="font-bold text-base-content text-sm">Staff Security Profile</h3>
              </div>
              <span className="badge badge-outline badge-xs font-mono">ID VERIFIED</span>
            </div>

            {selectedMember ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-base-100 border-2 border-primary/30 shadow-md text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-black text-2xl mb-3">
                    {(selectedMember.first_name || selectedMember.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <h4 className="font-bold text-base text-base-content">
                    {selectedMember.full_name || selectedMember.username}
                  </h4>
                  <div className="text-xs text-base-content/60 font-mono mt-0.5">
                    @{selectedMember.username}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`badge ${
                        ROLE_CONFIG[selectedMember.role]?.badge || "badge-ghost"
                      } badge-sm font-bold`}
                    >
                      {ROLE_CONFIG[selectedMember.role]?.label || selectedMember.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-base-content/60 mt-2 px-2">
                    {ROLE_CONFIG[selectedMember.role]?.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-base-content/10">
                    <span className="text-base-content/60">Email:</span>
                    <span className="font-medium text-base-content">{selectedMember.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-base-content/10">
                    <span className="text-base-content/60">Phone:</span>
                    <span className="font-medium text-base-content">{selectedMember.phone || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-base-content/10">
                    <span className="text-base-content/60">Status:</span>
                    <span className={selectedMember.is_active ? "text-success font-bold" : "text-error font-bold"}>
                      {selectedMember.is_active ? "Authorized & Active" : "Suspended"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-base-content/10">
                    <span className="text-base-content/60">Joined:</span>
                    <span className="font-mono text-base-content/80">
                      {selectedMember.date_joined ? new Date(selectedMember.date_joined).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(selectedMember)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => openResetModal(selectedMember)}
                  >
                    Reset Key
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-base-content/50">
                Click any staff member from the directory table to inspect their credentials and access privileges.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Staff Account"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="e.g. Rachel"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              placeholder="e.g. Green"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username (Login Handle)"
              placeholder="e.g. rachel.green"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={formErrors.username}
            />
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="staff@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Select
              label="System Role & Permissions"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: "employee", label: "Cashier / Staff (POS Only)" },
                { value: "manager", label: "Store Manager (Ops & Inventory)" },
                { value: "admin", label: "Administrator (Full Privileges)" },
              ]}
            />
          </div>

          <Input
            label="Initial Account Password"
            type={showAddPassword ? "text" : "password"}
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-base-content/10">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Staff Profile: ${editingMember?.username}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Assigned System Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: "employee", label: "Cashier / Staff (POS Only)" },
                { value: "manager", label: "Store Manager (Ops & Inventory)" },
                { value: "admin", label: "Administrator (Full Privileges)" },
              ]}
            />
            <Select
              label="Account Authorization Status"
              value={formData.is_active ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
              options={[
                { value: "true", label: "Active & Authorized" },
                { value: "false", label: "Suspended / Inactive" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-base-content/10">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Security Key: ${resetTarget?.username}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetSubmit} className="space-y-4 pt-2">
          <Input
            label="New Password"
            type={showResetPassword ? "text" : "password"}
            required
            placeholder="Minimum 6 characters"
            value={resetData.new_password}
            onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
            error={resetErrors.new_password}
          />
          <Input
            label="Confirm New Password"
            type={showResetPassword ? "text" : "password"}
            required
            placeholder="Repeat new password"
            value={resetData.new_password_confirm}
            onChange={(e) => setResetData({ ...resetData, new_password_confirm: e.target.value })}
            error={resetErrors.new_password_confirm}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-base-content/10">
            <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={resetting}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Revoke Staff Account"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-error/10 text-error border border-error/20">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              Are you sure you want to permanently delete user{" "}
              <strong className="font-bold">{deleteTarget?.username}</strong> ({deleteTarget?.email})?
              All associated audit trails will remain, but this account will no longer be able to authenticate.
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Revoke Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
