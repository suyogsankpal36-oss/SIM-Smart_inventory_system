import api from "./api";

export const staffService = {
  /**
   * List staff members with optional filters (role, is_active, search, ordering, page).
   */
  async getStaff(params = {}) {
    const res = await api.get("/auth/users/", { params });
    return res.data;
  },

  /**
   * Retrieve single staff member by ID.
   */
  async getStaffMember(id) {
    const res = await api.get(`/auth/users/${id}/`);
    return res.data;
  },

  /**
   * Create a new staff member.
   */
  async createStaff(data) {
    const res = await api.post("/auth/users/", data);
    return res.data;
  },

  /**
   * Partially update staff member (role, phone, is_active, first_name, last_name, etc.).
   */
  async updateStaff(id, data) {
    const res = await api.patch(`/auth/users/${id}/`, data);
    return res.data;
  },

  /**
   * Delete a staff member.
   */
  async deleteStaff(id) {
    const res = await api.delete(`/auth/users/${id}/`);
    return res.data;
  },

  /**
   * Reset password for a staff member.
   */
  async resetPassword(id, data) {
    const res = await api.post(`/auth/users/${id}/reset-password/`, data);
    return res.data;
  },

  /**
   * Fetch aggregated staff statistics.
   */
  async getStats() {
    const res = await api.get("/auth/users/stats/");
    return res.data;
  },
};

export default staffService;
