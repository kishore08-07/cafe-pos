import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { ProductsPage } from '../pages/admin/ProductsPage';
import { CategoriesPage } from '../pages/admin/CategoriesPage';
import { PaymentMethodsPage } from '../pages/admin/PaymentMethodsPage';
import { CouponsPage } from '../pages/admin/CouponsPage';
import { TablesPage } from '../pages/admin/TablesPage';
import { EmployeesPage } from '../pages/admin/EmployeesPage';
import { SelfOrderPage } from '../pages/admin/SelfOrderPage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { POSLayout } from '../pages/pos/POSLayout';
import { OrderView } from '../pages/pos/OrderView';
import { PaymentScreen } from '../pages/pos/PaymentScreen';
import { OrdersListPage } from '../pages/pos/OrdersListPage';
import { CustomerPage } from '../pages/pos/CustomerPage';
import { TablesView } from '../pages/pos/TablesView';
import { SessionLanding } from '../pages/pos/SessionLanding';
import { KDSPage } from '../pages/kds/KDSPage';
import { CustomerDisplayPage } from '../pages/customer-display/CustomerDisplayPage';
import { SelfOrderPage as SelfOrderPortal } from '../pages/self-order/SelfOrderPage';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'ADMIN' | 'EMPLOYEE' }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/pos'} replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="payment" element={<PaymentMethodsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="self-order" element={<SelfOrderPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="/pos/session" element={<ProtectedRoute><SessionLanding /></ProtectedRoute>} />

      <Route path="/pos" element={<ProtectedRoute><POSLayout /></ProtectedRoute>}>
        <Route index element={<OrderView />} />
        <Route path="payment" element={<PaymentScreen />} />
        <Route path="history" element={<OrdersListPage />} />
        <Route path="customers" element={<CustomerPage />} />
        <Route path="tables" element={<TablesView />} />
      </Route>

      <Route path="/kds" element={<KDSPage />} />
      <Route path="/customer-display" element={<CustomerDisplayPage />} />
      <Route path="/s/:token" element={<SelfOrderPortal />} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
