import api from "./api";

export const auditService = {
  /**
   * Fetch paginated/filtered audit logs.
   */
  async getLogs(params = {}) {
    const res = await api.get("/audit-logs/", { params });
    return res.data;
  },

  /**
   * Fetch aggregate audit trail statistics.
   */
  async getStats() {
    const res = await api.get("/audit-logs/stats/");
    return res.data;
  },

  /**
   * Download filtered audit records as a CSV spreadsheet.
   */
  async exportCSV(params = {}) {
    const res = await api.get("/audit-logs/export/", {
      params,
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default auditService;
