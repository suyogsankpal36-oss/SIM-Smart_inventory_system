import api from "./api";

export const customerService = {
  async getCustomers(params = {}) {
    const res = await api.get("/customers/", { params });
    return res.data;
  },

  async getCustomer(id) {
    const res = await api.get(`/customers/${id}/`);
    return res.data;
  },

  async createCustomer(data) {
    const res = await api.post("/customers/", data);
    return res.data;
  },

  async updateCustomer(id, data) {
    const res = await api.patch(`/customers/${id}/`, data);
    return res.data;
  },

  async deleteCustomer(id) {
    const res = await api.delete(`/customers/${id}/`);
    return res.data;
  },

  async getTopCustomers() {
    const res = await api.get("/customers/top/");
    return res.data;
  },

  async lookup(q = "") {
    const res = await api.get("/customers/lookup/", { params: { q } });
    return res.data;
  },
};

export default customerService;
