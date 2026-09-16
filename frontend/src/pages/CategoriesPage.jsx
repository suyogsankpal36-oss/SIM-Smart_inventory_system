import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FolderPlus,
  Search,
  Edit2,
  Trash2,
  Folder,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import productService from "../services/productService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

export default function CategoriesPage() {
  const { isAdmin, isManager } = useAuth();
  const canManage = isAdmin || isManager;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", status: "active" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [searchTerm, statusFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await productService.getCategories(params);
      const list = Array.isArray(data) ? data : data.results || [];
      setCategories(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", status: "active" });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      status: cat.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await productService.updateCategory(editingCategory.id, formData);
        toast.success("Category updated successfully!");
      } else {
        await productService.createCategory(formData);
        toast.success("Category created successfully!");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.name?.[0] || "Operation failed.";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await productService.deleteCategory(deleteTarget.id);
      toast.success(`Category "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to delete category.";
      toast.error(detail, { duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.status === "active").length;
  const totalLinkedProducts = categories.reduce((sum, c) => sum + (c.product_count || 0), 0);

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
            Product Categories
          </h1>
          <p style={{ color: "#a39d91", fontSize: "0.875rem", marginTop: "0.35rem" }}>
            Classify and organize your products for faster POS lookup and clean catalog management.
          </p>
        </div>

        {canManage && (
          <Button3D
            variant="gold"
            icon={FolderPlus}
            onClick={openCreateModal}
          >
            Add Category
          </Button3D>
        )}
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
              <Folder size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Categories
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
              <CheckCircle2 size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Active Status
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
              <Layers size={24} />
            </div>
            <div style={{ transform: "translateZ(14px)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a39d91", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Categorized Products
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800 }} className="text-gradient-gold">
                {totalLinkedProducts}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 280px" }}>
          <div style={{ position: "relative", width: "100%" }}>
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
              placeholder="Search category by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem 0.6rem 2.4rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.875rem", color: "#d4af37", fontWeight: 700 }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <option value="all">All Categories</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Categories Table */}
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
                  CATEGORY NAME
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  DESCRIPTION
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  STATUS
                </th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 800, color: "#d4af37", letterSpacing: "0.05em" }}>
                  PRODUCTS
                </th>
                {canManage && (
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
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} style={{ padding: "3.5rem", textAlign: "center", color: "#a39d91" }}>
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} style={{ padding: "3.5rem", textAlign: "center" }}>
                    <Folder size={44} style={{ color: "rgba(212, 175, 55, 0.4)", margin: "0 auto 0.75rem" }} />
                    <p style={{ color: "#a39d91", fontWeight: 600, margin: 0 }}>No categories found.</p>
                    {canManage && (
                      <Button3D
                        variant="gold"
                        size="sm"
                        onClick={openCreateModal}
                        style={{ marginTop: "1rem" }}
                      >
                        + Add your first category
                      </Button3D>
                    )}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="table-row-3d"
                    style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.12)" }}
                  >
                    <td style={{ padding: "1rem", fontWeight: 700, color: "#f5f3ef" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "8px",
                            background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(153, 101, 21, 0.1) 100%)",
                            border: "1px solid rgba(212, 175, 55, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#d4af37",
                          }}
                        >
                          <Folder size={16} />
                        </div>
                        <span style={{ color: "#f7df8f" }}>{cat.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", color: "#a39d91", fontSize: "0.875rem", maxWidth: "320px" }}>
                      {cat.description || <span style={{ color: "#686358" }}>No description</span>}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        className="badge-3d"
                        style={{
                          background: cat.status === "active" ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.2)",
                          color: cat.status === "active" ? "#34d399" : "#a39d91",
                          border: `1px solid ${cat.status === "active" ? "rgba(16, 185, 129, 0.4)" : "rgba(148, 163, 184, 0.3)"}`,
                        }}
                      >
                        {cat.status === "active" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {cat.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className="badge-3d-gold">
                        {cat.product_count} product{cat.product_count !== 1 ? "s" : ""}
                      </span>
                    </td>
                    {canManage && (
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                          <Button3D
                            variant="dark"
                            size="sm"
                            icon={Edit2}
                            onClick={() => openEditModal(cat)}
                            title="Edit Category"
                          />
                          {isAdmin && (
                            <Button3D
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setDeleteTarget(cat)}
                              title="Delete Category"
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
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
              maxWidth: "500px",
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
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#d4af37",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electronics, Beverages, Footwear"
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

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#d4af37",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Optional notes or details about products in this category..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#d4af37",
                      marginBottom: "0.4rem",
                    }}
                  >
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
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "2rem",
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
                  {editingCategory ? "Update Category" : "Create Category"}
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
                Delete Category?
              </h3>
            </div>

            <p style={{ color: "#a39d91", fontSize: "0.875rem", margin: "1.25rem 0 1.75rem", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: "#f7df8f" }}>"{deleteTarget.name}"</strong>? If products are linked to
              this category, deletion will be blocked by system safety rules.
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
