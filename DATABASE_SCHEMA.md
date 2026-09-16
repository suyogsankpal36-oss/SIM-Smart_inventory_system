# Database Schema — Phase 2-3

All models live under `backend/apps/<app>/models.py`. Tables use explicit `db_table`
names (snake_case, plural) so the schema reads cleanly in MySQL Workbench too.

## Entity Relationship Overview

```
User (accounts)
  └─< Order.created_by
  └─< InventoryTransaction.user
  └─< Expense.created_by

Category (products)
  └─< Product.category            (PROTECT — can't delete a category in use)

Product (products)
  └─< InventoryTransaction.product   (PROTECT)
  └─< OrderItem.product              (PROTECT)

Customer (customers)
  └─< Order.customer               (SET_NULL — walk-in sales allowed)

Order (sales)
  └─< OrderItem.order               (CASCADE)
  └── Invoice.order                 (OneToOne, CASCADE)

BusinessSettings (settings_app)      — singleton, no relationships
```

## Tables

### `users` (accounts.User)
Custom user model (extends Django's `AbstractUser`).
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| username, first_name, last_name, password, is_active, is_staff, is_superuser | — | from AbstractUser |
| email | EmailField | unique |
| role | CharField | `admin` \| `manager` \| `employee` (MVP uses admin/employee) |
| phone | CharField | optional |
| created_at, updated_at | DateTime | |

Indexes: `role`, `email`.

### `categories` (products.Category)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| name | CharField(150) | unique |
| description | Text | |
| status | CharField | `active` \| `inactive` |
| created_at, updated_at | DateTime | |

### `products` (products.Product)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| name | CharField(200) | |
| sku | CharField(50) | unique, indexed |
| category_id | FK → categories | PROTECT, nullable |
| description | Text | |
| purchase_price, selling_price | Decimal(12,2) | ≥ 0 |
| tax_rate | Decimal(5,2) | GST % |
| stock_quantity | PositiveInt | current stock |
| minimum_stock | PositiveInt | low-stock threshold |
| supplier_name | CharField(200) | free text — Supplier model is post-MVP |
| status | CharField | `in_stock` \| `low_stock` \| `out_of_stock`, auto-derived via `refresh_status()` |
| is_active | Boolean | |
| image | ImageField | optional |
| created_at, updated_at | DateTime | |

Indexes: `sku`, `status`, `name`.

### `inventory_transactions` (inventory.InventoryTransaction)
Append-only audit trail — never updated or deleted.
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| product_id | FK → products | PROTECT |
| transaction_type | CharField | `stock_in` \| `stock_out` \| `adjustment` \| `sale` \| `return` |
| quantity | Integer | signed (+in / -out) |
| previous_stock, new_stock | PositiveInt | snapshot before/after |
| reference | CharField(100) | order/PO number etc. |
| user_id | FK → users | SET_NULL |
| notes | Text | |
| created_at | DateTime | |

Indexes: `(product, -created_at)`, `transaction_type`.

### `customers` (customers.Customer)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| name | CharField(200) | |
| email, phone, address, city, state, postal_code, gst_number | — | all optional |
| total_purchases | PositiveInt | denormalized, updated on order completion |
| total_amount_spent | Decimal(14,2) | denormalized |
| last_purchase_date | DateTime | denormalized |
| created_at, updated_at | DateTime | |

Indexes: `name`, `phone`, `email`.

### `orders` (sales.Order)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| order_number | CharField(30) | unique, auto: `ORD-2026-00001` |
| customer_id | FK → customers | SET_NULL, nullable (walk-in sale) |
| subtotal, discount, tax, total_amount | Decimal | |
| payment_method | CharField | `cash` \| `card` \| `upi` \| `bank_transfer` |
| status | CharField | `completed` \| `cancelled` \| `returned` |
| created_by_id | FK → users | SET_NULL |
| created_at, updated_at | DateTime | |

Indexes: `order_number`, `status`, `-created_at`.

### `order_items` (sales.OrderItem)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| order_id | FK → orders | CASCADE |
| product_id | FK → products | PROTECT |
| quantity | PositiveInt | ≥ 1 |
| price, tax, discount | Decimal(12,2) | **snapshotted** at sale time |
| total | Decimal(14,2) | line total |

### `invoices` (sales.Invoice)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| order_id | FK → orders | OneToOne, CASCADE |
| invoice_number | CharField(30) | unique, auto: `INV-2026-00001` |
| invoice_date | DateTime | |
| total_amount | Decimal(14,2) | |
| created_at | DateTime | |

### `expenses` (expenses.Expense)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| category | CharField | rent/salary/electricity/transportation/marketing/maintenance/other |
| description | CharField(255) | |
| amount | Decimal(14,2) | > 0 |
| payment_method | CharField | cash/card/upi/bank_transfer |
| date | Date | |
| notes | Text | |
| created_by_id | FK → users | SET_NULL |
| created_at, updated_at | DateTime | |

Indexes: `category`, `date`.

### `business_settings` (settings_app.BusinessSettings)
Singleton table — `save()` forces `pk=1`, `delete()` is a no-op, and `BusinessSettings.load()`
returns (creating if needed) the one row every other part of the app reads from.
| Field | Type | Notes |
|---|---|---|
| id | PK | always `1` |
| business_name, address, phone, email, gst_number | — | |
| logo | ImageField | optional |
| currency, currency_symbol | CharField | default `INR` / `₹` |
| default_tax_rate | Decimal(5,2) | default `18.00` |
| low_stock_threshold | PositiveInt | default `5` |
| invoice_prefix | CharField(10) | default `INV` |
| updated_at | DateTime | |

### `suppliers` (suppliers.Supplier)
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| name | CharField(200) | Unique |
| contact_person | CharField(150) | optional |
| phone | CharField(20) | optional |
| email | EmailField | optional |
| gst_number | CharField(15) | optional, uppercase |
| address, city, state, postal_code | CharField | optional |
| payment_terms | CharField | `net_15`, `net_30`, `net_60`, `immediate`, `advance` |
| status | CharField | `active`, `inactive` |
| notes | Text | optional |
| created_at, updated_at | DateTime | |

### `notifications` (notifications.Notification)
In-app operational alerts and threshold warnings.
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| recipient | FK → users | CASCADE, null = broadcast to managers/admins |
| title | CharField(200) | |
| message | Text | |
| notification_type | CharField | `low_stock`, `out_of_stock`, `system`, `sales` |
| severity | CharField | `info`, `warning`, `critical` |
| reference_id | CharField(50) | optional ID (e.g. Product ID) |
| reference_type | CharField(50) | optional type (e.g. `product`) |
| is_read | Boolean | default `false` |
| created_at | DateTime | |
| read_at | DateTime | nullable |

Indexes: `is_read`, `notification_type`, `severity`, `-created_at`.

### `activity_logs` (audit_logs.ActivityLog)
Immutable audit trail recording administrative and operational activities.
| Field | Type | Notes |
|---|---|---|
| id | PK | |
| actor | FK → users | SET_NULL, nullable |
| action | CharField(20) | `create`, `update`, `delete`, `login`, `logout`, `price_change`, `stock_change` |
| module | CharField(50) | `accounts`, `products`, `inventory`, `sales`, `customers`, `suppliers`, `expenses`, `settings` |
| entity_name | CharField(150) | Human-readable name of resource |
| entity_id | CharField(50) | Resource primary key (optional) |
| description | Text | Descriptive narrative of the event |
| changes | JSONField | Key-value mapping of field modifications |
| ip_address | GenericIPAddressField | Client IP from request |
| created_at | DateTime | Auto-indexed timestamp |

Indexes: `(module, action)`, `(actor, -created_at)`, `-created_at`.

## Design notes

- **Stock integrity**: `InventoryTransaction` is append-only and is the single source of
  truth for *why* stock changed; `Product.stock_quantity` is the fast-read current value,
  kept in sync by application logic (added in the Inventory/Sales API phase) inside
  database transactions.
- **PROTECT vs SET_NULL vs CASCADE**: Products can't be deleted while referenced by
  inventory history or order items (`PROTECT`) — deactivate via `is_active` instead.
  Deleting a customer or user doesn't destroy historical orders/expenses (`SET_NULL`).
  Deleting an order does remove its line items and invoice (`CASCADE`), since those
  have no meaning without the parent order.
- **Price/tax snapshotting**: `OrderItem` stores its own `price`/`tax`/`discount` rather
  than referencing `Product` live, so historical invoices stay accurate after price changes.
- **Auto-numbering**: `Order.order_number` and `Invoice.invoice_number` are generated in
  `save()` from the current year + an incrementing sequence, matching the `ORD-2026-00001`
  / `INV-2026-00001` format from the spec.

## Next steps to run this locally

```bash
cd backend
cp .env.example .env        # set DB_ENGINE=sqlite for a quick local test, or configure MySQL
pip install -r requirements.txt
python manage.py makemigrations accounts products inventory customers sales expenses settings_app
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then visit `http://127.0.0.1:8000/admin/` and log in — every model above is registered in
the Django admin, so you can create categories/products/customers by hand and confirm the
schema and relationships behave as expected before the REST API phase wires up the frontend.
