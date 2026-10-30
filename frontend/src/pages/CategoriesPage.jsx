import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Folder,
  FolderPlus,
  Layers,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import productService from "../services/productService";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Input, Modal, Select, Table } from "../components/ui";

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
      const detail = err.response?.data?.detail || "Cannot delete category linked to active products.";
      toast.error(detail);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <Layers className="w-3 h-3 mr-1" />
              Taxonomy Management
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            Product Categories
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            Organize catalog classifications, product counts, and active status.
          </p>
        </div>

        {canManage && (
          <Button variant="primary" icon={FolderPlus} onClick={openCreateModal} size="sm">
            Add Category
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search category name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-100 text-base-content"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-base-content/60 whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Categories Table */}
      <Card bodyClassName="p-0">
        <Table
          loading={loading}
          data={categories}
          columns={[
            {
              header: "Category Name",
              key: "name",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-base-content">{row.name}</div>
                    <div className="text-xs text-base-content/50 line-clamp-1">
                      {row.description || "No description provided"}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              header: "Associated Products",
              key: "num_products",
              align: "center",
              render: (row) => (
                <span className="badge badge-neutral text-xs font-bold">
                  {row.num_products ?? row.products_count ?? 0} Products
                </span>
              ),
            },
            {
              header: "Status",
              key: "status",
              render: (row) => (
                <Badge status={row.status || "active"}>
                  {(row.status || "active").toUpperCase()}
                </Badge>
              ),
            },
            ...(canManage
              ? [
                  {
                    header: "Actions",
                    key: "actions",
                    align: "right",
                    render: (row) => (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          emptyMessage="No categories found"
          emptyDescription="Create your first catalog category to start classifying inventory products."
          emptyAction={
            canManage && (
              <Button variant="primary" size="sm" icon={FolderPlus} onClick={openCreateModal}>
                Create Category
              </Button>
            )
          }
        />
      </Card>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create New Category"}
        subtitle="Categories group related inventory products for reporting and POS cataloging"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Beverages, Electronics, Hardware"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <div className="form-control w-full">
            <label className="label pb-1.5 pt-0">
              <span className="label-text font-semibold text-xs text-base-content/90">
                Description (Optional)
              </span>
            </label>
            <textarea
              placeholder="Brief description of products within this category..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="textarea textarea-bordered rounded-xl text-sm bg-base-100 text-base-content"
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: "active", label: "Active (Available in POS & Catalog)" },
              { value: "inactive", label: "Inactive (Hidden from POS)" },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
        subtitle={`Are you sure you want to delete category "${deleteTarget?.name}"?`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
              Delete Category
            </Button>
          </div>
        }
      >
        <p className="text-xs text-base-content/70">
          This operation cannot be undone. If there are products assigned to this category, please
          reassign or remove them before deleting.
        </p>
      </Modal>
    </div>
  );
}
