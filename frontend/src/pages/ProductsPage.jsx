import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Upload,
  X,
  QrCode,
  Layers,
  Coins,
  Boxes,
} from "lucide-react";
import productService from "../services/productService";
import inventoryService from "../services/inventoryService";
import { useAuth } from "../context/AuthContext";
import ProductBarcodeModal from "../components/ProductBarcodeModal";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

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
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      toast.error("Failed to load product catalog.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      category: categories[0]?.id || "",
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
      category: prod.category || "",
      description: prod.description || "",
      purchase_price: prod.purchase_price,
      selling_price: prod.selling_price,
      tax_rate: prod.tax_rate,
      minimum_stock: prod.minimum_stock,
      initial_stock: prod.stock_quantity,
      supplier_name: prod.supplier_name || "",
    });
    setImageFile(null);
    setImagePreview(prod.image || null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      toast.error("Valid selling price is required.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (key === "initial_stock" && editingProduct) return;
        if (val !== undefined && val !== null) data.append(key, val);
      });
      if (imageFile) {
        data.append("image", imageFile);
      }

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data);
        toast.success(`Updated "${formData.name}" successfully!`);
      } else {
        await productService.createProduct(data);
        toast.success(`Product "${formData.name}" created!`);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.sku?.[0] || err.response?.data?.detail || "Failed to save product.";
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
      await inventoryService.adjustStock(adjustModalProduct.id, {
        adjustment_type: adjustType,
        quantity: qty,
        reason: adjustReason.trim() || "Manual adjustment from products table",
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
    <div className="space-y-8 pb-14 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <Package size={14} className="text-[#d4af37]" />
            Catalog Master & SKU Directory
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Product Catalog & Pricing
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Register new inventory items, manage pricing, margin structures, barcode metadata, and assign supplier channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManage && (
            <Button3D
              variant="gold"
              onClick={openCreateModal}
              icon={Plus}
            >
              Add Product
            </Button3D>
          )}
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total Products</span>
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Package size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-white tracking-tight">{totalCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Active catalog items
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">In Stock</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-emerald-400 tracking-tight">{inStockCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Healthy inventory depth
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Low Stock Alert</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-amber-300 tracking-tight">{lowStockCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              At or below reorder threshold
            </div>
          </div>
        </Tilt3D>

        <Tilt3D intensity={12}>
          <div className="card-3d p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Out of Stock</span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle size={20} />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-rose-400 tracking-tight">{outOfStockCount}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              Zero-inventory lines
            </div>
          </div>
        </Tilt3D>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all" className="bg-[#12141c]">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#12141c]">
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all" className="bg-[#12141c]">All Stock Status</option>
            <option value="in_stock" className="bg-[#12141c]">In Stock</option>
            <option value="low_stock" className="bg-[#12141c]">Low Stock</option>
            <option value="out_of_stock" className="bg-[#12141c]">Out of Stock</option>
          </select>

          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-xs text-neutral-300 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="-created_at" className="bg-[#12141c]">Sort: Newest First</option>
            <option value="name" className="bg-[#12141c]">Sort: Name (A-Z)</option>
            <option value="selling_price" className="bg-[#12141c]">Sort: Price (Low → High)</option>
            <option value="-selling_price" className="bg-[#12141c]">Sort: Price (High → Low)</option>
            <option value="stock_quantity" className="bg-[#12141c]">Sort: Stock Level</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/20 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="py-3.5 px-4">Product & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Cost / Selling Price</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4af37]/10 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-400 text-xs">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Package size={40} className="text-[#d4af37]/40 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">No products matching query found.</p>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isLow = prod.stock_quantity <= prod.minimum_stock && prod.stock_quantity > 0;
                  const isOut = prod.stock_quantity <= 0;

                  return (
                    <tr key={prod.id} className="table-row-3d hover:bg-white/[0.02] transition">
                      {/* Product & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-10 h-10 object-cover rounded-xl border border-[#d4af37]/25 shadow"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-black/50 border border-[#d4af37]/20 flex items-center justify-center font-black text-sm text-[#d4af37]">
                              {prod.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">{prod.name}</div>
                            <div className="font-mono text-[11px] text-neutral-500">{prod.sku}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]">
                          {prod.category_name || "General"}
                        </span>
                      </td>

                      {/* Cost / Selling Price */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <div className="font-mono font-bold text-amber-300">
                            ₹{parseFloat(prod.selling_price).toFixed(2)}
                          </div>
                          <div className="font-mono text-[10px] text-neutral-500">
                            Cost: ₹{parseFloat(prod.purchase_price).toFixed(2)}
                          </div>
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <span
                            className={`font-mono font-black ${
                              isOut ? "text-rose-400" : isLow ? "text-amber-300" : "text-emerald-400"
                            }`}
                          >
                            {prod.stock_quantity}
                          </span>
                          <span className="text-[10px] text-neutral-500 ml-1">
                            (Min: {prod.minimum_stock})
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isOut
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                              : isLow
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOut ? "bg-rose-400" : isLow ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          />
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setBarcodeModalProduct(prod)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-[#d4af37]/10 transition"
                            title="Generate Barcode"
                          >
                            <QrCode size={14} />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => {
                                  setAdjustModalProduct(prod);
                                  setAdjustType("add");
                                  setAdjustQty("");
                                  setAdjustReason("");
                                }}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                                title="Adjust Stock"
                              >
                                <Boxes size={14} />
                              </button>

                              <button
                                onClick={() => openEditModal(prod)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition"
                                title="Edit Product"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                onClick={() => setDeleteProduct(prod)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Product"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
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

      {/* ================= ADD / EDIT PRODUCT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-2xl rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingProduct ? `Edit "${editingProduct.name}"` : "Register New Product"}
                  </h3>
                  <p className="text-xs text-neutral-400">SKU definition, financial price points, and tax rules.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    placeholder="e.g. Organic Almond Milk 1L"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    name="sku"
                    placeholder="Leave blank for auto-generation"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="" className="bg-[#12141c]">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#12141c]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    name="supplier_name"
                    placeholder="e.g. Apex Global Distributors"
                    value={formData.supplier_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="purchase_price"
                    placeholder="0.00"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    name="selling_price"
                    placeholder="0.00"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-amber-300 font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    name="minimum_stock"
                    value={formData.minimum_stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">Initial Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      name="initial_stock"
                      value={formData.initial_stock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white font-mono focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Product Description</label>
                <textarea
                  rows={2}
                  name="description"
                  placeholder="Ingredients, size specs, batch details..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Image Upload */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-black/50 border border-[#d4af37]/30 flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={20} className="text-[#d4af37]/50" />
                  )}
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-[#d4af37]/30 text-xs text-[#d4af37] font-semibold hover:bg-[#d4af37]/10 cursor-pointer transition">
                  <Upload size={13} />
                  <span>Upload Product Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= QUICK ADJUST STOCK MODAL ================= */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-[#d4af37]" />
                <h3 className="font-bold text-base text-white">Adjust Stock Level</h3>
              </div>
              <button onClick={() => setAdjustModalProduct(null)} className="text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-[#d4af37]/20 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{adjustModalProduct.name}</div>
                  <div className="text-neutral-400 font-mono text-[11px]">{adjustModalProduct.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-neutral-400">Current Stock</div>
                  <div className="font-bold font-mono text-amber-300 text-sm">{adjustModalProduct.stock_quantity}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("add")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    adjustType === "add"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-black/40 border-neutral-800 text-neutral-400"
                  }`}
                >
                  + Add Stock (Received)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("reduce")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    adjustType === "reduce"
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-black/40 border-neutral-800 text-neutral-400"
                  }`}
                >
                  - Deduct (Damage/Loss)
                </button>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 25"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-white font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Reason / Reference</label>
                <input
                  type="text"
                  placeholder="Supplier shipment, damaged freight, audit..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setAdjustModalProduct(null)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={adjusting}>
                  {adjusting ? "Updating..." : "Commit Stock"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl p-6 border-2 border-rose-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center gap-2.5 pb-3 border-b border-rose-500/20">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Purge Catalog Product</h3>
                <p className="text-xs text-neutral-400">Irreversible item deletion</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 mt-4 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">"{deleteProduct.name}"</strong> (SKU:{" "}
              <span className="font-mono text-[#d4af37]">{deleteProduct.sku}</span>)?
              Any past sales invoices referring to this product will retain historic text snapshots.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-[#d4af37]/20">
              <Button3D variant="dark" onClick={() => setDeleteProduct(null)}>
                Cancel
              </Button3D>
              <Button3D variant="danger" onClick={handleDeleteProduct} disabled={deleting}>
                {deleting ? "Purging..." : "Confirm Purge"}
              </Button3D>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal Integration */}
      {barcodeModalProduct && (
        <ProductBarcodeModal
          product={barcodeModalProduct}
          onClose={() => setBarcodeModalProduct(null)}
        />
      )}
    </div>
  );
}
