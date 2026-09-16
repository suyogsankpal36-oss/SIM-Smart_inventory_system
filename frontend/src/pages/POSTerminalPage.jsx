import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  RotateCcw,
  User,
  UserPlus,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  Package,
  X,
  AlertTriangle,
  Receipt,
  Barcode,
  Sparkles,
  Zap,
  RefreshCw,
} from "lucide-react";
import posService from "../services/posService";
import productService from "../services/productService";
import customerService from "../services/customerService";
import { useAuth } from "../context/AuthContext";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

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
      toast.error("Failed to load catalog.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  // ---------------- Barcode Scanner Listener ----------------
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore if user is manually typing in any input except when looking for fast barcode stream
      const activeTag = document.activeElement?.tagName;
      const isInputFocused = activeTag === "INPUT" || activeTag === "TEXTAREA";

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Barcode scanners type very rapidly (less than 50ms between keys)
      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = "";
          handleBarcodeScanned(scannedCode);
        } else {
          barcodeBufferRef.current = "";
        }
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 100) {
          // Reset buffer if delay too long (manual typing)
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products]);

  const handleBarcodeScanned = async (code) => {
    setScannerFlash(true);
    setTimeout(() => setScannerFlash(false), 600);

    try {
      const product = await posService.lookupBarcode(code);
      if (product) {
        addToCart(product);
        toast.success(`Scanned: ${product.name}`, { icon: "⚡" });
      } else {
        toast.error(`Barcode "${code}" not found in catalog.`);
      }
    } catch (err) {
      // If direct lookup fails, search local catalog
      const match = products.find((p) => p.barcode === code || p.sku === code);
      if (match) {
        addToCart(match);
        toast.success(`Scanned: ${match.name}`, { icon: "⚡" });
      } else {
        toast.error(`Unrecognized barcode: ${code}`);
      }
    }
  };

  // Handle Search Bar Enter Key
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const query = searchQuery.trim().toLowerCase();
      // If exact SKU or barcode match, add directly
      const exact = products.find(
        (p) => p.barcode?.toLowerCase() === query || p.sku?.toLowerCase() === query
      );
      if (exact) {
        addToCart(exact);
        setSearchQuery("");
      } else if (products.length === 1) {
        addToCart(products[0]);
        setSearchQuery("");
      }
    }
  };

  // ---------------- Cart Actions ----------------
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} units available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { product, quantity: 1, discount: "0.00" }];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock_quantity) {
              toast.error(`Stock limit reached (${item.product.stock_quantity} available).`);
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

  // ---------------- Financial Calculations ----------------
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

  // ---------------- Customer Quick Creation ----------------
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
      const detail = err.response?.data?.detail || "Checkout failed. Please review cart stock.";
      toast.error(detail, { duration: 6000 });
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="space-y-4 min-h-[calc(100vh-120px)] pb-16 text-white">
      {/* Mobile Segmented View Switcher (Visible only on mobile/tablet < lg) */}
      <div className="lg:hidden flex items-center bg-[#0d0f18] p-1.5 rounded-2xl border border-[#d4af37]/30 gap-2">
        <button
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === "catalog"
              ? "bg-[#d4af37] text-black shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Package size={14} />
          <span>Catalog ({products.length})</span>
        </button>
        <button
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
            mobileTab === "cart"
              ? "bg-[#d4af37] text-black shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <ShoppingCart size={14} />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT SECTION (2 Cols): Catalog & Search */}
        <div className={`lg:col-span-2 space-y-4 ${mobileTab === "cart" ? "hidden lg:block" : "block"}`}>
        {/* Search & Barcode Scanner Status Box */}
        <div className="card-3d p-4 rounded-2xl border border-[#d4af37]/25 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Barcode size={17} />
              </div>
              <span className="text-sm font-bold text-white">Product Catalog & Barcode Input</span>
            </div>

            {/* Scanner Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                scannerFlash
                  ? "bg-emerald-400 text-black border-emerald-300 shadow-[0_0_15px_#10b981]"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
              title="Hardware barcode/QR scanner is continuously active."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Zap size={12} />
              <span>Scanner Ready (Auto-Add)</span>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or type SKU / product name & press Enter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/50 border border-[#d4af37]/30 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === "all"
                ? "bg-[#d4af37] text-black shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                : "bg-black/40 border border-[#d4af37]/20 text-neutral-400 hover:text-white"
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === String(cat.id)
                  ? "bg-[#d4af37] text-black shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                  : "bg-black/40 border border-[#d4af37]/20 text-neutral-400 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
          {loadingCatalog ? (
            <div className="col-span-full text-center py-16 text-neutral-400 text-sm">
              <RefreshCw size={24} className="animate-spin text-[#d4af37] mx-auto mb-2" />
              Loading product catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-16 text-neutral-400 text-sm">
              <Package size={36} className="text-[#d4af37]/50 mx-auto mb-2" />
              No products found matching criteria.
            </div>
          ) : (
            products.map((p) => {
              const inStock = p.stock_quantity > 0;
              const isLow = inStock && p.stock_quantity <= p.minimum_stock;

              return (
                <Tilt3D key={p.id} intensity={12} glareColor="255, 235, 170">
                  <div
                    onClick={() => inStock && addToCart(p)}
                    className={`card-3d p-3.5 rounded-2xl border transition-all flex flex-col justify-between h-full cursor-pointer group ${
                      inStock
                        ? "border-[#d4af37]/25 hover:border-[#d4af37] hover:shadow-[0_10px_25px_rgba(212,175,55,0.15)]"
                        : "opacity-50 cursor-not-allowed border-neutral-800"
                    }`}
                  >
                    <div>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-24 object-cover rounded-xl mb-2.5 shadow"
                        />
                      ) : (
                        <div className="w-full h-24 rounded-xl bg-black/50 border border-[#d4af37]/20 flex items-center justify-center font-bold text-xl text-[#d4af37] mb-2.5 shadow-inner">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <h4 className="font-semibold text-xs text-neutral-100 line-clamp-1 leading-snug group-hover:text-amber-200 transition">
                        {p.name}
                      </h4>
                      <div className="text-[11px] font-mono text-neutral-500 truncate">
                        {p.sku}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#d4af37]/20 flex items-center justify-between">
                      <span className="font-mono font-black text-amber-300 text-sm">
                        ₹{parseFloat(p.selling_price).toFixed(2)}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          !inStock
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            : isLow
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        {p.stock_quantity} left
                      </span>
                    </div>
                  </div>
                </Tilt3D>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SECTION (1 Col): Cart & Checkout Summary */}
      <div className={`card-3d rounded-3xl border-2 border-[#d4af37]/30 flex flex-col max-h-[calc(100vh-120px)] sticky top-4 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] ${mobileTab === "catalog" ? "hidden lg:flex" : "flex"}`}>
        {/* Cart Header & Customer Selector */}
        <div className="p-5 border-b border-[#d4af37]/20 bg-black/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-[#d4af37]" />
              <h3 className="font-bold text-sm text-white">
                Current Sale ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Customer Dropdown with Quick Add */}
          <div className="flex gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-xs text-neutral-200 focus:outline-none focus:border-[#d4af37]"
            >
              <option value="" className="bg-[#12141c]">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#12141c]">
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsQuickCustomerModalOpen(true)}
              title="Add New Customer"
              className="p-2 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/25 transition"
            >
              <UserPlus size={15} />
            </button>
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <ShoppingCart size={32} className="text-[#d4af37]/40 mx-auto mb-2" />
              <div className="text-xs font-semibold text-neutral-300">Cart is empty</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Scan barcode or click items to begin transaction.
              </div>
            </div>
          ) : (
            cart.map((item) => {
              const itemTotal = parseFloat(item.product.selling_price) * item.quantity;

              return (
                <div
                  key={item.product.id}
                  className="table-row-3d p-3 rounded-2xl bg-black/40 border border-[#d4af37]/15 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-neutral-200 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      ₹{parseFloat(item.product.selling_price).toFixed(2)} each
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-black/60 border border-[#d4af37]/30 flex items-center justify-center text-neutral-300 hover:text-white"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="font-bold text-xs min-w-[20px] text-center font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-black/60 border border-[#d4af37]/30 flex items-center justify-center text-neutral-300 hover:text-white"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div className="text-right min-w-[65px]">
                    <div className="font-mono font-bold text-amber-300 text-xs">
                      ₹{itemTotal.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Pricing Summary & Checkout Panel */}
        <div className="p-5 border-t border-[#d4af37]/20 bg-black/50 space-y-3">
          <div className="space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-neutral-200 font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                step="1"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(e.target.value)}
                className="w-20 px-2 py-0.5 rounded-lg bg-black/60 border border-[#d4af37]/30 text-right text-xs font-mono text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex justify-between">
              <span>Estimated Tax (GST):</span>
              <span className="font-mono text-neutral-200 font-semibold">₹{totalTax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-[#d4af37]/20 text-base font-black text-white">
              <span className="text-[#d4af37]">Payable Amount:</span>
              <span className="font-mono text-amber-300">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Payment Method
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "cash", label: "Cash", icon: Banknote },
                { id: "upi", label: "UPI", icon: QrCode },
                { id: "card", label: "Card", icon: CreditCard },
                { id: "bank_transfer", label: "Bank", icon: Building },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[11px] font-bold transition ${
                      active
                        ? "bg-[#d4af37] text-black shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                        : "bg-black/50 border border-[#d4af37]/20 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered Input */}
          {paymentMethod === "cash" && (
            <div className="p-3 rounded-xl bg-black/60 border border-[#d4af37]/25 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-semibold">Cash Tendered:</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-24 px-2.5 py-1 rounded-lg bg-black border border-[#d4af37]/30 text-right font-mono text-amber-300 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              {changeDue > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Change to Return:</span>
                  <span className="font-mono">₹{changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Charge Button */}
          <Button3D
            variant="gold"
            disabled={cart.length === 0 || processingSale}
            onClick={handleCheckout}
            className="w-full py-3.5 rounded-2xl text-sm font-black"
          >
            {processingSale ? "Processing Transaction..." : `Pay Now (₹${grandTotal.toFixed(2)})`}
          </Button3D>
        </div>
      </div>
    </div>

    {/* Mobile Floating Sticky Cart Bar */}
    {cart.length > 0 && mobileTab === "catalog" && (
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 card-3d p-3.5 rounded-2xl border border-[#d4af37] bg-[#10121a]/95 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center justify-between">
        <div>
          <div className="text-[11px] text-neutral-400 font-medium">
            {cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""} selected
          </div>
          <div className="text-base font-black text-amber-300">
            ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <button
          onClick={() => setMobileTab("cart")}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#d4af37] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(212,175,55,0.4)]"
        >
          <span>View Cart</span>
          <ShoppingCart size={14} />
        </button>
      </div>
    )}

      {/* Quick Add Customer Modal */}
      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl p-6 border-2 border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
              <h3 className="font-bold text-base text-white">Quick Customer Registration</h3>
              <button
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Customer or company name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="27AAAAA0000A1Z5"
                  value={newCustomerGst}
                  onChange={(e) => setNewCustomerGst(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#d4af37]/30 text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#d4af37]/20">
                <Button3D variant="dark" type="button" onClick={() => setIsQuickCustomerModalOpen(false)}>
                  Cancel
                </Button3D>
                <Button3D variant="gold" type="submit" disabled={creatingCustomer}>
                  {creatingCustomer ? "Registering..." : "Add Customer"}
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Thermal Receipt Modal in Dark Gold Paper */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-3d w-full max-w-md rounded-3xl overflow-hidden border-2 border-[#d4af37]/50 shadow-[0_25px_60px_rgba(0,0,0,0.95)] relative">
            {/* Dark Gold Paper Receipt Content */}
            <div id="printable-receipt" className="p-6 bg-[#0f1118] border-b border-[#d4af37]/20 font-mono text-xs text-neutral-200 space-y-3">
              <div className="text-center border-b border-dashed border-[#d4af37]/30 pb-3">
                <h2 className="text-lg font-black text-amber-200 tracking-wider">SMART RETAIL ENTERPRISE</h2>
                <div className="text-[11px] text-[#d4af37]">Official Tax Invoice & Cash Receipt</div>
                <div className="text-[10px] text-neutral-400">GSTIN: 27AAAAA0000A1Z5</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Order Ref:</span>
                  <strong className="text-white font-bold">{completedOrder.order_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Invoice:</span>
                  <strong className="text-[#d4af37]">{completedOrder.invoice?.invoice_number || "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Timestamp:</span>
                  <span>{new Date(completedOrder.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Customer:</span>
                  <span className="text-white">{completedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Terminal Cashier:</span>
                  <span>{completedOrder.created_by_name}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-[#d4af37]/30 py-2.5 space-y-1.5 text-[11px]">
                {completedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div className="flex-1">
                      <div className="text-white">{item.product_name}</div>
                      <div className="text-neutral-400 text-[10px]">
                        {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                      </div>
                    </div>
                    <strong className="text-amber-300">₹{parseFloat(item.total).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(completedOrder.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(completedOrder.discount) > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount:</span>
                    <span>-₹{parseFloat(completedOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>GST Tax:</span>
                  <span>₹{parseFloat(completedOrder.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-amber-300 pt-1 border-t border-dashed border-[#d4af37]/30">
                  <span>GRAND TOTAL:</span>
                  <span>₹{parseFloat(completedOrder.total_amount).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-neutral-400 pt-1">
                  <span>Settlement:</span>
                  <span className="text-white uppercase">{completedOrder.payment_method_display}</span>
                </div>

                {completedOrder.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Change Returned:</span>
                    <span>₹{completedOrder.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 border-t border-dashed border-[#d4af37]/30 text-[10px] text-neutral-400">
                Thank you for your patronage!
              </div>
            </div>

            {/* Receipt Modal Actions */}
            <div className="p-4 bg-black/60 flex items-center justify-between gap-3">
              <Button3D variant="dark" onClick={() => window.print()} icon={Printer} className="flex-1">
                Print
              </Button3D>
              <Button3D variant="gold" onClick={() => setCompletedOrder(null)} icon={RotateCcw} className="flex-1">
                New Sale
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
