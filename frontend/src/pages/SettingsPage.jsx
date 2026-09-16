import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Coins,
  DollarSign,
  FileSpreadsheet,
  Globe,
  HelpCircle,
  Image,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Store,
  Upload,
} from "lucide-react";
import settingsService from "../services/settingsService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (INR - ₹)" },
  { code: "USD", symbol: "$", label: "US Dollar (USD - $)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR - €)" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP - £)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (AED - د.إ)" },
];

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    business_name: "",
    address: "",
    phone: "",
    email: "",
    gst_number: "",
    currency: "INR",
    currency_symbol: "₹",
    default_tax_rate: "18.00",
    low_stock_threshold: 5,
    invoice_prefix: "INV",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await settingsService.getSettings();
      setFormData({
        business_name: data.business_name || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        gst_number: data.gst_number || "",
        currency: data.currency || "INR",
        currency_symbol: data.currency_symbol || "₹",
        default_tax_rate: data.default_tax_rate ? String(data.default_tax_rate) : "18.00",
        low_stock_threshold: data.low_stock_threshold || 5,
        invoice_prefix: data.invoice_prefix || "INV",
      });
      if (data.logo) {
        setExistingLogoUrl(data.logo);
      }
    } catch (err) {
      console.error("Failed to load business settings:", err);
      toast.error("Failed to load business configuration.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCurrencyChange = (code) => {
    const selected = CURRENCY_OPTIONS.find((c) => c.code === code);
    setFormData((prev) => ({
      ...prev,
      currency: code,
      currency_symbol: selected ? selected.symbol : prev.currency_symbol,
    }));
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG, JPG, SVG).");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.business_name.trim()) {
      errors.business_name = "Business name is required.";
    }
    const tax = parseFloat(formData.default_tax_rate);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      errors.default_tax_rate = "Tax rate must be between 0.00% and 100.00%.";
    }
    const threshold = parseInt(formData.low_stock_threshold, 10);
    if (isNaN(threshold) || threshold < 1) {
      errors.low_stock_threshold = "Low stock threshold must be at least 1 unit.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getFieldError = (field) => {
    if (!formErrors) return null;
    const err = formErrors[field] || formErrors.errors?.[field];
    if (Array.isArray(err)) return err[0];
    if (typeof err === "string") return err;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!isAdmin) {
      toast.error("Administrator privileges required to update settings.");
      return;
    }

    setSaving(true);
    setFormErrors({});
    try {
      let payload;
      if (logoFile) {
        payload = new FormData();
        payload.append("business_name", formData.business_name.trim());
        payload.append("address", formData.address.trim());
        payload.append("phone", formData.phone.trim());
        payload.append("email", formData.email.trim());
        payload.append("gst_number", formData.gst_number.trim().toUpperCase());
        payload.append("currency", formData.currency);
        payload.append("currency_symbol", formData.currency_symbol);
        payload.append("default_tax_rate", parseFloat(formData.default_tax_rate).toFixed(2));
        payload.append("low_stock_threshold", parseInt(formData.low_stock_threshold, 10));
        payload.append("invoice_prefix", formData.invoice_prefix.trim().toUpperCase());
        payload.append("logo", logoFile);
      } else {
        payload = {
          business_name: formData.business_name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          gst_number: formData.gst_number.trim().toUpperCase(),
          currency: formData.currency,
          currency_symbol: formData.currency_symbol,
          default_tax_rate: parseFloat(formData.default_tax_rate).toFixed(2),
          low_stock_threshold: parseInt(formData.low_stock_threshold, 10),
          invoice_prefix: formData.invoice_prefix.trim().toUpperCase(),
        };
      }

      const updated = await settingsService.updateSettings(payload);
      toast.success("Business settings saved successfully!");
      if (updated.logo) {
        setExistingLogoUrl(updated.logo);
        setLogoFile(null);
        setLogoPreview(null);
      }
    } catch (err) {
      console.error(err);
      const serverErrors = err.response?.data?.errors || err.response?.data;
      if (serverErrors && typeof serverErrors === "object") {
        setFormErrors(serverErrors);
      }
      const errorMsg =
        err.response?.data?.detail ||
        (serverErrors && typeof serverErrors === "object"
          ? Object.entries(serverErrors)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
              .join("; ")
          : "Failed to save settings.");
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-white">
        <RefreshCw size={32} className="animate-spin text-[#d4af37] mb-3" />
        <span className="text-sm text-neutral-400">Loading business configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold tracking-wider text-[#d4af37] mb-2 uppercase">
            <Store size={14} className="text-[#d4af37]" />
            Enterprise Identity & Financial Parameters
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
            Business Settings & System Config
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Configure legal store identity, invoicing taxonomy, tax rates, operational low-stock triggers, and currency standards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button3D
            variant="dark"
            onClick={() => fetchSettings(true)}
            disabled={refreshing}
            icon={RefreshCw}
            className={refreshing ? "opacity-75" : ""}
          >
            {refreshing ? "Updating..." : "Refresh"}
          </Button3D>

          {isAdmin && (
            <Button3D
              variant="gold"
              onClick={handleSubmit}
              disabled={saving}
              icon={Save}
            >
              {saving ? "Committing..." : "Save Configuration"}
            </Button3D>
          )}
        </div>
      </div>

      {/* Main Grid: Form Left (2 cols) + Live Store Plaque Preview (1 col) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Form Left (2 Cols) */}
        <div className="xl:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Panel 1: Enterprise Profile */}
            <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#d4af37]/20">
                <Building size={18} className="text-[#d4af37]" />
                <h3 className="text-base font-bold text-white">Store Identity & Legal Entity</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Business / Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Supermarket Ltd."
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                  {getFieldError("business_name") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("business_name")}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      GSTIN / Tax Identification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                    />
                    {getFieldError("gst_number") && (
                      <p className="text-xs text-rose-400 mt-1">{getFieldError("gst_number")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    {getFieldError("phone") && (
                      <p className="text-xs text-rose-400 mt-1">{getFieldError("phone")}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Official Email</label>
                    <input
                      type="email"
                      placeholder="billing@acme.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    {getFieldError("email") && (
                      <p className="text-xs text-rose-400 mt-1">{getFieldError("email")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Plot 42, Industrial Avenue, Mumbai"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    {getFieldError("address") && (
                      <p className="text-xs text-rose-400 mt-1">{getFieldError("address")}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Financial & Tax Defaults */}
            <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#d4af37]/20">
                <Coins size={18} className="text-[#d4af37]" />
                <h3 className="text-base font-bold text-white">Financial & Tax Framework</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Operating Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#12141c]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Default Tax / GST Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.default_tax_rate}
                    onChange={(e) => setFormData({ ...formData, default_tax_rate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("default_tax_rate") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("default_tax_rate")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 3: Inventory & Billing Preferences */}
            <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#d4af37]/20">
                <Receipt size={18} className="text-[#d4af37]" />
                <h3 className="text-base font-bold text-white">Invoicing & Inventory Thresholds</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Invoice Serial Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="INV"
                    value={formData.invoice_prefix}
                    onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("invoice_prefix") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("invoice_prefix")}</p>
                  )}
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Example format: <strong className="text-amber-300">{formData.invoice_prefix || "INV"}-2026-0042</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Low Stock Threshold (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                  {getFieldError("low_stock_threshold") && (
                    <p className="text-xs text-rose-400 mt-1">{getFieldError("low_stock_threshold")}</p>
                  )}
                  <span className="text-[11px] text-neutral-500 mt-1 block">

                    Telemetry alerts trigger when stock dips below this unit level
                  </span>
                </div>
              </div>
            </div>

            {/* Panel 4: Brand Logo Upload */}
            <div className="card-3d p-6 rounded-2xl border border-[#d4af37]/20 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#d4af37]/20">
                <Image size={18} className="text-[#d4af37]" />
                <h3 className="text-base font-bold text-white">Store Branding & Logo</h3>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-2xl bg-black/50 border-2 border-dashed border-[#d4af37]/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                  ) : existingLogoUrl ? (
                    <img src={existingLogoUrl} alt="Store Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Store size={32} className="text-[#d4af37]/60" />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 border border-[#d4af37]/30 text-xs font-bold text-amber-300 hover:bg-[#d4af37]/10 cursor-pointer transition">
                    <Upload size={14} />
                    <span>Upload Brand Asset</span>
                    <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                  </label>
                  <p className="text-[11px] text-neutral-400">
                    High resolution PNG, JPG, or SVG. Printed directly onto Tax Invoices and POS receipts.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Live Store Plaque Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <Sparkles size={15} />
              Store Plaque Preview
            </span>
            <span className="text-[11px] text-neutral-400">Live Preview</span>
          </div>

          <Tilt3D intensity={18} glareColor="255, 235, 170">
            <div className="relative rounded-3xl p-7 overflow-hidden bg-gradient-to-b from-[#1c1f2e] via-[#12141c] to-[#0a0b10] border-2 border-[#d4af37]/50 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(212,175,55,0.25)]">
              {/* Gold Specular Light Beam */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#d4af37]/30 to-transparent rounded-full blur-xl pointer-events-none"></div>

              {/* Decorative Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#d4af37]/30">
                <div className="w-12 h-12 rounded-xl bg-black/60 border border-[#d4af37]/40 flex items-center justify-center p-1.5 shadow">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : existingLogoUrl ? (
                    <img src={existingLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Store size={22} className="text-[#d4af37]" />
                  )}
                </div>

                <div className="text-right">
                  <div className="badge-3d-gold text-[10px]">VERIFIED STORE</div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">EST. 2026</div>
                </div>
              </div>

              {/* Plaque Body */}
              <div className="py-6 space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight leading-snug">
                  {formData.business_name || "Enterprise Brand Name"}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {formData.address || "Main Headquarters Street, Commercial Complex"}
                </p>
              </div>

              {/* Plaque Specs Ledger */}
              <div className="p-4 rounded-2xl bg-black/60 border border-[#d4af37]/25 space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-400">
                  <span>GSTIN / Tax ID:</span>
                  <span className="font-mono text-[#d4af37] font-bold">
                    {formData.gst_number || "27XXXXX0000X1ZX"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-neutral-400">
                  <span>Standard Currency:</span>
                  <span className="font-bold text-white">
                    {formData.currency} ({formData.currency_symbol})
                  </span>
                </div>

                <div className="flex justify-between items-center text-neutral-400">
                  <span>Default Tax Rate:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {formData.default_tax_rate}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-neutral-400">
                  <span>Serial Invoice Tag:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formData.invoice_prefix}-0001
                  </span>
                </div>
              </div>

              {/* Bottom Assurance */}
              <div className="mt-5 pt-4 border-t border-[#d4af37]/20 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1 text-[#d4af37]">
                  <Shield size={13} />
                  Enterprise Tier Active
                </span>
                <span className="font-mono text-neutral-500">v3.0.0 PRO</span>
              </div>
            </div>
          </Tilt3D>
        </div>
      </div>
    </div>
  );
}
