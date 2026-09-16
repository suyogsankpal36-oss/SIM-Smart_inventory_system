import api from "./api";

export const barcodeService = {
  /**
   * Fetch raw SVG string for a product's barcode or QR code.
   */
  async getBarcodeSVG(productId, type = "code128") {
    const res = await api.get(`/products/${productId}/barcode/`, {
      params: { type },
      responseType: "text",
    });
    return res.data;
  },

  /**
   * Download or preview a printable PDF for a single product's labels.
   */
  async downloadSingleLabelPDF(productId, quantity = 1, layout = "a4_24", filename = "labels") {
    const res = await api.get(`/products/${productId}/label-pdf/`, {
      params: { quantity, layout },
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download multi-product batch label sheets as printable PDF.
   */
  async downloadBatchLabelsPDF(items, layout = "a4_24", filename = "batch_barcode_labels") {
    const res = await api.post(
      "/products/batch-labels-pdf/",
      { items, layout },
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default barcodeService;
