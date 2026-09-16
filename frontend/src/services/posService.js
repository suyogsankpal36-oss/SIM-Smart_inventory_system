import api from "./api";

export const posService = {
  async getPOSProducts(params = {}) {
    const res = await api.get("/pos/products/", { params });
    return res.data;
  },

  async checkout(payload) {
    const res = await api.post("/pos/checkout/", payload);
    return res.data;
  },

  async getOrders(params = {}) {
    const res = await api.get("/orders/", { params });
    return res.data;
  },

  async getOrder(id) {
    const res = await api.get(`/orders/${id}/`);
    return res.data;
  },
};

export default posService;
