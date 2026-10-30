import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  FileDown,
  Layers,
  Package,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import productService from "../services/productService";
import barcodeService from "../services/barcodeService";
import { Badge, Button, Card, Input, StatsCard, Table } from "../components/ui";

const LAYOUT_OPTIONS = [
  {
    id: "a4_24",
    name: "A4 Sheet (24-up: 3x8)",
    dimensions: "70mm × 37mm",
    capacity: 24,
    description: "Industry standard for packaging, boxes, and retail shelves.",
  },
  {
    id: "a4_30",
    name: "A4 Sheet (30-up: 3x10)",
    dimensions: "70mm × 29.7mm",
    capacity: 30,
    description: "Compact labels for smaller products, cosmetics, and accessories.",
  },
  {
    id: "single_thermal",
    name: "Thermal Roll (Single)",
    dimensions: "50mm × 30mm",
    capacity: 1,
    description: "Continuous thermal sticker rolls for direct desktop label printers.",
  },
  {
    id: "shelf_tag",
    name: "Shelf Talker Tag",
    dimensions: "70mm × 45mm",
    capacity: 1,
    description: "Large retail shelf tag with prominent price and product details.",
  },
];

export default function BarcodeGeneratorPage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchProduct, setSearchProduct] = useState("");

  // Batch items to print: array of { product, quantity }
  const [batchItems, setBatchItems] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState("a4_24");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    try {
      const data = await productService.getProducts({ page_size: 100 });
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products for barcode studio.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddItem = (product) => {
    setBatchItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Added ${product.name} to print queue.`);
  };

  const handleUpdateQty = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setBatchItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(qty, 500) } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setBatchItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearAll = () => {
    setBatchItems([]);
  };

  const totalLabels = batchItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedConfig = LAYOUT_OPTIONS.find((l) => l.id === selectedLayout) || LAYOUT_OPTIONS[0];
  const totalPages = Math.ceil(totalLabels / (selectedConfig.capacity || 1));

  const handleGeneratePDF = async () => {
    if (batchItems.length === 0) {
      toast.error("Add at least one product to the print batch.");
      return;
    }

    setGenerating(true);
    try {
      const itemsPayload = batchItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      await barcodeService.downloadBatchPDF({
        layout: selectedLayout,
        items: itemsPayload,
      });

      toast.success("Barcode sheet generated! PDF download started.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please verify backend barcode service.");
    } finally {
      setGenerating(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchProduct.trim()) return true;
    const term = searchProduct.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term)
    );
  });

  const previewItem = batchItems[0]?.product || products[0] || {
    name: "Luxury Reserve Gold Specimen",
    sku: "GLD-SKU-9999",
    selling_price: "1250.00",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Label Studio & Batch Print
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Synthesize retail price tags, continuous thermal rolls, and A4 adhesive label sheets with high-precision Code128 barcoding.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchCatalog}
            loading={loadingProducts}
          >
            Refresh Catalog
          </Button>

          {batchItems.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} icon={Trash2}>
              Clear Queue
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleGeneratePDF}
            loading={generating}
            disabled={batchItems.length === 0}
            icon={FileDown}
          >
            Generate PDF Sheet
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Catalog Picker & Print Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Catalog Selector */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-content text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-base-content text-sm">Select Products for Labeling</h3>
              </div>
              <span className="text-xs text-base-content/60">{filteredProducts.length} items cataloged</span>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by title, SKU, or existing barcode..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 bg-base-100"
              />
              {searchProduct && (
                <button
                  onClick={() => setSearchProduct("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredProducts.slice(0, 16).map((p) => {
                const inQueue = batchItems.some((item) => item.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddItem(p)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      inQueue
                        ? "bg-primary/10 border-primary/40 text-base-content"
                        : "bg-base-200/50 border-base-content/10 hover:border-primary/40 text-base-content"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs truncate">{p.name}</div>
                      <div className="text-[11px] font-mono text-base-content/60">
                        {p.sku} • ₹{p.selling_price}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-xs btn-square ${
                        inQueue ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Step 2: Print Queue Table */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-content text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-base-content text-sm">
                  Print Batch Queue ({batchItems.length})
                </h3>
              </div>
              <span className="text-xs text-base-content/70">
                Total Labels: <strong className="text-primary font-bold">{totalLabels}</strong>
              </span>
            </div>

            {batchItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-base-content/50">
                <Barcode size={36} className="text-primary/40 mx-auto mb-2" />
                No products in print queue. Click any item above to add.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs uppercase text-base-content/60 border-b border-base-content/10">
                      <th>Product Details</th>
                      <th>Selling Price</th>
                      <th>Quantity to Print</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchItems.map((item) => (
                      <tr key={item.product.id} className="hover:bg-base-200/50">
                        <td>
                          <div className="font-semibold text-base-content text-xs">{item.product.name}</div>
                          <div className="font-mono text-base-content/50 text-[11px]">{item.product.sku}</div>
                        </td>
                        <td className="font-mono font-bold text-primary text-xs">
                          ₹{item.product.selling_price}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                              className="btn btn-xs btn-square btn-ghost"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(item.product.id, e.target.value)}
                              className="input input-bordered input-xs w-14 text-center font-mono font-bold bg-base-100"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                              className="btn btn-xs btn-square btn-ghost"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 col): Template Picker & Live Preview */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 pb-3 border-b border-base-content/10 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-content text-xs font-black flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-base-content text-sm">Label Format & Dimensions</h3>
            </div>

            <div className="space-y-2">
              {LAYOUT_OPTIONS.map((opt) => {
                const isSelected = selectedLayout === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedLayout(opt.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "bg-base-200/50 border-base-content/10 hover:border-base-content/30"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-base-content">{opt.name}</span>
                      <span className="font-mono text-[10px] text-primary">{opt.dimensions}</span>
                    </div>
                    <p className="text-[11px] text-base-content/60 mt-1">{opt.description}</p>
                    {isSelected && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                        <CheckCircle2 size={12} />
                        <span>Active Format</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interactive Retail Tag Preview */}
            <div className="pt-4 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>Live Barcode Tag Preview</span>
              </div>

              <div className="rounded-2xl p-4 bg-base-100 border-2 border-primary/40 shadow-md text-center flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-base-300 border border-base-content/20 mb-2" />
                <h4 className="font-bold text-xs text-base-content tracking-tight line-clamp-1">
                  {previewItem.name}
                </h4>
                <div className="text-[10px] font-mono text-base-content/60 mt-0.5">
                  SKU: {previewItem.sku}
                </div>

                {/* Simulated Barcode */}
                <div className="flex gap-[2px] h-9 items-center my-2 p-1 rounded bg-base-200 border border-base-content/10">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 2, 4, 1, 2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-base-content rounded-sm h-full opacity-80"
                      style={{ width: `${w * 1.6}px` }}
                    />
                  ))}
                </div>

                <div className="text-xl font-black font-mono text-primary tracking-tight">
                  ₹{previewItem.selling_price}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-base-content/50 mt-1">
                  GENUINE VERIFIED INVENTORY
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-xl bg-base-200/60 border border-base-content/10 space-y-1.5 text-xs text-base-content/70 mt-4">
              <div className="flex justify-between">
                <span>Unique SKUs:</span>
                <span className="text-base-content font-bold">{batchItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sticker Labels:</span>
                <span className="font-mono text-primary font-bold">{totalLabels}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Sheets:</span>
                <span className="text-base-content font-semibold">
                  {totalPages} {totalPages === 1 ? "page" : "pages"}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-4"
              onClick={handleGeneratePDF}
              loading={generating}
              disabled={batchItems.length === 0}
              icon={FileDown}
            >
              Generate Printable Labels
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
