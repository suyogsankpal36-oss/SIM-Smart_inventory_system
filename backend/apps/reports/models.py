# The reports app has no models of its own. Every report is computed
# on demand from Order, OrderItem, Product, InventoryTransaction, and
# Expense data (see apps/reports/services.py and views.py, added in the
# API phase). Kept as an empty module so Django treats this as a
# standard app.
