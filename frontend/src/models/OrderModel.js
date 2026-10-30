/**
 * OrderModel.js
 * Domain Model defining finalized Orders, Statuses, and Invoice Contracts.
 */

export const OrderStatus = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

export const PaymentMethods = Object.freeze({
  CASH: "cash",
  CARD: "card",
  UPI: "upi",
  BANK_TRANSFER: "bank_transfer",
  CREDIT: "credit",
});

export class OrderModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.orderNumber = data.order_number || data.orderNumber || "";
    this.customer = data.customer_detail || data.customer || null;
    this.subtotal = Number(data.subtotal || 0);
    this.discount = Number(data.discount || 0);
    this.tax = Number(data.tax || 0);
    this.totalAmount = Number(data.total_amount || data.totalAmount || 0);
    this.paymentMethod = data.payment_method || data.paymentMethod || PaymentMethods.CASH;
    this.status = data.status || OrderStatus.COMPLETED;
    this.items = (data.items || []).map((it) => ({
      id: it.id,
      productName: it.product_name || (it.product ? it.product.name : "Item"),
      sku: it.product_sku || (it.product ? it.product.sku : ""),
      quantity: Number(it.quantity || 1),
      price: Number(it.price || 0),
      tax: Number(it.tax || 0),
      discount: Number(it.discount || 0),
      total: Number(it.total || 0),
    }));
    this.createdAt = data.created_at || new Date().toISOString();
  }

  get isCancelled() {
    return this.status === OrderStatus.CANCELLED;
  }

  get itemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
