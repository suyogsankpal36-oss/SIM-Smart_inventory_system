import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Coins,
  DollarSign,
  HelpCircle,
  Image,
  Mail,
  MapPin,
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
import { Badge, Button, Card, Input, Select } from "../components/ui";

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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
      <div className="p-20 flex flex-col items-center justify-center">
        <RefreshCw size={32} className="animate-spin text-primary mb-3" />
        <span className="text-sm text-base-content/60">Loading business configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Business Settings & System Config
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Configure legal store identity, invoicing taxonomy, tax rates, operational low-stock triggers, and currency standards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchSettings(true)}
            loading={refreshing}
          >
            Refresh
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={saving}
              icon={Save}
            >
              Save Configuration
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Form Left (2 cols) + Brand Card Right (1 col) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Form Left (2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Identity Card */}
            <Card>
              <div className="flex items-center gap-2 pb-3 border-b border-base-content/10 mb-4">
                <Building size={18} className="text-primary" />
                <h3 className="font-bold text-base-content text-base">Store Identity & Legal Entity</h3>
              </div>

              <div className="space-y-4">
                <Input
                  label="Business / Company Name"
                  required
                  placeholder="e.g. Acme Supermarket Ltd."
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  error={formErrors.business_name}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="GSTIN / Tax Identification"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                    error={formErrors.gst_number}
                  />
                  <Input
                    label="Contact Phone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={formErrors.phone}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Official Billing Email"
                    type="email"
                    placeholder="billing@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={formErrors.email}
                  />
                  <Input
                    label="Physical Store Address"
                    placeholder="Plot 42, Industrial Avenue, Mumbai"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    error={formErrors.address}
                  />
                </div>
              </div>
            </Card>

            {/* Financial & Tax Parameters */}
            <Card>
              <div className="flex items-center gap-2 pb-3 border-b border-base-content/10 mb-4">
                <Receipt size={18} className="text-primary" />
                <h3 className="font-bold text-base-content text-base">Tax, Invoicing & Inventory Thresholds</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Primary Operating Currency"
                  value={formData.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  options={CURRENCY_OPTIONS.map((c) => ({ value: c.code, label: c.label }))}
                />
                <Input
                  label="Default GST / Tax Rate (%)"
                  type="number"
                  step="0.01"
                  required
                  placeholder="18.00"
                  value={formData.default_tax_rate}
                  onChange={(e) => setFormData({ ...formData, default_tax_rate: e.target.value })}
                  error={formErrors.default_tax_rate}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Invoice Number Prefix"
                  placeholder="INV"
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
                  error={formErrors.invoice_prefix}
                />
                <Input
                  label="Low Stock Warning Threshold (Units)"
                  type="number"
                  min="1"
                  required
                  placeholder="5"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  error={formErrors.low_stock_threshold}
                />
              </div>
            </Card>

            {/* Brand Logo Upload */}
            <Card>
              <div className="flex items-center gap-2 pb-3 border-b border-base-content/10 mb-4">
                <Image size={18} className="text-primary" />
                <h3 className="font-bold text-base-content text-base">Company Brand Logo</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-base-200 border-2 border-dashed border-base-content/20 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="New Logo" className="w-full h-full object-cover" />
                  ) : existingLogoUrl ? (
                    <img src={existingLogoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={36} className="text-base-content/30" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <p className="text-xs text-base-content/70">
                    Upload your high-resolution company emblem for thermal receipts, PDF invoices, and client quotes.
                  </p>
                  <label className="btn btn-outline btn-sm gap-2 cursor-pointer">
                    <Upload size={14} />
                    <span>Select Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                  </label>
                  {logoFile && (
                    <span className="text-xs text-primary font-medium block">
                      Ready to upload: {logoFile.name}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </form>
        </div>

        {/* Brand Card / Live Receipt Header Preview Right (1 col) */}
        <div>
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="font-bold text-base-content text-sm">Receipt Header Preview</h3>
              </div>
              <span className="badge badge-outline badge-xs font-mono">PRINT MOCKUP</span>
            </div>

            <div className="p-4 rounded-2xl bg-base-100 border border-base-content/15 shadow-md font-mono text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 mx-auto flex items-center justify-center font-black text-xl">
                {logoPreview || existingLogoUrl ? (
                  <img
                    src={logoPreview || existingLogoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  formData.business_name.charAt(0).toUpperCase() || "S"
                )}
              </div>
              <h4 className="font-bold text-sm text-base-content uppercase tracking-wider">
                {formData.business_name || "YOUR STORE NAME"}
              </h4>
              <p className="text-[11px] text-base-content/60 leading-tight">
                {formData.address || "Store Address Lines, City"}
              </p>
              <p className="text-[11px] text-base-content/60">
                Tel: {formData.phone || "+91 00000 00000"}
              </p>
              {formData.gst_number && (
                <div className="badge badge-outline badge-xs font-mono">
                  GSTIN: {formData.gst_number}
                </div>
              )}

              <div className="divider my-2 text-[10px] text-base-content/40">TAX INVOICE</div>

              <div className="text-left text-[11px] text-base-content/70 space-y-1">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-bold">{formData.invoice_prefix}-001042</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Tax:</span>
                  <span className="font-bold">{formData.default_tax_rate}% GST</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span className="font-bold">
                    {formData.currency} ({formData.currency_symbol})
                  </span>
                </div>
              </div>

              <div className="divider my-2 text-[10px] text-base-content/40">THANK YOU</div>
              <p className="text-[10px] text-base-content/40 italic">
                Verified Smart Inventory Point-of-Sale System
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
