import api from "./api";

export const expenseService = {
  async getExpenses(params = {}) {
    const res = await api.get("/expenses/", { params });
    return res.data;
  },

  async getExpense(id) {
    const res = await api.get(`/expenses/${id}/`);
    return res.data;
  },

  async createExpense(data) {
    const res = await api.post("/expenses/", data);
    return res.data;
  },

  async updateExpense(id, data) {
    const res = await api.patch(`/expenses/${id}/`, data);
    return res.data;
  },

  async deleteExpense(id) {
    const res = await api.delete(`/expenses/${id}/`);
    return res.data;
  },

  async getSummary() {
    const res = await api.get("/expenses/summary/");
    return res.data;
  },

  async getCategories() {
    const res = await api.get("/expenses/categories/");
    return res.data;
  },

  async getPaymentMethods() {
    const res = await api.get("/expenses/payment-methods/");
    return res.data;
  },
};

export default expenseService;
