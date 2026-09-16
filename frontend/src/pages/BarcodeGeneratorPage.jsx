import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Barcode,
  Check,
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
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

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
    <div className="space-y-8 pb-14 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <QrCode size={14} className="text-[#d4af37]" />
            Barcode & QR Labeling Suite
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Label Studio & Batch Print
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Synthesize retail price tags, continuous thermal rolls, and A4 adhesive label sheets with high-precision Code128 barcoding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={fetchCatalog}
            disabled={loadingProducts}
            icon={RefreshCw}
            className={loadingProducts ? "opacity-75" : ""}
          >
            Refresh Catalog
          </Button3D>

          {batchItems.length > 0 && (
            <Button3D variant="dark" onClick={handleClearAll} icon={Trash2}>
              Clear Queue
            </Button3D>
          )}

          <Button3D
            variant="gold"
            onClick={handleGeneratePDF}
            disabled={generating || batchItems.length === 0}
            icon={FileDown}
          >
            {generating ? "Synthesizing PDF..." : "Generate PDF Sheet"}
          </Button3D>
        </div>
      </div>

      {/* Main Grid: Left Catalog & Batch (2 cols), Right Layout & Hangtag (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Product Selector & Batch Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Catalog Selector */}
          <div className="card-3d p-5 rounded-2xl border border-[#d4af37]/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-sm text-white">Select Products for Labeling</h3>
              </div>
              <span className="text-xs text-neutral-400">{filteredProducts.length} items cataloged</span>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search products by title, SKU, or existing barcode..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/50 border border-[#d4af37]/25 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
              {searchProduct && (
                <button
                  onClick={() => setSearchProduct("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredProducts.slice(0, 12).map((p) => {
                const inQueue = batchItems.some((item) => item.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddItem(p)}
                    className={`table-row-3d p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      inQueue
                        ? "bg-[#d4af37]/10 border-[#d4af37]/40"
                        : "bg-black/40 border-[#d4af37]/15 hover:border-[#d4af37]/40"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs text-white truncate">{p.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        {p.sku} • ₹{p.selling_price}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`p-1 rounded-lg shrink-0 ${
                        inQueue
                          ? "bg-[#d4af37] text-black font-bold"
                          : "bg-black/60 border border-[#d4af37]/30 text-[#d4af37]"
                      }`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Print Queue Table */}
          <div className="card-3d rounded-2xl overflow-hidden border border-[#d4af37]/20">
            <div className="p-4 bg-black/40 border-b border-[#d4af37]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-sm text-white">Print Batch Queue ({batchItems.length})</h3>
              </div>
              <span className="text-xs text-neutral-400">Total Labels: <strong className="text-amber-300">{totalLabels}</strong></span>
            </div>

            {batchItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400">
                <Barcode size={32} className="text-[#d4af37]/40 mx-auto mb-2" />
                No products in print queue. Click any item above to add.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#d4af37]/20 bg-black/30 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Selling Price</th>
                      <th className="py-3 px-4">Quantity to Print</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 text-xs">
                    {batchItems.map((item) => (
                      <tr key={item.product.id} className="table-row-3d hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{item.product.name}</div>
                          <div className="font-mono text-neutral-400 text-[11px]">{item.product.sku}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          ₹{item.product.selling_price}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-black/60 border border-[#d4af37]/30 text-neutral-300 flex items-center justify-center hover:text-white"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(item.product.id, e.target.value)}
                              className="w-14 px-2 py-0.5 rounded-lg bg-black/60 border border-[#d4af37]/30 text-center font-mono font-bold text-white focus:outline-none focus:border-[#d4af37]"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-black/60 border border-[#d4af37]/30 text-neutral-300 flex items-center justify-center hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 transition"
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
          </div>
        </div>

        {/* Right Column (1 col): Template Picker & Interactive Hangtag Preview */}
        <div className="space-y-6">
          {/* Step 3: Layout Options */}
          <div className="card-3d p-5 rounded-2xl border border-[#d4af37]/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#d4af37]/20">
              <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-xs font-black flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-sm text-white">Label Format & Dimensions</h3>
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
                        ? "bg-[#d4af37]/15 border-[#d4af37] shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                        : "bg-black/40 border-[#d4af37]/15 hover:border-[#d4af37]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{opt.name}</span>
                      <span className="font-mono text-[10px] text-[#d4af37]">{opt.dimensions}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">{opt.description}</p>
                    {isSelected && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                        <CheckCircle2 size={11} />
                        <span>Active Configuration</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interactive Retail Hangtag Preview */}
            <div className="pt-2 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>Retail Plaque Preview</span>
              </div>

              <Tilt3D intensity={18} glareColor="255, 235, 170" float={true}>
                <div className="relative rounded-2xl p-5 overflow-hidden bg-gradient-to-b from-[#1c1f2e] via-[#12141c] to-[#0a0b10] border-2 border-[#d4af37]/50 shadow-[0_20px_45px_rgba(0,0,0,0.9)] text-center flex flex-col items-center">
                  {/* Tag Eyelet Hole */}
                  <div className="w-3.5 h-3.5 rounded-full bg-black/90 border border-[#d4af37]/60 shadow-inner mb-3" />

                  <h4 className="font-bold text-xs text-white tracking-tight line-clamp-1">
                    {previewItem.name}
                  </h4>
                  <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    SKU: {previewItem.sku}
                  </div>

                  {/* Simulated Barcode Lines */}
                  <div className="flex gap-[2px] h-9 items-center my-3 p-1 rounded bg-black/60 border border-[#d4af37]/20">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 2, 4, 1, 2].map((w, i) => (
                      <div
                        key={i}
                        className="bg-[#d4af37] rounded-sm h-full opacity-90"
                        style={{ width: `${w * 1.6}px` }}
                      />
                    ))}
                  </div>

                  <div className="text-xl font-black font-mono text-amber-300 tracking-tight">
                    ₹{previewItem.selling_price}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-neutral-400 mt-1">
                    GENUINE VERIFIED INVENTORY
                  </div>
                </div>
              </Tilt3D>
            </div>

            {/* Print Summary Card */}
            <div className="p-4 rounded-xl bg-black/60 border border-[#d4af37]/20 space-y-1.5 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Unique SKUs:</span>
                <span className="text-white font-bold">{batchItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sticker Labels:</span>
                <span className="font-mono text-amber-300 font-bold">{totalLabels}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Sheets:</span>
                <span className="text-white font-semibold">
                  {totalPages} {totalPages === 1 ? "page" : "pages"}
                </span>
              </div>
            </div>

            <Button3D
              variant="gold"
              onClick={handleGeneratePDF}
              disabled={generating || batchItems.length === 0}
              className="w-full py-3 rounded-xl text-xs font-black"
            >
              {generating ? "Synthesizing PDF..." : "Generate Printable Labels"}
            </Button3D>
          </div>
        </div>
      </div>
    </div>
  );
}
