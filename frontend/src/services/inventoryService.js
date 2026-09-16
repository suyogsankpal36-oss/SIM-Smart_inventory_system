import api from "./api";

export const inventoryService = {
  async getInventorySummary() {
    const res = await api.get("/inventory/summary/");
    return res.data;
  },

  async getSummary() {
    const res = await api.get("/inventory/summary/");
    return res.data;
  },

  async getStockLevels(params = {}) {
    const res = await api.get("/products/", { params });
    return res.data;
  },

  async getTransactions(params = {}) {
    const res = await api.get("/inventory/transactions/", { params });
    return res.data;
  },

  async getAdjustmentLogs(params = {}) {
    const res = await api.get("/inventory/transactions/", { params });
    return res.data;
  },

  async adjustStock(productIdOrData, maybeData = null) {
    let payload = {};
    if (typeof productIdOrData === "object" && productIdOrData !== null) {
      payload = { ...productIdOrData };
    } else {
      payload = {
        product: productIdOrData,
        ...maybeData,
      };
    }
    // normalize adjustment types
    if (payload.adjustment_type === "add") payload.adjustment_type = "stock_in";
    if (payload.adjustment_type === "subtract") payload.adjustment_type = "stock_out";
    if (payload.reason && !payload.notes) payload.notes = payload.reason;

    const res = await api.post("/inventory/adjust/", payload);
    return res.data;
  },

  async getStockAlerts() {
    const res = await api.get("/inventory/alerts/");
    return res.data;
  },
};

export default inventoryService;
