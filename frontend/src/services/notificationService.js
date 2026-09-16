import api from "./api";

export const notificationService = {
  /**
   * Fetch paginated/filtered notifications list.
   */
  async getNotifications(params = {}) {
    const res = await api.get("/notifications/", { params });
    return res.data;
  },

  /**
   * Fast endpoint for live unread count badge.
   */
  async getUnreadCount() {
    const res = await api.get("/notifications/unread-count/");
    return res.data;
  },

  /**
   * Mark a single notification as read.
   */
  async markRead(id) {
    const res = await api.post(`/notifications/${id}/mark-read/`);
    return res.data;
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllRead() {
    const res = await api.post("/notifications/mark-all-read/");
    return res.data;
  },

  /**
   * Delete single notification.
   */
  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}/`);
    return res.data;
  },

  /**
   * Purge all read notifications.
   */
  async clearRead() {
    const res = await api.delete("/notifications/clear-read/");
    return res.data;
  },
};

export default notificationService;
