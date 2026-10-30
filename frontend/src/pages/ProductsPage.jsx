import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Edit,
  Folder,
  Layers,
  Package,
  Plus,
  QrCode,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import productService from "../services/productService";
import inventoryService from "../services/inventoryService";
import { useAuth } from "../context/AuthContext";
import ProductBarcodeModal from "../components/ProductBarcodeModal";
import { Badge, Button, Card, Input, Modal, Select, StatsCard, Table } from "../components/ui";

export default function ProductsPage() {
  const { isAdmin, isManager } = useAuth();
  const canManage = isAdmin || isManager;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ordering, setOrdering] = useState("-created_at");

  // Product Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    purchase_price: "",
    selling_price: "",
    tax_rate: "18.00",
    minimum_stock: "5",
    initial_stock: "0",
    supplier_name: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick Adjust Stock Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);
  const [adjustType, setAdjustType] = useState("add");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Barcode Modal
  const [barcodeModalProduct, setBarcodeModalProduct] = useState(null);

  // Delete Modal
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, statusFilter, ordering]);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (ordering) params.ordering = ordering;

      const data = await productService.getProducts(params);
      const list = Array.isArray(data) ? data : data.results || [];
      setProducts(list);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSku = async () => {
    try {
      const res = await productService.generateSku();
      if (res && res.sku) {
        setFormData((prev) => ({ ...prev, sku: res.sku }));
        toast.success(`Generated SKU: ${res.sku}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to auto-generate SKU candidate.");
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      category: categories.length > 0 ? String(categories[0].id) : "",
      description: "",
      purchase_price: "",
      selling_price: "",
      tax_rate: "18.00",
      minimum_stock: "5",
      initial_stock: "0",
      supplier_name: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category ? String(prod.category) : "",
      description: prod.description || "",
      purchase_price: String(prod.purchase_price || ""),
      selling_price: String(prod.selling_price || ""),
      tax_rate: String(prod.tax_rate ?? "18.00"),
      minimum_stock: String(prod.minimum_stock ?? "5"),
      initial_stock: String(prod.stock_quantity ?? "0"),
      supplier_name: prod.supplier_name || "",
    });
    setImageFile(null);
    setImagePreview(prod.image || null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!formData.sku.trim()) {
      toast.error("SKU is required.");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      if (imageFile) {
        data.append("image", imageFile);
      }

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data);
        toast.success("Product updated successfully!");
      } else {
        await productService.createProduct(data);
        toast.success("Product created successfully!");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to save product.";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await productService.deleteProduct(deleteProduct.id);
      toast.success(`Deleted "${deleteProduct.name}" successfully.`);
      setDeleteProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    const qty = parseInt(adjustQty, 10);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    setAdjusting(true);
    try {
      await inventoryService.adjustStock({
        product: adjustModalProduct.id,
        adjustment_type: adjustType,
        quantity: qty,
        notes: adjustReason.trim() || "Manual adjustment from products table",
      });
      toast.success(`Stock updated for "${adjustModalProduct.name}".`);
      setAdjustModalProduct(null);
      setAdjustQty("");
      setAdjustReason("");
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to adjust stock.");
    } finally {
      setAdjusting(false);
    }
  };

  // Metrics
  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.stock_quantity > p.minimum_stock).length;
  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.minimum_stock && p.stock_quantity > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <Package className="w-3 h-3 mr-1" />
              Catalog Master & SKU Directory
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            Product Catalog & Pricing
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            Register inventory items, barcodes, margins, and stock thresholds.
          </p>
        </div>

        {canManage && (
          <Button variant="gold" icon={Plus} onClick={openCreateModal} size="sm">
            Add Product
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Catalog"
          value={totalCount}
          icon={Package}
          description="Active products"
          accentColor="primary"
        />
        <StatsCard
          title="In Stock"
          value={inStockCount}
          icon={CheckCircle2}
          description="Optimal inventory"
          accentColor="success"
        />
        <StatsCard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          description="At reorder level"
          accentColor="warning"
        />
        <StatsCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={XCircle}
          description="Depleted items"
          accentColor="error"
        />
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search product, SKU, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-100 text-base-content"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100 text-xs text-base-content"
            >
              <option value="-created_at">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="-selling_price">Price (High-Low)</option>
              <option value="selling_price">Price (Low-High)</option>
              <option value="stock_quantity">Stock (Low-High)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card bodyClassName="p-0">
        <Table
          loading={loading}
          data={products}
          columns={[
            {
              header: "Product Details",
              key: "name",
              render: (row) => (
                <div className="flex items-center gap-3">
                  {row.image ? (
                    <img
                      src={row.image}
                      alt={row.name}
                      className="w-10 h-10 rounded-xl object-cover border border-base-300 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-base-content truncate max-w-xs">{row.name}</div>
                    <div className="flex items-center gap-2 text-xs text-base-content/60 mt-0.5">
                      <span className="font-mono text-primary font-semibold">{row.sku}</span>
                      <span>•</span>
                      <span>{row.category_name || "Uncategorized"}</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              header: "Selling Price",
              key: "selling_price",
              render: (row) => (
                <div>
                  <span className="font-bold text-base-content">
                    ₹{Number(row.selling_price || 0).toFixed(2)}
                  </span>
                  <div className="text-[10px] text-base-content/50">
                    Cost: ₹{Number(row.purchase_price || 0).toFixed(2)}
                  </div>
                </div>
              ),
            },
            {
              header: "Stock Level",
              key: "stock_quantity",
              align: "center",
              render: (row) => (
                <div>
                  <span className="font-extrabold text-sm text-base-content">
                    {row.stock_quantity}
                  </span>
                  <span className="text-[11px] text-base-content/50 block">
                    Min: {row.minimum_stock}
                  </span>
                </div>
              ),
            },
            {
              header: "Status",
              key: "status",
              render: (row) => (
                <Badge status={row.status}>
                  {String(row.status || "").replace("_", " ").toUpperCase()}
                </Badge>
              ),
            },
            {
              header: "Supplier",
              key: "supplier_name",
              render: (row) => (
                <span className="text-xs text-base-content/70">
                  {row.supplier_name || "Direct / In-House"}
                </span>
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
                          onClick={() => setBarcodeModalProduct(row)}
                          className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                          title="Generate Barcode / QR Label"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustModalProduct(row)}
                          className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-base-content"
                          title="Adjust Stock"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-base-content"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteProduct(row)}
                            className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                            title="Delete Product"
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
          emptyMessage="No products found"
          emptyDescription="Try adjusting your search criteria or register a new product."
          emptyAction={
            canManage && (
              <Button variant="gold" size="sm" icon={Plus} onClick={openCreateModal}>
                Add First Product
              </Button>
            )
          }
        />
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Register New Product"}
        subtitle="Catalog specifications, pricing calculations, and inventory thresholds"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              placeholder="e.g. Wireless Barcode Scanner"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-xs font-semibold text-base-content/90 flex items-center gap-1">
                  SKU / Barcode Code <span className="text-error font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-primary text-[10px] font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Gen SKU
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. PRD-89421"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                className="input input-bordered input-sm w-full rounded-xl bg-base-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Input
              label="Supplier / Vendor"
              placeholder="e.g. Apex Electronics Ltd"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Purchase Cost (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              required
            />
            <Input
              label="Selling Price (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              required
            />
            <Input
              label="GST Tax Rate (%)"
              type="number"
              step="0.01"
              placeholder="18.00"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Stock Warning Threshold"
              type="number"
              placeholder="5"
              value={formData.minimum_stock}
              onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
            />
            {!editingProduct && (
              <Input
                label="Initial Stock Quantity"
                type="number"
                placeholder="0"
                value={formData.initial_stock}
                onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
              />
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-xs font-semibold text-base-content/90 block mb-1.5">
              Product Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-base-300"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input file-input-bordered file-input-sm w-full rounded-xl bg-base-100 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-base-300/40">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={submitting}>
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustModalProduct}
        onClose={() => setAdjustModalProduct(null)}
        title="Adjust Inventory Stock"
        subtitle={`Current stock for "${adjustModalProduct?.name}": ${adjustModalProduct?.stock_quantity} units`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <Select
            label="Adjustment Type"
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value)}
            options={[
              { value: "add", label: "Stock In (+ Add units)" },
              { value: "remove", label: "Stock Out (- Remove units)" },
              { value: "set", label: "Physical Inventory Count (= Set exact count)" },
            ]}
          />

          <Input
            label="Adjustment Quantity"
            type="number"
            min="1"
            placeholder="e.g. 25"
            value={adjustQty}
            onChange={(e) => setAdjustQty(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Reason / Notes"
            placeholder="e.g. Received new shipment from vendor, damaged item, etc."
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setAdjustModalProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={adjusting}>
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Barcode Modal */}
      {barcodeModalProduct && (
        <ProductBarcodeModal
          product={barcodeModalProduct}
          onClose={() => setBarcodeModalProduct(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product"
        subtitle={`Are you sure you want to delete "${deleteProduct?.name}"?`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteProduct(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteProduct} loading={deleting}>
              Delete Product
            </Button>
          </div>
        }
      >
        <p className="text-xs text-base-content/70">
          This operation permanently removes the product from the catalog. Historical sales invoices
          and audit logs will retain their existing line item records.
        </p>
      </Modal>
    </div>
  );
}
