import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  Power,
  QrCode,
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
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    text: "#F7DF8F",
    bg: "rgba(212, 175, 55, 0.15)",
    border: "rgba(212, 175, 55, 0.45)",
    icon: ShieldCheck,
    description: "Full system administration, security & staff control",
  },
  manager: {
    label: "Store Manager",
    text: "#fde68a",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    icon: Briefcase,
    description: "Inventory, suppliers, customers, expenses & sales analytics",
  },
  employee: {
    label: "Staff / Cashier",
    text: "#93c5fd",
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.4)",
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

  const getFieldError = (field) => {
    if (!formErrors) return null;
    const err = formErrors[field] || formErrors.errors?.[field];
    if (Array.isArray(err)) return err[0];
    if (typeof err === "string") return err;
    return null;
  };

  const getFormAlert = () => {
    if (!formErrors) return null;
    if (formErrors.detail && typeof formErrors.detail === "string") return formErrors.detail;
    const errorsObj = formErrors.errors || formErrors;
    if (typeof errorsObj === "object") {
      const msgs = Object.entries(errorsObj)
        .filter(([k]) => k !== "detail")
        .map(([k, v]) => `${k.replace("_", " ")}: ${Array.isArray(v) ? v[0] : v}`);
      if (msgs.length > 0) return msgs[0];
    }
    return null;
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
    if (!resetTarget) return;
    setResetErrors({});

    const errors = {};
    if (!resetData.new_password) {
      errors.new_password = "New password is required.";
    } else if (resetData.new_password.length < 6) {
      errors.new_password = "Password must be at least 6 characters long.";
    }

    if (resetData.new_password !== resetData.new_password_confirm) {
      errors.new_password_confirm = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setResetErrors(errors);
      return;
    }

    setResetting(true);
    try {
      await staffService.resetPassword(resetTarget.id, resetData);
      toast.success(`Password for ${resetTarget.username} has been reset successfully!`);
      setIsResetModalOpen(false);
    } catch (err) {
      console.error(err);
      const errorsObj = err.response?.data?.errors || err.response?.data || {};
      setResetErrors(err.response?.data || errorsObj);
      const errorMsg =
        err.response?.data?.detail ||
        (typeof errorsObj === "object"
          ? Object.entries(errorsObj)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
              .join("; ")
          : "Failed to reset password.");
      toast.error(errorMsg);
    } finally {
      setResetting(false);
    }
  };


  // ---------------- Delete Staff ----------------
  const confirmDelete = (member) => {
    if (member.id === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setDeleteTarget(member);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await staffService.deleteStaff(deleteTarget.id);
      toast.success(`User ${deleteTarget.username} deleted successfully.`);
      if (selectedMember?.id === deleteTarget.id) {
        setSelectedMember(null);
      }
      setDeleteTarget(null);
      fetchStaff();
      fetchStats();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to delete user.";
      toast.error(detail);
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Never";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Active preview member
  const previewUser = selectedMember || currentUser || {
    username: "administrator",
    full_name: "Master Executive",
    email: "admin@enterprise.gold",
    role: "admin",
    is_active: true,
  };
  const previewRole = ROLE_CONFIG[previewUser.role] || ROLE_CONFIG.employee;

  return (
    <div className="space-y-8 pb-14 text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <UserCheck size={14} className="text-[#d4af37]" />
            Human Resources & Staff Security
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Personnel & Credential Directory
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Authorize employee access, monitor role hierarchies, supervise sales volume, and issue digital security ID credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={handleRefresh}
            disabled={refreshing}
            icon={RefreshCw}
            className={refreshing ? "opacity-75" : ""}
          >
            {refreshing ? "Updating..." : "Refresh"}
          </Button3D>

          <Button3D
            variant="gold"
            onClick={openAddModal}
            icon={UserPlus}
          >
            Add Staff Member
          </Button3D>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Team</span>
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Users size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-white tracking-tight">{stats.total_staff}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Registered user accounts
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Active Personnel</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-emerald-400 tracking-tight">{stats.active_staff}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Permitted system access
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Administrators</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">{stats.admin_count}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {stats.manager_count} Store Managers
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Cashiers / Staff</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Briefcase size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-blue-400 tracking-tight">{stats.employee_count}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              POS Terminal operators
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Main Grid: Staff Directory + Interactive Staff ID Badge */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Search, Filters & Staff Table */}
        <div className="xl:col-span-2 space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="card-3d p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search staff by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/40 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-sm text-neutral-300 focus:outline-none focus:border-[#d4af37] transition"
              >
                <option value="" className="bg-[#12141c]">All Roles</option>
                <option value="admin" className="bg-[#12141c]">Administrators</option>
                <option value="manager" className="bg-[#12141c]">Store Managers</option>
                <option value="employee" className="bg-[#12141c]">Staff / Cashiers</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-sm text-neutral-300 focus:outline-none focus:border-[#d4af37] transition"
              >
                <option value="" className="bg-[#12141c]">All Statuses</option>
                <option value="true" className="bg-[#12141c]">Active Only</option>
                <option value="false" className="bg-[#12141c]">Inactive / Suspended</option>
              </select>

              {(search || roleFilter || statusFilter !== "") && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-xs font-semibold text-[#d4af37] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Directory Table */}
          <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center">
                <RefreshCw size={28} className="animate-spin text-[#d4af37] mb-3" />
                <p className="text-sm text-neutral-400">Loading staff accounts...</p>
              </div>
            ) : staff.length === 0 ? (
              <div className="p-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mx-auto mb-3">
                  <Users size={26} />
                </div>
                <h3 className="text-base font-semibold text-neutral-200">No staff members found</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  {search || roleFilter || statusFilter !== ""
                    ? "Try adjusting your search criteria or filter selections."
                    : "Get started by adding your first employee or team member."}
                </p>
                {search || roleFilter || statusFilter !== "" ? (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 transition"
                  >
                    Clear Search & Filters
                  </button>
                ) : (
                  <Button3D variant="gold" onClick={openAddModal} className="mt-4">
                    Add First Member
                  </Button3D>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#d4af37]/20 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-3.5 px-4">Staff Member</th>
                      <th className="py-3.5 px-4">Role & Access</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">Sales Track</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 text-sm">
                    {staff.map((member) => {
                      const roleCfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.employee;
                      const isSelf = member.id === currentUser?.id;
                      const isSelected = selectedMember?.id === member.id;

                      return (
                        <tr
                          key={member.id}
                          onClick={() => setSelectedMember(member)}
                          className={`table-row-3d cursor-pointer transition-colors ${
                            isSelected ? "bg-[#d4af37]/10 border-l-4 border-l-[#d4af37]" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          {/* Name & Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-inner"
                                style={{
                                  backgroundColor: roleCfg.bg,
                                  color: roleCfg.text,
                                  border: `1px solid ${roleCfg.border}`,
                                }}
                              >
                                {(member.first_name?.[0] || member.username?.[0] || "U").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-neutral-100 flex items-center gap-1.5 truncate">
                                  {member.full_name || member.username}
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-black tracking-wide bg-[#d4af37] text-black">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-neutral-500 truncate">@{member.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: roleCfg.bg,
                                color: roleCfg.text,
                                border: `1px solid ${roleCfg.border}`,
                              }}
                            >
                              <roleCfg.icon size={12} />
                              {roleCfg.label}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4 text-xs text-neutral-300">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-neutral-400 truncate max-w-[180px]">
                                <Mail size={12} className="text-neutral-500 shrink-0" />
                                <span className="truncate">{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1.5 text-neutral-500">
                                  <Phone size={12} className="shrink-0" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Sales Track */}
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <div className="font-bold text-[#d4af37]">{formatCurrency(member.total_sales)}</div>
                              <div className="text-[11px] text-neutral-500">
                                {member.orders_count || 0} orders
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                member.is_active
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-neutral-800 border-neutral-700 text-neutral-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  member.is_active ? "bg-emerald-400" : "bg-neutral-500"
                                }`}
                              />
                              {member.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(member)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-[#d4af37]/10 transition"
                                title="Edit Staff Profile"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                onClick={() => openResetModal(member)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition"
                                title="Reset Security Credentials"
                              >
                                <KeyRound size={14} />
                              </button>

                              <button
                                onClick={() => handleToggleActive(member)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-lg transition ${
                                  isSelf
                                    ? "opacity-30 cursor-not-allowed text-neutral-600"
                                    : member.is_active
                                    ? "text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                    : "text-neutral-500 hover:text-emerald-300"
                                }`}
                                title={
                                  isSelf
                                    ? "Cannot toggle your own status"
                                    : member.is_active
                                    ? "Suspend Account"
                                    : "Activate Account"
                                }
                              >
                                <Power size={14} />
                              </button>

                              <button
                                onClick={() => confirmDelete(member)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-lg transition ${
                                  isSelf
                                    ? "opacity-30 cursor-not-allowed text-neutral-600"
                                    : "text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
                                }`}
                                title={isSelf ? "Cannot delete yourself" : "Delete Account"}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Interactive Staff ID Badge Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <CreditCard size={15} />
              Digital ID Badge
            </span>
            <span className="text-[11px] text-neutral-400">Interactive Tilt</span>
          </div>

          <Tilt3D intensity={18} glareColor="255, 235, 170">
            <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-b from-[#1c1f2e] via-[#12141c] to-[#0a0b10] border-2 border-[#d4af37]/40 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.2)]">
              {/* Gold Lanyard Hole */}
              <div className="mx-auto w-12 h-3 rounded-full bg-black/80 border border-[#d4af37]/50 shadow-inner mb-5"></div>

              {/* Holographic Watermark Sheen */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-bl-full pointer-events-none blur-sm"></div>

              {/* Organization Header */}
              <div className="text-center pb-4 border-b border-[#d4af37]/20 relative">
                <div className="flex items-center justify-center gap-1 text-[#d4af37] text-xs font-black tracking-widest uppercase">
                  <Sparkles size={13} />
                  Enterprise Smart Inventory
                </div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
                  Official Security Credential
                </div>
              </div>

              {/* Employee Avatar & Medallion */}
              <div className="pt-6 pb-4 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#996515] via-[#d4af37] to-[#f7df8f] p-0.5 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                    <div className="w-full h-full rounded-2xl bg-[#12141c] flex items-center justify-center font-black text-2xl text-[#d4af37]">
                      {(previewUser.first_name?.[0] || previewUser.username?.[0] || "U").toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#12141c] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow">
                    <Shield size={14} />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white tracking-tight">
                  {previewUser.full_name || previewUser.username}
                </h3>
                <p className="text-xs text-[#d4af37] font-mono">@{previewUser.username}</p>

                {/* Role Medallion */}
                <div
                  className="mt-3 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase inline-flex items-center gap-1.5 shadow"
                  style={{
                    backgroundColor: previewRole.bg,
                    color: previewRole.text,
                    border: `1px solid ${previewRole.border}`,
                  }}
                >
                  <previewRole.icon size={13} />
                  {previewRole.label}
                </div>
              </div>

              {/* Credential Data Grid */}
              <div className="mt-4 p-3.5 rounded-2xl bg-black/50 border border-[#d4af37]/20 space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Badge ID:</span>
                  <span className="font-mono text-[#d4af37] font-bold">EMP-{String(previewUser.id || "101").padStart(4, "0")}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Email:</span>
                  <span className="text-neutral-200 truncate max-w-[150px]">{previewUser.email}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>System Access:</span>
                  <span className={previewUser.is_active ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                    {previewUser.is_active ? "Authorized & Active" : "Suspended"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Last Sign-In:</span>
                  <span className="text-neutral-300">{formatDate(previewUser.last_login)}</span>
                </div>
              </div>

              {/* Bottom NFC & Holographic Barcode */}
              <div className="mt-5 pt-3 border-t border-[#d4af37]/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-500">
                  <QrCode size={26} className="text-[#d4af37]" />
                  <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono">
                    HOLO-VERIFIED<br />256-BIT ENCRYPTED
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-[#d4af37] font-bold uppercase tracking-wider">
                    SMART CHIP
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">RFID ENABLED</div>
                </div>
              </div>
            </div>
          </Tilt3D>
        </div>
      </div>

      {/* ================= ADD STAFF MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-lg rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Enroll New Staff Member</h3>
                  <p className="text-xs text-neutral-400">Create employee credentials and assign security privileges.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              {getFormAlert() && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{getFormAlert()}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("first_name") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("first_name")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("last_name") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("last_name")}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="employee@enterprise.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  required
                />
                {getFieldError("email") && (
                  <p className="text-xs text-rose-400 mt-1">{getFieldError("email")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("username") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("username")}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("phone") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("phone")}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="employee" className="bg-[#12141c]">Staff / Cashier</option>
                    <option value="manager" className="bg-[#12141c]">Store Manager</option>
                    <option value="admin" className="bg-[#12141c]">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Initial Password</label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? "text" : "password"}
                      placeholder="Min. 6 chars (or default)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showAddPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {getFieldError("password") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("password")}</p>
                  )}
                </div>
              </div>


              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Enroll Staff Member"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT STAFF MODAL ================= */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-lg rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Modify Staff Profile</h3>
                  <p className="text-xs text-neutral-400">Updating account details for @{editingMember.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              {getFormAlert() && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{getFormAlert()}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("first_name") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("first_name")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("last_name") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("last_name")}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  required
                />
                {getFieldError("email") && <p className="text-xs text-rose-400 mt-1">{getFieldError("email")}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Role Hierarchy</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="employee" className="bg-[#12141c]">Staff / Cashier</option>
                    <option value="manager" className="bg-[#12141c]">Store Manager</option>
                    <option value="admin" className="bg-[#12141c]">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("phone") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("phone")}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RESET PASSWORD MODAL ================= */}
      {isResetModalOpen && resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Security Key</h3>
                  <p className="text-xs text-neutral-400">Reassign credentials for @{resetTarget.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={resetData.new_password}
                    onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {(resetErrors.new_password || resetErrors.errors?.new_password) && (
                  <p className="text-xs text-rose-400 mt-1">
                    {Array.isArray(resetErrors.new_password || resetErrors.errors?.new_password)
                      ? (resetErrors.new_password || resetErrors.errors?.new_password)[0]
                      : (resetErrors.new_password || resetErrors.errors?.new_password)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Confirm New Password</label>
                <input
                  type={showResetPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={resetData.new_password_confirm}
                  onChange={(e) => setResetData({ ...resetData, new_password_confirm: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 focus:outline-none focus:border-[#d4af37]"
                  required
                />
                {(resetErrors.new_password_confirm || resetErrors.errors?.new_password_confirm) && (
                  <p className="text-xs text-rose-400 mt-1">
                    {Array.isArray(resetErrors.new_password_confirm || resetErrors.errors?.new_password_confirm)
                      ? (resetErrors.new_password_confirm || resetErrors.errors?.new_password_confirm)[0]
                      : (resetErrors.new_password_confirm || resetErrors.errors?.new_password_confirm)}
                  </p>
                )}
              </div>


              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setIsResetModalOpen(false)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={resetting}>
                  {resetting ? "Resetting..." : "Commit Password"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl p-6 border-2 border-rose-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Revoke Account & Purge</h3>
                <p className="text-xs text-neutral-400">Irreversible credential revocation</p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 mt-4 leading-relaxed">
              Are you sure you want to permanently delete the staff member{" "}
              <strong className="text-white">
                {deleteTarget.full_name || deleteTarget.username}
              </strong>{" "}
              (<span className="font-mono text-xs text-[#d4af37]">@{deleteTarget.username}</span>)?
              Their historical transaction logs and sales records will remain preserved for audit compliance.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#d4af37]/20">
              <Button3D variant="dark" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button3D>
              <Button3D variant="danger" onClick={handleDeleteSubmit} disabled={deleting}>
                {deleting ? "Purging..." : "Confirm Purge"}
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
