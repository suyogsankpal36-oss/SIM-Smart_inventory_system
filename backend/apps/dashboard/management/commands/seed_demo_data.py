import datetime
import random
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit_logs.models import ActivityLog
from apps.customers.models import Customer
from apps.expenses.models import Expense
from apps.inventory.models import InventoryTransaction
from apps.products.models import Category, Product
from apps.sales.models import Invoice, Order, OrderItem
from apps.settings_app.models import BusinessSettings
from apps.suppliers.models import Supplier


class Command(BaseCommand):
    help = "Seeds comprehensive, high-value business domain demo data for executive demonstration."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing high-value demo data seeding..."))

        with transaction.atomic():
            # 1. Ensure Admin User
            admin_user = User.objects.filter(username="admin").first()
            if not admin_user:
                admin_user = User.objects.create_superuser(
                    username="admin",
                    email="admin@smartinventory.io",
                    password="admin123",
                    first_name="Alexander",
                    last_name="Vance",
                    role=User.Role.ADMIN,
                )
                self.stdout.write(self.style.SUCCESS("Created admin superuser: admin / admin123"))

            # 2. Update Business Settings
            settings_obj = BusinessSettings.load()
            settings_obj.business_name = "Imperial Apex Luxury & Tech"
            settings_obj.currency = "INR"
            settings_obj.currency_symbol = "₹"
            settings_obj.default_tax_rate = Decimal("18.00")
            settings_obj.low_stock_threshold = 5
            settings_obj.save()

            # 3. Seed Categories
            category_data = [
                ("Luxury & Horology", "Certified chronometers, tourbillons, and fine precious metal accessories"),
                ("Electronics & Computing", "Enterprise workstations, ultra-slim OLED displays, and peripherals"),
                ("Industrial & Hardware", "High-tensile industrial fixtures, power equipment, and precision tools"),
                ("Apparel & Leather Goods", "Handcrafted Italian calfskin leather accessories and sartorial blazers"),
                ("Office & Networking", "High-speed mesh nodes, motorized ergonomic frames, and conference tech"),
            ]

            category_map = {}
            for cat_name, desc in category_data:
                cat, _ = Category.objects.get_or_create(
                    name=cat_name,
                    defaults={"description": desc, "status": "active"},
                )
                category_map[cat_name] = cat

            self.stdout.write(self.style.SUCCESS(f"Categories ready: {len(category_map)} categories."))

            # 4. Seed Suppliers
            suppliers_data = [
                ("Geneva Master Horology SA", "Jean-Luc Meyer", "+41 22 718 9000", "supply@genevawatch.ch", "CHE-109.876.543", "Rue du Rhone 42", "Geneva", "Geneva", "1204", Supplier.PaymentTerms.NET_30),
                ("Silicon Craft Microelectronics", "Kevin Chen", "+91 80 4123 7890", "sales@siliconcraft.in", "29AAECS1234F1Z1", "Tech Park, Phase 2", "Bengaluru", "Karnataka", "560100", Supplier.PaymentTerms.NET_15),
                ("Bharat Precision Alloys & Tools", "Harish Verma", "+91 22 2589 1234", "orders@bharatalloys.com", "27AABCB9876G1Z3", "MIDC Industrial Area", "Mumbai", "Maharashtra", "400072", Supplier.PaymentTerms.IMMEDIATE),
                ("Firenze Luxury Leather Tanneries", "Marco Rossi", "+39 055 234 5678", "marco@firenzeleather.it", "IT-98765432100", "Via de Tornabuoni 14", "Florence", "Tuscany", "50123", Supplier.PaymentTerms.NET_30),
                ("ErgoDynamics Workstation Hardware", "Priya Sen", "+91 11 4987 6543", "dispatch@ergodynamics.in", "07AABCE3456H1Z7", "Okhla Phase III", "New Delhi", "Delhi", "110020", Supplier.PaymentTerms.NET_15),
            ]

            for s_name, cp, ph, em, gst, addr, city, state, postal, pt in suppliers_data:
                Supplier.objects.update_or_create(
                    name=s_name,
                    defaults={
                        "contact_person": cp,
                        "phone": ph,
                        "email": em,
                        "gst_number": gst,
                        "address": addr,
                        "city": city,
                        "state": state,
                        "postal_code": postal,
                        "payment_terms": pt,
                        "status": Supplier.Status.ACTIVE,
                    },
                )

            self.stdout.write(self.style.SUCCESS(f"Suppliers ready: {len(suppliers_data)} suppliers."))

            # 5. Seed Products (16 items, including 3 low-stock items)
            products_data = [
                # Luxury & Horology
                ("Aethelgard Imperial Tourbillon Gold Edition", "LUX-GLD-001", "Luxury & Horology", "Geneva Master Horology SA", 185000, 245000, 18, 8, 3),
                ("Vanguard Chronograph Rose Gold 42mm", "LUX-ROSE-002", "Luxury & Horology", "Geneva Master Horology SA", 95000, 135000, 18, 12, 4),
                ("Monaco 18K Solid Gold Cufflinks Pair", "LUX-CUFF-003", "Luxury & Horology", "Geneva Master Horology SA", 28000, 42000, 18, 2, 5),  # LOW STOCK (2 <= 5)
                ("Sovereign Titanium Automatic Diver 300M", "LUX-DIVE-004", "Luxury & Horology", "Geneva Master Horology SA", 62000, 89000, 18, 15, 5),
                # Electronics & Computing
                ("ProArt StudioBook OLED 4K 64GB", "ELE-LAP-101", "Electronics & Computing", "Silicon Craft Microelectronics", 125000, 165000, 18, 14, 5),
                ("Quantum Curved Gaming Monitor 38-inch", "ELE-MON-102", "Electronics & Computing", "Silicon Craft Microelectronics", 48000, 69990, 18, 18, 6),
                ("Obsidian Mechanical Keyboard RGB Gold Switches", "ELE-KEY-103", "Electronics & Computing", "Silicon Craft Microelectronics", 6500, 11990, 18, 4, 10),  # LOW STOCK (4 <= 10)
                ("AcousticStudio Wireless ANC Headphones", "ELE-AUD-104", "Electronics & Computing", "Silicon Craft Microelectronics", 14000, 22500, 18, 25, 8),
                # Industrial & Hardware
                ("Titanium Precision Cordless Rotary Kit", "IND-TOOL-201", "Industrial & Hardware", "Bharat Precision Alloys & Tools", 11000, 18500, 18, 30, 10),
                ("Industrial Digital Torque Calibrator", "IND-CAL-202", "Industrial & Hardware", "Bharat Precision Alloys & Tools", 34000, 49000, 18, 1, 4),  # LOW STOCK (1 <= 4)
                ("High-Tensile Aerospace Alloy Fasteners 500pk", "IND-FAST-203", "Industrial & Hardware", "Bharat Precision Alloys & Tools", 8500, 14200, 18, 45, 15),
                # Apparel & Leather Goods
                ("Milano Full-Grain Calfskin Executive Briefcase", "APP-LEA-301", "Apparel & Leather Goods", "Firenze Luxury Leather Tanneries", 16500, 28900, 12, 20, 5),
                ("Sartorial Cashmere Blend Blazer Dark Charcoal", "APP-BLAZ-302", "Apparel & Leather Goods", "Firenze Luxury Leather Tanneries", 12000, 21500, 12, 16, 5),
                ("Heritage Goodyear-Welted Oxford Shoes", "APP-SHOE-303", "Apparel & Leather Goods", "Firenze Luxury Leather Tanneries", 9500, 17500, 12, 22, 6),
                # Office & Networking
                ("AeroDesk Motorized Ergonomic Dual-Motor Frame", "OFF-DESK-401", "Office & Networking", "ErgoDynamics Workstation Hardware", 22000, 34990, 18, 11, 4),
                ("Enterprise Wi-Fi 7 Tri-Band Mesh Node", "OFF-MESH-402", "Office & Networking", "ErgoDynamics Workstation Hardware", 18500, 27900, 18, 19, 5),
            ]

            product_objs = []
            for name, sku, c_name, s_name, buy, sell, tax, stock, min_stk in products_data:
                prod, created = Product.objects.update_or_create(
                    sku=sku,
                    defaults={
                        "name": name,
                        "category": category_map[c_name],
                        "supplier_name": s_name,
                        "purchase_price": Decimal(str(buy)),
                        "selling_price": Decimal(str(sell)),
                        "tax_rate": Decimal(str(tax)),
                        "stock_quantity": stock,
                        "minimum_stock": min_stk,
                        "is_active": True,
                    },
                )
                prod.refresh_status(save=True)
                product_objs.append(prod)

            self.stdout.write(self.style.SUCCESS(f"Products ready: {len(product_objs)} products."))

            # 6. Seed Customers
            customers_data = [
                ("Apex Global Holdings Ltd", "finance@apexholdings.in", "+91 98201 54321", "BKC Financial District", "Mumbai", "Maharashtra", "400051", "27AAACA1234A1Z5"),
                ("Nexus Capital Advisors", "operations@nexuscap.com", "+91 98112 34567", "Connaught Place", "New Delhi", "Delhi", "110001", "27AABCN5678B1Z2"),
                ("Dr. Vikramaditya Singhania", "vikram@singhanialabs.com", "+91 99300 88776", "Altamount Road", "Mumbai", "Maharashtra", "400026", "27AABPS9988C1Z8"),
                ("Elena Rostova", "elena.r@luxurybrands.co", "+91 98450 11223", "Indiranagar 100ft Rd", "Bengaluru", "Karnataka", "560038", ""),
                ("Kalyan Precious Metals & Gems", "accounts@kalyangroup.in", "+91 98765 43210", "MG Road", "Kochi", "Kerala", "682016", "32AAACK4321D1Z9"),
                ("Zenith Cloud Architectures", "meera@zenithcloud.io", "+91 99123 45678", "HITEC City", "Hyderabad", "Telangana", "500081", "36AABCZ8765E1Z4"),
                ("Arjun Oberoi", "arjun.oberoi@skyline.org", "+91 97654 32109", "Boat Club Road", "Pune", "Maharashtra", "411001", ""),
                ("Walk-in Retail Client", "client@retail.com", "+91 90000 11111", "High Street Phoenix", "Mumbai", "Maharashtra", "400013", ""),
            ]

            customer_objs = []
            for name, email, phone, addr, city, state, postal, gst in customers_data:
                c, _ = Customer.objects.update_or_create(
                    phone=phone,
                    defaults={
                        "name": name,
                        "email": email,
                        "address": addr,
                        "city": city,
                        "state": state,
                        "postal_code": postal,
                        "gst_number": gst,
                    },
                )
                customer_objs.append(c)

            self.stdout.write(self.style.SUCCESS(f"Customers ready: {len(customer_objs)} customers."))

            # 7. Seed Orders Across Today, Past 7 Days, and Trailing 6 Months
            now = timezone.now()
            today_date = now.date()

            orders_schedule = [
                # TODAY (days_ago=0)
                (0, 11, 30, customer_objs[0], [(product_objs[1], 1), (product_objs[6], 1)], Order.PaymentMethod.UPI),
                (0, 14, 15, customer_objs[2], [(product_objs[0], 1)], Order.PaymentMethod.BANK_TRANSFER),
                (0, 16, 45, customer_objs[3], [(product_objs[7], 2), (product_objs[11], 1)], Order.PaymentMethod.CARD),
                (0, 18, 20, customer_objs[7], [(product_objs[6], 1), (product_objs[8], 1)], Order.PaymentMethod.CASH),

                # PAST 6 DAYS
                (1, 10, 15, customer_objs[1], [(product_objs[4], 1)], Order.PaymentMethod.BANK_TRANSFER),
                (1, 15, 30, customer_objs[5], [(product_objs[5], 2), (product_objs[15], 2)], Order.PaymentMethod.UPI),
                (2, 12, 0,  customer_objs[4], [(product_objs[0], 1), (product_objs[2], 2)], Order.PaymentMethod.BANK_TRANSFER),
                (2, 17, 45, customer_objs[6], [(product_objs[12], 1), (product_objs[13], 1)], Order.PaymentMethod.CARD),
                (3, 11, 20, customer_objs[3], [(product_objs[1], 1)], Order.PaymentMethod.CARD),
                (3, 16, 10, customer_objs[7], [(product_objs[7], 1), (product_objs[6], 1)], Order.PaymentMethod.CASH),
                (4, 14, 0,  customer_objs[0], [(product_objs[4], 2), (product_objs[14], 1)], Order.PaymentMethod.UPI),
                (4, 18, 30, customer_objs[2], [(product_objs[3], 1)], Order.PaymentMethod.BANK_TRANSFER),
                (5, 13, 15, customer_objs[5], [(product_objs[5], 1), (product_objs[15], 3)], Order.PaymentMethod.UPI),
                (5, 17, 0,  customer_objs[1], [(product_objs[9], 1), (product_objs[10], 2)], Order.PaymentMethod.BANK_TRANSFER),
                (6, 10, 45, customer_objs[4], [(product_objs[1], 1), (product_objs[11], 2)], Order.PaymentMethod.BANK_TRANSFER),
                (6, 16, 30, customer_objs[6], [(product_objs[12], 2), (product_objs[13], 2)], Order.PaymentMethod.CARD),

                # TRAILING MONTHS (Month -1 to Month -5)
                (25, 14, 0, customer_objs[0], [(product_objs[0], 1), (product_objs[4], 1)], Order.PaymentMethod.BANK_TRANSFER),
                (35, 11, 0, customer_objs[1], [(product_objs[1], 2), (product_objs[5], 1)], Order.PaymentMethod.UPI),
                (55, 15, 0, customer_objs[2], [(product_objs[0], 2)], Order.PaymentMethod.BANK_TRANSFER),
                (65, 16, 0, customer_objs[4], [(product_objs[3], 2), (product_objs[7], 4)], Order.PaymentMethod.UPI),
                (85, 12, 0, customer_objs[5], [(product_objs[4], 1), (product_objs[14], 2)], Order.PaymentMethod.CARD),
                (95, 17, 0, customer_objs[3], [(product_objs[1], 1), (product_objs[11], 2)], Order.PaymentMethod.CASH),
                (115, 13, 0, customer_objs[0], [(product_objs[0], 1), (product_objs[2], 2)], Order.PaymentMethod.BANK_TRANSFER),
                (125, 18, 0, customer_objs[1], [(product_objs[4], 2)], Order.PaymentMethod.UPI),
                (145, 10, 0, customer_objs[2], [(product_objs[1], 1), (product_objs[3], 1)], Order.PaymentMethod.BANK_TRANSFER),
                (165, 15, 0, customer_objs[5], [(product_objs[5], 2), (product_objs[15], 2)], Order.PaymentMethod.UPI),
            ]

            order_count = 0
            for days_ago, hour, minute, cust, items, pay_method in orders_schedule:
                order_date = today_date - datetime.timedelta(days=days_ago)
                dt = timezone.make_aware(datetime.datetime.combine(order_date, datetime.time(hour, minute)))

                # Calculate Subtotal and Tax
                subtotal = Decimal("0.00")
                tax_total = Decimal("0.00")
                item_rows = []

                for prod, qty in items:
                    line_price = prod.selling_price
                    line_tax_rate = prod.tax_rate
                    line_sub = line_price * qty
                    line_tax = (line_sub * line_tax_rate / Decimal("100.00")).quantize(Decimal("0.01"))
                    line_tot = line_sub + line_tax

                    subtotal += line_sub
                    tax_total += line_tax
                    item_rows.append((prod, qty, line_price, line_tax, line_tot))

                discount = Decimal("0.00")
                if subtotal > 100000:
                    discount = Decimal("2500.00")

                total_amount = subtotal + tax_total - discount

                order = Order.objects.create(
                    customer=cust,
                    subtotal=subtotal,
                    discount=discount,
                    tax=tax_total,
                    total_amount=total_amount,
                    payment_method=pay_method,
                    status=Order.Status.COMPLETED,
                    created_by=admin_user,
                )

                # Overwrite auto_now_add with scheduled date
                Order.objects.filter(id=order.id).update(created_at=dt, updated_at=dt)

                # Order Items & Inventory Movements
                for prod, qty, price, tax, tot in item_rows:
                    OrderItem.objects.create(
                        order=order,
                        product=prod,
                        quantity=qty,
                        price=price,
                        tax=tax,
                        discount=Decimal("0.00"),
                        total=tot,
                    )
                    InventoryTransaction.objects.create(
                        product=prod,
                        transaction_type=InventoryTransaction.TransactionType.SALE,
                        quantity=-qty,
                        previous_stock=prod.stock_quantity + qty,
                        new_stock=prod.stock_quantity,
                        reference=order.order_number,
                        user=admin_user,
                        notes=f"POS Sale Finalized ({pay_method})",
                    )

                # Invoice
                Invoice.objects.create(
                    order=order,
                    invoice_date=dt,
                    total_amount=total_amount,
                )

                # Denormalize customer purchases
                if cust:
                    cust.total_purchases += 1
                    cust.total_amount_spent += total_amount
                    cust.last_purchase_date = dt
                    cust.save()

                order_count += 1

            self.stdout.write(self.style.SUCCESS(f"Sales orders ready: {order_count} completed orders."))

            # 8. Seed Expenses (20 entries across trailing 6 months)
            expenses_data = [
                # Current Month
                (Expense.Category.RENT, "Flagship Showroom & Operations HQ Lease", Decimal("65000.00"), 3, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.SALARY, "Staff & Executive Payroll Disbursement", Decimal("185000.00"), 5, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.ELECTRICITY, "Commercial Power & Climate Control Utilities", Decimal("12400.00"), 8, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.MARKETING, "Luxury Digital Catalog & VIP Concierge Showcase", Decimal("28500.00"), 10, Expense.PaymentMethod.CARD),
                (Expense.Category.MAINTENANCE, "Three.js GPU Workstation & Cloud Server Hosting", Decimal("9500.00"), 12, Expense.PaymentMethod.CARD),
                (Expense.Category.TRANSPORTATION, "Armored Logistics & Insured Express Couriers", Decimal("14800.00"), 14, Expense.PaymentMethod.UPI),

                # Month -1
                (Expense.Category.RENT, "Flagship Showroom Lease", Decimal("65000.00"), 33, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.SALARY, "Staff Payroll", Decimal("180000.00"), 35, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.ELECTRICITY, "Power Utilities", Decimal("11800.00"), 38, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.MARKETING, "Social Advertising Campaign", Decimal("22000.00"), 42, Expense.PaymentMethod.CARD),
                (Expense.Category.TRANSPORTATION, "Logistics & Freight", Decimal("13500.00"), 45, Expense.PaymentMethod.UPI),

                # Month -2
                (Expense.Category.RENT, "Flagship Showroom Lease", Decimal("65000.00"), 63, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.SALARY, "Staff Payroll", Decimal("175000.00"), 65, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.ELECTRICITY, "Power Utilities", Decimal("13200.00"), 68, Expense.PaymentMethod.BANK_TRANSFER),

                # Month -3
                (Expense.Category.RENT, "Flagship Showroom Lease", Decimal("65000.00"), 93, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.SALARY, "Staff Payroll", Decimal("170000.00"), 95, Expense.PaymentMethod.BANK_TRANSFER),

                # Month -4
                (Expense.Category.RENT, "Flagship Showroom Lease", Decimal("65000.00"), 123, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.SALARY, "Staff Payroll", Decimal("170000.00"), 125, Expense.PaymentMethod.BANK_TRANSFER),

                # Month -5
                (Expense.Category.RENT, "Flagship Showroom Lease", Decimal("65000.00"), 153, Expense.PaymentMethod.BANK_TRANSFER),
                (Expense.Category.SALARY, "Staff Payroll", Decimal("165000.00"), 155, Expense.PaymentMethod.BANK_TRANSFER),
            ]

            expense_count = 0
            for cat, desc, amt, days_ago, pm in expenses_data:
                exp_date = today_date - datetime.timedelta(days=days_ago)
                exp = Expense.objects.create(
                    category=cat,
                    description=desc,
                    amount=amt,
                    payment_method=pm,
                    date=exp_date,
                    created_by=admin_user,
                )
                expense_count += 1

            self.stdout.write(self.style.SUCCESS(f"Expenses ready: {expense_count} entries."))

            # 9. Seed Activity Logs
            activity_events = [
                (ActivityLog.ActionType.LOGIN, ActivityLog.ModuleType.ACCOUNTS, "Staff Authentication", "System Operator 'admin' logged in to Executive Suite"),
                (ActivityLog.ActionType.CREATE, ActivityLog.ModuleType.PRODUCTS, "Aethelgard Imperial Tourbillon Gold Edition", "Registered high-value luxury SKU LUX-GLD-001"),
                (ActivityLog.ActionType.STOCK_CHANGE, ActivityLog.ModuleType.INVENTORY, "Inventory Receipt", "Received batch of 14 units for SKU ELE-LAP-101"),
                (ActivityLog.ActionType.CREATE, ActivityLog.ModuleType.SALES, "POS Finalization", "Finalized order with UPI checkout"),
                (ActivityLog.ActionType.UPDATE, ActivityLog.ModuleType.SETTINGS, "Business Telemetry", "Synchronized fiscal currency configuration to INR (₹)"),
            ]

            for act, mod, ent, desc in activity_events:
                ActivityLog.objects.create(
                    actor=admin_user,
                    action=act,
                    module=mod,
                    entity_name=ent,
                    description=desc,
                )

            self.stdout.write(self.style.SUCCESS("Activity logs created."))

        self.stdout.write(self.style.SUCCESS("=================================================="))
        self.stdout.write(self.style.SUCCESS("Demo Data Seeding Successfully Completed!"))
        self.stdout.write(self.style.SUCCESS("All charts, KPIs, orders, and tables now active."))
        self.stdout.write(self.style.SUCCESS("=================================================="))
