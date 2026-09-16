import api from "./api";

export const productService = {
  // --- Category APIs ---
  async getCategories(params = {}) {
    const res = await api.get("/products/categories/", { params });
    return res.data;
  },

  async getCategory(id) {
    const res = await api.get(`/products/categories/${id}/`);
    return res.data;
  },

  async createCategory(data) {
    const res = await api.post("/products/categories/", data);
    return res.data;
  },

  async updateCategory(id, data) {
    const res = await api.put(`/products/categories/${id}/`, data);
    return res.data;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/products/categories/${id}/`);
    return res.data;
  },

  // --- Product APIs ---
  async getProducts(params = {}) {
    const res = await api.get("/products/", { params });
    return res.data;
  },

  async getProduct(id) {
    const res = await api.get(`/products/${id}/`);
    return res.data;
  },

  async createProduct(data) {
    const isFormData = data instanceof FormData;
    const res = await api.post("/products/", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  async updateProduct(id, data) {
    const isFormData = data instanceof FormData;
    const res = await api.patch(`/products/${id}/`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  async deleteProduct(id) {
    const res = await api.delete(`/products/${id}/`);
    return res.data;
  },

  async generateSku() {
    const res = await api.get("/products/generate-sku/");
    return res.data.sku;
  },

  async getProductAlerts() {
    const res = await api.get("/products/alerts/");
    return res.data;
  },
};

export default productService;
