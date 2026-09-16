import api from "./api";

export const settingsService = {
  async getSettings() {
    const res = await api.get("/settings/");
    return res.data;
  },

  async updateSettings(data) {
    const isFormData = data instanceof FormData;
    // Allow Axios and browser to attach the multipart boundary automatically
    const config = isFormData
      ? { headers: { "Content-Type": undefined } }
      : {};
    const res = await api.patch("/settings/", data, config);
    return res.data;
  },

};

export default settingsService;
