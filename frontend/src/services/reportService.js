import api from "./api";

export const reportService = {
  async getSalesReport(params = {}) {
    const res = await api.get("/reports/sales/", { params });
    return res.data;
  },

  async getInventoryReport() {
    const res = await api.get("/reports/inventory/");
    return res.data;
  },

  async getExpensesReport(params = {}) {
    const res = await api.get("/reports/expenses/", { params });
    return res.data;
  },

  async getProfitLossReport(params = {}) {
    const res = await api.get("/reports/profit-loss/", { params });
    return res.data;
  },

  async downloadCsv(reportType, params = {}) {
    const res = await api.get("/reports/export/", {
      params: { ...params, report_type: reportType },
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const start = params.start_date || "all";
    const end = params.end_date || "today";
    link.setAttribute("download", `${reportType}_report_${start}_to_${end}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default reportService;
