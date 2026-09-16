import io
from reportlab.graphics import renderPDF, renderSVG
from reportlab.graphics.barcode import createBarcodeDrawing
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas


class BarcodeLabelService:
    @classmethod
    def generate_barcode_svg(cls, code, barcode_type="Code128"):
        """
        Generates clean vector SVG representation of a barcode for a given code/SKU.
        """
        if not code:
            code = "UNKNOWN"

        try:
            d = createBarcodeDrawing(
                barcode_type,
                value=str(code),
                barWidth=1.2,
                barHeight=45,
                humanReadable=True,
                fontSize=9,
            )
            return renderSVG.drawToString(d)
        except Exception:
            # Fallback to standard Code128 with default width
            d = createBarcodeDrawing(
                "Code128",
                value=str(code),
                barWidth=1.0,
                barHeight=40,
                humanReadable=True,
            )
            return renderSVG.drawToString(d)

    @classmethod
    def generate_qr_svg(cls, code):
        """
        Generates vector SVG of a QR Code for a given code/SKU or URL.
        """
        if not code:
            code = "UNKNOWN"

        qr = QrCodeWidget(str(code))
        # Default bounding box is 0,0,100,100
        bounds = qr.getBounds()
        w = bounds[2] - bounds[0]
        h = bounds[3] - bounds[1]
        d = Drawing(120, 120, transform=[120.0 / w, 0, 0, 120.0 / h, 0, 0])
        d.add(qr)
        return renderSVG.drawToString(d)

    @classmethod
    def generate_labels_pdf(cls, items, label_layout="a4_24", business_name="Smart Inventory"):
        """
        Generates a printable PDF document containing barcodes and product tags.
        items: list of dicts: [
            {"name": "...", "sku": "...", "price": Decimal or float, "quantity": int}
        ]
        label_layout: 'a4_24', 'a4_30', 'single_thermal', or 'shelf_tag'
        """
        buffer = io.BytesIO()

        # Unroll items according to quantity
        label_list = []
        for item in items:
            qty = max(1, int(item.get("quantity", 1)))
            for _ in range(qty):
                label_list.append({
                    "name": item.get("name", "Product"),
                    "sku": item.get("sku", "SKU"),
                    "price": item.get("price", "0.00"),
                })

        if not label_list:
            label_list = [{"name": "Sample Product", "sku": "SAMPLE-SKU", "price": "0.00"}]

        if label_layout == "single_thermal":
            cls._render_thermal_labels(buffer, label_list, business_name, width=50 * mm, height=30 * mm)
        elif label_layout == "shelf_tag":
            cls._render_thermal_labels(buffer, label_list, business_name, width=70 * mm, height=45 * mm)
        elif label_layout == "a4_30":
            cls._render_sheet_labels(buffer, label_list, business_name, cols=3, rows=10, label_h=29.7 * mm)
        else:  # default a4_24 (3 x 8)
            cls._render_sheet_labels(buffer, label_list, business_name, cols=3, rows=8, label_h=37.0 * mm)

        buffer.seek(0)
        return buffer.getvalue()

    @classmethod
    def _render_sheet_labels(cls, buffer, label_list, business_name, cols, rows, label_h):
        c = Canvas(buffer, pagesize=A4)
        page_w, page_h = A4
        label_w = 70 * mm
        labels_per_page = cols * rows

        # Center grid on A4
        margin_x = (page_w - (cols * label_w)) / 2.0
        margin_y = (page_h - (rows * label_h)) / 2.0

        total_labels = len(label_list)
        for idx, item in enumerate(label_list):
            page_idx = idx % labels_per_page
            col = page_idx % cols
            row = page_idx // cols  # 0 at top

            # ReportLab origin (0,0) is bottom-left
            x = margin_x + (col * label_w)
            y = page_h - margin_y - ((row + 1) * label_h)

            cls._draw_label_box(c, x, y, label_w, label_h, item, business_name, is_compact=(rows > 8))

            # New page if we filled this sheet and have more labels
            if page_idx == labels_per_page - 1 and idx < total_labels - 1:
                c.showPage()

        c.save()

    @classmethod
    def _render_thermal_labels(cls, buffer, label_list, business_name, width, height):
        c = Canvas(buffer, pagesize=(width, height))
        for idx, item in enumerate(label_list):
            cls._draw_label_box(c, 0, 0, width, height, item, business_name, is_compact=False)
            if idx < len(label_list) - 1:
                c.showPage()
        c.save()

    @classmethod
    def _draw_label_box(cls, c, x, y, w, h, item, business_name, is_compact=False):
        c.saveState()

        # Subtle cutting border
        c.setStrokeColorRGB(0.85, 0.85, 0.85)
        c.setLineWidth(0.4)
        c.rect(x + 2, y + 2, w - 4, h - 4, fill=0)

        # Header: Store name (tiny, centered)
        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColorRGB(0.3, 0.3, 0.3)
        c.drawCentredString(x + (w / 2.0), y + h - 10, str(business_name).upper()[:28])

        # Product Name
        c.setFont("Helvetica-Bold", 8 if is_compact else 8.5)
        c.setFillColorRGB(0.05, 0.05, 0.05)
        name_str = str(item.get("name", ""))[:26]
        c.drawCentredString(x + (w / 2.0), y + h - 20, name_str)

        # Price tag
        c.setFont("Helvetica-Bold", 9 if is_compact else 10)
        c.setFillColorRGB(0.1, 0.1, 0.1)
        price_str = f"MRP: Rs. {item.get('price', '0.00')}"
        c.drawCentredString(x + (w / 2.0), y + h - 31, price_str)

        # Vector Barcode Drawing
        sku = str(item.get("sku", "UNKNOWN"))
        bar_height = 20 if is_compact else 25
        try:
            barcode = createBarcodeDrawing(
                "Code128",
                value=sku,
                barWidth=0.85 if is_compact else 0.95,
                barHeight=bar_height,
                humanReadable=True,
                fontSize=6.5 if is_compact else 7,
            )
            # Center the barcode in label
            bc_w = barcode.width
            bc_x = x + ((w - bc_w) / 2.0)
            bc_y = y + 6
            renderPDF.draw(barcode, c, bc_x, bc_y)
        except Exception:
            # Text fallback if SKU cannot encode in Code128
            c.setFont("Helvetica", 7.5)
            c.drawCentredString(x + (w / 2.0), y + 10, f"SKU: {sku}")

        c.restoreState()
