import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import InventoryPage from "./pages/InventoryPage";
import CustomersPage from "./pages/CustomersPage";
import POSTerminalPage from "./pages/POSTerminalPage";
import OrdersPage from "./pages/OrdersPage";
import InvoicesPage from "./pages/InvoicesPage";
import ExpensesPage from "./pages/ExpensesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import SuppliersPage from "./pages/SuppliersPage";
import EmployeesPage from "./pages/EmployeesPage";
import NotificationsPage from "./pages/NotificationsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import BarcodeGeneratorPage from "./pages/BarcodeGeneratorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Shell Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pos" element={<POSTerminalPage />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />

          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Barcode & QR Label Printing Studio (Admin & Manager) */}
          <Route
            path="/barcodes"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <BarcodeGeneratorPage />
              </ProtectedRoute>
            }
          />

          {/* Expenses Route (Admin & Manager) */}
        <Route
          path="/expenses"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />

        {/* Reports Route (Admin & Manager) */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings Route (Admin Only) */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Staff & Employees Route (Admin Only) */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />

        {/* Audit Trail Route (Admin Only) */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
