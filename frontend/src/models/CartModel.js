/**
 * CartModel.js
 * Domain Model managing POS shopping cart state, taxes, discounts, and item calculations.
 */

export class CartItemModel {
  constructor(product, quantity = 1, discount = 0) {
    this.productId = product.id;
    this.name = product.name;
    this.sku = product.sku;
    this.price = Number(product.selling_price || product.sellingPrice || 0);
    this.taxRate = Number(product.tax_rate || product.taxRate || 0);
    this.maxStock = Number(product.stock_quantity ?? product.stockQuantity ?? 9999);
    this.quantity = Math.min(Math.max(1, quantity), this.maxStock);
    this.discount = Math.max(0, Number(discount));
  }

  get lineSubtotal() {
    return this.price * this.quantity;
  }

  get lineTax() {
    return Math.round(((this.lineSubtotal * this.taxRate) / 100) * 100) / 100;
  }

  get lineTotal() {
    return Math.max(0, this.lineSubtotal - this.discount + this.lineTax);
  }
}

export class CartModel {
  constructor(items = [], globalDiscount = 0) {
    this.items = items;
    this.globalDiscount = Number(globalDiscount);
  }

  get totalUnits() {
    return this.items.reduce((acc, it) => acc + it.quantity, 0);
  }

  get subtotal() {
    return this.items.reduce((acc, it) => acc + it.lineSubtotal, 0);
  }

  get totalTax() {
    return this.items.reduce((acc, it) => acc + it.lineTax, 0);
  }

  get grandTotal() {
    return Math.max(0, this.subtotal - this.globalDiscount + this.totalTax);
  }
}
