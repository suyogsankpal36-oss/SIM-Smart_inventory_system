/**
 * ProductModel.js
 * Domain Model defining Catalog Items, Categories, and Stock Status Contracts.
 */

export const StockStatus = Object.freeze({
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
});

export class ProductItemModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || "";
    this.sku = data.sku || "";
    this.categoryId = data.category || (data.category_detail ? data.category_detail.id : null);
    this.categoryName = data.category_name || (data.category_detail ? data.category_detail.name : "Uncategorized");
    this.purchasePrice = Number(data.purchase_price || 0);
    this.sellingPrice = Number(data.selling_price || 0);
    this.stockQuantity = Number(data.stock_quantity || 0);
    this.minimumStock = Number(data.minimum_stock || 10);
    this.taxRate = Number(data.tax_rate || 0);
    this.status = data.status || this.computeStatus();
    this.isActive = Boolean(data.is_active ?? true);
    this.supplierName = data.supplier_name || "";
    this.description = data.description || "";
    this.image = data.image || null;
    this.createdAt = data.created_at || new Date().toISOString();
  }

  computeStatus() {
    if (this.stockQuantity <= 0) return StockStatus.OUT_OF_STOCK;
    if (this.stockQuantity <= this.minimumStock) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
  }

  get isLowStock() {
    return this.stockQuantity <= this.minimumStock && this.stockQuantity > 0;
  }

  get isOutOfStock() {
    return this.stockQuantity <= 0;
  }

  get profitMargin() {
    if (this.purchasePrice <= 0) return 0;
    return Math.round(((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100);
  }
}
