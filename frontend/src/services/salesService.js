import api from "./api";

export const salesService = {
  // Orders
  async getOrders(params = {}) {
    const res = await api.get("/orders/", { params });
    return res.data;
  },

  async getOrder(id) {
    const res = await api.get(`/orders/${id}/`);
    return res.data;
  },

  async getOrderSummary() {
    const res = await api.get("/orders/summary/");
    return res.data;
  },

  async cancelOrder(id, reason = "") {
    const res = await api.post(`/orders/${id}/cancel/`, { reason });
    return res.data;
  },

  // Invoices
  async getInvoices(params = {}) {
    const res = await api.get("/invoices/", { params });
    return res.data;
  },

  async getInvoice(id) {
    const res = await api.get(`/invoices/${id}/`);
    return res.data;
  },
};

export default salesService;
