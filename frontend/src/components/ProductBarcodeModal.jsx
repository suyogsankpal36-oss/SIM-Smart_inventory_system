import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Barcode,
  Check,
  Copy,
  Download,
  FileDown,
  Printer,
  QrCode,
  RefreshCw,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import barcodeService from "../services/barcodeService";
import Tilt3D from "./3d/Tilt3D";
import Button3D from "./3d/Button3D";

export default function ProductBarcodeModal({ product, onClose }) {
  const [activeCodeType, setActiveCodeType] = useState("code128"); // 'code128' or 'qr'
  const [svgContent, setSvgContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Print settings
  const [quantity, setQuantity] = useState(1);
  const [layout, setLayout] = useState("a4_24");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (product?.id) {
      loadBarcodeSVG();
    }
  }, [product?.id, activeCodeType]);

  const loadBarcodeSVG = async () => {
    setLoading(true);
    try {
      const data = await barcodeService.getBarcodeSVG(product.id, activeCodeType);
      setSvgContent(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate vector barcode.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySku = () => {
    if (!product?.sku) return;
    navigator.clipboard.writeText(product.sku);
    setCopied(true);
    toast.success(`SKU "${product.sku}" copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${product.sku}_${activeCodeType}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Vector SVG downloaded.");
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await barcodeService.downloadSingleLabelPDF(
        product.id,
        quantity,
        layout,
        `labels_${product.sku}`
      );
      toast.success(`Generated ${quantity} label(s) in PDF.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate printable labels.");
    } finally {
      setDownloading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-white">
      <div className="card-3d w-full max-w-lg rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#d4af37]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Barcode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Barcode & Retail Tag</h3>
              <p className="text-xs text-neutral-400">High-resolution Code128 & QR generation for {product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Product Summary Plaque */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-[#d4af37]/20 flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-sm text-white">{product.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-neutral-400">SKU:</span>
                <span className="font-mono text-[#d4af37] font-bold">{product.sku}</span>
                <button
                  type="button"
                  onClick={handleCopySku}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                  title="Copy SKU"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase text-neutral-400">Retail Price</div>
              <div className="font-mono font-black text-amber-300 text-base">
                ₹{product.selling_price}
              </div>
            </div>
          </div>

          {/* Barcode Type Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveCodeType("code128")}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 font-bold border transition ${
                activeCodeType === "code128"
                  ? "bg-[#d4af37] text-black shadow-[0_2px_10px_rgba(212,175,55,0.3)]"
                  : "bg-black/40 border-[#d4af37]/20 text-neutral-400 hover:text-white"
              }`}
            >
              <Barcode size={15} />
              <span>Standard Code128</span>
            </button>

            <button
              onClick={() => setActiveCodeType("qr")}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 font-bold border transition ${
                activeCodeType === "qr"
                  ? "bg-[#d4af37] text-black shadow-[0_2px_10px_rgba(212,175,55,0.3)]"
                  : "bg-black/40 border-[#d4af37]/20 text-neutral-400 hover:text-white"
              }`}
            >
              <QrCode size={15} />
              <span>Mobile QR Code</span>
            </button>
          </div>

          {/* Barcode Vector Preview Box */}
          <div className="p-5 rounded-2xl bg-white flex flex-col items-center justify-center min-h-[140px] shadow-inner text-black">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 text-neutral-600">
                <RefreshCw size={22} className="animate-spin text-[#d4af37] mb-2" />
                <span className="text-xs">Rendering vector {activeCodeType.toUpperCase()}...</span>
              </div>
            ) : svgContent ? (
              <div
                className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <div className="text-rose-600 text-xs">Failed to render barcode.</div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleDownloadSVG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-[#d4af37]/30 text-xs text-[#d4af37] hover:bg-[#d4af37]/15 transition font-semibold"
            >
              <Download size={13} />
              <span>Save Vector SVG</span>
            </button>
          </div>

          {/* Label Printing Options Section */}
          <div className="p-4 rounded-2xl bg-black/50 border border-[#d4af37]/20 space-y-3">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Printer size={15} className="text-[#d4af37]" />
              <span>Print Sticker Sheets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Layout Format</label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-[#d4af37]/30 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="a4_24" className="bg-[#12141c]">A4 Sheet (24 labels: 3x8 - 70x37mm)</option>
                  <option value="a4_30" className="bg-[#12141c]">A4 Sheet (30 labels: 3x10 - 70x29.7mm)</option>
                  <option value="single_thermal" className="bg-[#12141c]">Thermal Roll (Single 50x30mm)</option>
                  <option value="shelf_tag" className="bg-[#12141c]">Shelf Talker Tag (70x45mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Quantity</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-8 rounded-lg bg-black/70 border border-[#d4af37]/30 text-white flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-black/70 border border-[#d4af37]/30 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-8 rounded-lg bg-black/70 border border-[#d4af37]/30 text-white flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <Button3D
              variant="gold"
              onClick={handleDownloadPDF}
              disabled={downloading}
              icon={FileDown}
              className="w-full py-2.5 rounded-xl text-xs font-bold"
            >
              {downloading ? "Preparing PDF..." : `Generate & Print ${quantity} Label(s)`}
            </Button3D>
          </div>
        </div>
      </div>
    </div>
  );
}
