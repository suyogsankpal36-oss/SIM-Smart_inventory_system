/**
 * DashboardModel.js
 * Domain Model defining executive KPIs, telemetry aggregations, and trend contracts.
 */

export class DashboardKPIModel {
  constructor(data = {}) {
    const kpis = data.kpis || {};
    const business = data.business || {};

    this.businessName = business.name || "Smart Inventory";
    this.currencySymbol = business.currency_symbol || "₹";
    this.currency = business.currency || "INR";

    this.totalSales = Number(kpis.total_sales || 0);
    this.totalOrdersCount = Number(kpis.total_orders_count || 0);
    this.todaySales = Number(kpis.today_sales || 0);
    this.todayOrdersCount = Number(kpis.today_orders_count || 0);
    this.monthSales = Number(kpis.month_sales || 0);
    this.monthExpenses = Number(kpis.month_expenses || 0);
    this.estimatedProfit = Number(kpis.estimated_profit || 0);

    this.totalProducts = Number(kpis.total_products || 0);
    this.totalCustomers = Number(kpis.total_customers || 0);
    this.totalSuppliers = Number(kpis.total_suppliers || 0);
    this.lowStockCount = Number(kpis.low_stock_count || 0);

    this.salesTrend7d = data.sales_trend_7d || [];
    this.monthlyComparison6m = data.monthly_comparison_6m || [];
    this.recentOrders = data.recent_orders || [];
    this.lowStockItems = data.low_stock_items || [];
  }
}
