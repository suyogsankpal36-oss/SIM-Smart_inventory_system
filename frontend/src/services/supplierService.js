import api from "./api";

export const supplierService = {
  async getSuppliers(params = {}) {
    const res = await api.get("/suppliers/", { params });
    return res.data;
  },

  async getSupplier(id) {
    const res = await api.get(`/suppliers/${id}/`);
    return res.data;
  },

  async createSupplier(data) {
    const res = await api.post("/suppliers/", data);
    return res.data;
  },

  async updateSupplier(id, data) {
    const res = await api.patch(`/suppliers/${id}/`, data);
    return res.data;
  },

  async deleteSupplier(id) {
    const res = await api.delete(`/suppliers/${id}/`);
    return res.data;
  },

  async lookup(q = "") {
    const res = await api.get("/suppliers/lookup/", { params: { q } });
    return res.data;
  },
};

export default supplierService;
