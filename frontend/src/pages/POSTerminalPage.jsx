import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Banknote,
  Barcode,
  CheckCircle2,
  CreditCard,
  Minus,
  Package,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import posService from "../services/posService";
import productService from "../services/productService";
import customerService from "../services/customerService";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Input, Modal, Select } from "../components/ui";

export default function POSTerminalPage() {
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  const barcodeBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const [scannerFlash, setScannerFlash] = useState(false);

  // Products & Categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Customers
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerGst, setNewCustomerGst] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);
  const [orderDiscount, setOrderDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashTendered, setCashTendered] = useState("");

  // Checkout Processing & Receipt Modal
  const [processingSale, setProcessingSale] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Mobile View Switcher ("catalog" | "cart")
  const [mobileTab, setMobileTab] = useState("catalog");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      const [cats, custs] = await Promise.all([
        productService.getCategories(),
        customerService.getCustomers({ page_size: 100 }),
      ]);
      setCategories(Array.isArray(cats) ? cats : cats.results || []);
      setCustomers(Array.isArray(custs) ? custs : custs.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingCatalog(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== "all") params.category = selectedCategory;
      const data = await posService.getPOSProducts(params);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.tagName === "SELECT"
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 120) {
        barcodeBufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          triggerBarcodeAdd(barcodeBufferRef.current);
          barcodeBufferRef.current = "";
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products]);

  const triggerBarcodeAdd = async (code) => {
    setScannerFlash(true);
    setTimeout(() => setScannerFlash(false), 800);

    const cleanCode = code.trim();
    const existing = products.find(
      (p) => p.sku?.toLowerCase() === cleanCode.toLowerCase()
    );

    if (existing) {
      addToCart(existing);
      toast.success(`Scanned: ${existing.name}`);
      return;
    }

    try {
      const results = await posService.getPOSProducts({ barcode: cleanCode });
      if (results && results.length > 0) {
        addToCart(results[0]);
        toast.success(`Scanned: ${results[0].name}`);
      } else {
        toast.error(`Barcode not found: ${cleanCode}`);
      }
    } catch (err) {
      toast.error(`Scan error: ${cleanCode}`);
    }
  };

  // Cart Operations
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error(`"${product.name}" is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error(`Cannot exceed stock level of ${product.stock_quantity} units.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, discount: "0.00" }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock_quantity) {
              toast.error(`Maximum stock reached (${item.product.stock_quantity}).`);
              return item;
            }
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscount("0");
    setCashTendered("");
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.product.selling_price) || 0;
    return sum + price * item.quantity;
  }, 0);

  const totalTax = cart.reduce((sum, item) => {
    const price = parseFloat(item.product.selling_price) || 0;
    const taxRate = parseFloat(item.product.tax_rate) || 0;
    const itemTotal = price * item.quantity;
    return sum + (itemTotal * taxRate) / 100;
  }, 0);

  const discountAmount = parseFloat(orderDiscount) || 0;
  const grandTotal = Math.max(0, subtotal + totalTax - discountAmount);
  const tendered = parseFloat(cashTendered) || 0;
  const changeDue = paymentMethod === "cash" && tendered > grandTotal ? tendered - grandTotal : 0;

  // Customer Quick Creation
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    try {
      setCreatingCustomer(true);
      const created = await customerService.createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        gst_number: newCustomerGst.trim().toUpperCase(),
      });
      toast.success(`Customer "${created.name}" registered!`);
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(created.id);
      setIsQuickCustomerModalOpen(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerGst("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add customer.");
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Finalize Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Add products to checkout.");
      return;
    }

    if (paymentMethod === "cash" && tendered > 0 && tendered < grandTotal) {
      toast.error("Cash tendered is less than the grand total.");
      return;
    }

    try {
      setProcessingSale(true);
      const payload = {
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
        payment_method: paymentMethod,
        discount: discountAmount.toFixed(2),
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          discount: item.discount || "0.00",
        })),
      };

      const completed = await posService.checkout(payload);
      toast.success(`Sale completed! Order #${completed.order_number}`);
      setCompletedOrder({
        ...completed,
        cashTendered: tendered > 0 ? tendered : grandTotal,
        changeDue: changeDue,
      });
      clearCart();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Checkout transaction failed.");
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* POS Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-[11px] font-bold uppercase tracking-wider py-2">
              <Zap className="w-3 h-3 mr-1" />
              High Velocity POS Terminal
            </span>
            <div
              className={`badge text-[11px] font-bold transition-all ${
                scannerFlash
                  ? "badge-success text-black animate-ping"
                  : "badge-success badge-outline"
              }`}
            >
              Scanner Active
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            Point of Sale Terminal
          </h1>
        </div>

        {/* Mobile View Switcher */}
        <div className="join lg:hidden w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMobileTab("catalog")}
            className={`btn btn-sm join-item flex-1 ${
              mobileTab === "catalog" ? "btn-primary text-black font-bold" : "btn-outline"
            }`}
          >
            <Package className="w-4 h-4 mr-1" />
            Catalog
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className={`btn btn-sm join-item flex-1 ${
              mobileTab === "cart" ? "btn-primary text-black font-bold" : "btn-outline"
            }`}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
          </button>
        </div>
      </div>

      {/* Main Grid: Catalog (2 Cols) + Cart (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Section: Catalog & Filter Tools */}
        <div className={`lg:col-span-2 space-y-4 ${mobileTab === "cart" ? "hidden lg:block" : "block"}`}>
          {/* Search Bar & Categories */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative w-full flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Scan barcode or type SKU / product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-100 text-base-content"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 mobile-touch-scroll">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`btn btn-xs rounded-xl font-bold whitespace-nowrap ${
                    selectedCategory === "all" ? "btn-primary text-black" : "btn-ghost"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(String(cat.id))}
                    className={`btn btn-xs rounded-xl font-bold whitespace-nowrap ${
                      selectedCategory === String(cat.id) ? "btn-primary text-black" : "btn-ghost"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 mobile-touch-scroll">
            {loadingCatalog ? (
              <div className="col-span-full py-16 text-center text-base-content/50 text-sm">
                <span className="loading loading-spinner loading-md text-primary mb-2 block mx-auto" />
                Loading product catalog...
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-full py-16 text-center text-base-content/50 text-sm">
                <Package className="w-10 h-10 mx-auto mb-2 text-base-content/30" />
                No products found matching criteria.
              </div>
            ) : (
              products.map((p) => {
                const isOutOfStock = p.stock_quantity <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`card bg-base-200 border border-base-300 rounded-2xl p-3.5 transition-all text-left flex flex-col justify-between ${
                      isOutOfStock
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="badge badge-neutral text-[9px] font-mono uppercase font-bold truncate max-w-[100px]">
                          {p.sku}
                        </span>
                        <Badge status={p.status} size="xs">
                          {p.stock_quantity} left
                        </Badge>
                      </div>
                      <h4 className="font-bold text-xs text-base-content line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-base-content/50 mt-0.5 truncate">
                        {p.category_name || "General"}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-base-300/40 flex items-center justify-between">
                      <div className="text-sm font-extrabold text-primary">
                        ₹{Number(p.selling_price).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="btn btn-primary btn-xs btn-circle text-black font-bold"
                        title="Add to cart"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Section: Shopping Cart & Checkout Panel */}
        <div className={`lg:col-span-1 space-y-4 ${mobileTab === "catalog" ? "hidden lg:block" : "block"}`}>
          <Card
            title="Current Order Cart"
            subtitle={`${cart.length} unique line item(s)`}
            icon={ShoppingCart}
            action={
              cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear
                </button>
              )
            }
          >
            {/* Customer Picker */}
            <div className="mb-4">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-xs font-semibold text-base-content/80 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Customer Account
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerModalOpen(true)}
                  className="text-primary text-[11px] font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  <UserPlus className="w-3 h-3" />
                  + New
                </button>
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-100 text-xs text-base-content"
              >
                <option value="">Walk-in Customer (General)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mobile-touch-scroll border-y border-base-300/50 py-3">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-base-content/40 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Cart is empty. Tap products or scan barcodes to begin sale.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-base-100 border border-base-300 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-base-content truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-base-content/60 flex items-center gap-2 mt-0.5">
                        <span>₹{Number(item.product.selling_price).toFixed(2)} each</span>
                        {item.product.tax_rate > 0 && <span>GST {item.product.tax_rate}%</span>}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="btn btn-ghost btn-xs btn-circle border border-base-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-base-content">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="btn btn-ghost btn-xs btn-circle border border-base-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Total & Remove */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-base-content">
                        ₹{(Number(item.product.selling_price) * item.quantity).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-error/70 hover:text-error text-[10px] block mt-0.5 ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discounts */}
            <div className="pt-3 space-y-1.5 text-xs text-base-content/80">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium text-base-content">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (GST):</span>
                <span className="font-medium text-base-content">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal + totalTax}
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(e.target.value)}
                  className="input input-bordered input-xs w-20 text-right rounded-lg bg-base-100 font-bold"
                />
              </div>

              <div className="divider my-1 opacity-40" />

              <div className="flex justify-between items-baseline text-base font-extrabold text-base-content">
                <span>Grand Total:</span>
                <span className="text-xl text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3">
              <label className="text-xs font-semibold text-base-content/80 block mb-1.5">
                Payment Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "upi", label: "UPI", icon: QrCode },
                  { id: "bank_transfer", label: "Bank", icon: CreditCard },
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id)}
                      className={`btn btn-xs py-2 h-auto flex flex-col gap-1 rounded-xl font-bold ${
                        paymentMethod === mode.id
                          ? "btn-primary text-black"
                          : "btn-outline border-base-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered & Change (If Cash mode) */}
            {paymentMethod === "cash" && (
              <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1">
                  <span className="text-base-content/70 text-[11px] block mb-1">Cash Tendered:</span>
                  <input
                    type="number"
                    placeholder={`₹${grandTotal.toFixed(2)}`}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="input input-bordered input-xs w-full rounded-lg bg-base-100 font-bold"
                  />
                </div>
                {tendered > grandTotal && (
                  <div className="text-right">
                    <span className="text-base-content/70 text-[11px] block mb-1">Change Due:</span>
                    <span className="text-success font-extrabold text-sm">
                      ₹{changeDue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <div className="pt-4">
              <Button
                variant="gold"
                fullWidth
                size="md"
                onClick={handleCheckout}
                loading={processingSale}
                disabled={cart.length === 0}
                icon={Receipt}
              >
                Complete Checkout (₹{grandTotal.toFixed(2)})
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Customer Registration Modal */}
      <Modal
        isOpen={isQuickCustomerModalOpen}
        onClose={() => setIsQuickCustomerModalOpen(false)}
        title="Quick Register Customer"
        subtitle="Add a customer record without leaving the POS register"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Ramesh Patel"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
          />
          <Input
            label="GSTIN / Tax ID (Optional)"
            placeholder="e.g. 27AAAAA0000A1Z5"
            value={newCustomerGst}
            onChange={(e) => setNewCustomerGst(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setIsQuickCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creatingCustomer}>
              Register Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={!!completedOrder}
        onClose={() => setCompletedOrder(null)}
        title="Sale Receipt & Tax Invoice"
        subtitle={`Order #${completedOrder?.order_number || ""}`}
        maxWidth="max-w-md"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} icon={Printer}>
              Print Receipt
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCompletedOrder(null)}>
              Done / Next Sale
            </Button>
          </div>
        }
      >
        {completedOrder && (
          <div className="bg-base-100 p-5 rounded-2xl border border-base-300 font-mono text-xs space-y-3 text-base-content">
            <div className="text-center pb-2 border-b border-base-300">
              <h3 className="font-bold text-sm tracking-tight text-primary">SMART INVENTORY STORE</h3>
              <p className="text-[10px] text-base-content/60 mt-0.5">Tax Invoice / Cash Receipt</p>
              <p className="text-[10px] text-base-content/60">
                Date: {new Date(completedOrder.created_at || Date.now()).toLocaleString()}
              </p>
            </div>

            <div className="space-y-1.5 py-1">
              {completedOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="truncate max-w-[180px]">
                    {it.product_name || it.product?.name || "Item"} x{it.quantity}
                  </span>
                  <span className="font-bold">₹{Number(it.total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-base-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(completedOrder.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST):</span>
                <span>₹{Number(completedOrder.tax || 0).toFixed(2)}</span>
              </div>
              {Number(completedOrder.discount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount:</span>
                  <span>-₹{Number(completedOrder.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-primary pt-1 border-t border-base-300">
                <span>Total Paid:</span>
                <span>₹{Number(completedOrder.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-base-content/60 pt-0.5">
                <span>Payment Mode:</span>
                <span className="uppercase font-bold">{completedOrder.payment_method}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-base-300 text-[10px] text-base-content/50">
              Thank you for your business!
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
