import { useEffect, useMemo, useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Dashboard } from './components/pages/Dashboard';
import { POSPage } from './components/pages/POSPageEnhanced';
import { ProductsPageEnhanced } from './components/pages/ProductsPageEnhanced';
import { InventoryPage } from './components/pages/InventoryPage';
import { CustomersPage } from './components/pages/CustomersPage';
import { InvoicesPage } from './components/pages/InvoicesPage';
import { ProcurementPage } from './components/pages/ProcurementPage';
import { ExpensesPage } from './components/pages/ExpensesPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { UsersPage } from './components/pages/UsersPage';
import { SettingsPage } from './components/pages/SettingsPage';
import {
  createProduct,
  createCustomer,
  createSale,
  createSupplier,
  createUser,
  deactivateUser,
  loadCurrentUser,
  loadCustomers,
  loadProducts,
  loadSales,
  loadSuppliers,
  loadUsers,
  login,
  logout,
  normalizeRole,
  updateUser,
  verifyTwoFactor,
  type BackendCustomer,
  type BackendSupplier,
  type BackendUser
} from './services/api';
import type { UserRole } from './types/auth';
import type { BusinessExpense, StockMovement, SupplierOrderInvoice } from './types/supplierOrder';
import type { CompletedSale, DayBalance, POSProduct } from './components/pages/POSPageEnhanced';
import type { Product } from './components/pages/ProductsPageEnhanced';
import type { QuickActionId } from './components/QuickActions';

const todayKey = () => new Date().toISOString().slice(0, 10);

const initialDayBalance: DayBalance = {
  date: todayKey(),
  openingBalance: 0,
  closingBalance: null,
  status: 'closed'
};

export function App() {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<BackendUser | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [completedSales, setCompletedSales] = useState<CompletedSale[]>([]);
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [suppliers, setSuppliers] = useState<BackendSupplier[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierOrderInvoice[]>([]);
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [dayBalance, setDayBalance] = useState<DayBalance>(initialDayBalance);
  const [openAddProductSignal, setOpenAddProductSignal] = useState(0);
  const [openAddCustomerSignal, setOpenAddCustomerSignal] = useState(0);
  const [openAddInventorySignal, setOpenAddInventorySignal] = useState(0);
  const [loadError, setLoadError] = useState('');

  const userRole: UserRole = normalizeRole(currentUser?.role);
  const userName = currentUser?.username || 'User';

  const cashSalesToday = useMemo(() => {
    const date = todayKey();
    return completedSales
      .filter(sale => sale.timestamp.toISOString().slice(0, 10) === date)
      .reduce((sum, sale) => sum + sale.cashAmount, 0);
  }, [completedSales]);

  const refreshBackendData = async () => {
    setLoadError('');
    try {
      const [nextProducts, nextSales, nextUsers, nextCustomers, nextSuppliers] = await Promise.all([
        loadProducts(),
        loadSales(),
        loadUsers(),
        loadCustomers(),
        loadSuppliers()
      ]);
      setProducts(nextProducts);
      setCompletedSales(nextSales);
      setUsers(nextUsers);
      setCustomers(nextCustomers);
      setSuppliers(nextSuppliers);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load backend data.');
    }
  };

  useEffect(() => {
    let isMounted = true;

    loadCurrentUser()
      .then(user => {
        if (!isMounted) return;
        setCurrentUser(user);
        if (user) {
          refreshBackendData();
        }
      })
      .finally(() => {
        if (isMounted) setIsBooting(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (username: string, password: string, role: UserRole) => {
    const result = await login(username, password, role);
    if (result.user && !result.twoFactorRequired) {
      setCurrentUser(result.user);
      await refreshBackendData();
    }
    return result;
  };

  const handleVerifyTwoFactor = async (username: string, code: string, role: UserRole) => {
    const result = await verifyTwoFactor(username, code, role);
    if (result.user) {
      setCurrentUser(result.user);
      await refreshBackendData();
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setProducts([]);
    setCompletedSales([]);
    setCustomers([]);
    setSuppliers([]);
    setUsers([]);
    setActiveItem('dashboard');
  };

  const handleCreateProduct = async (product: Product) => {
    const saved = await createProduct(product);
    setProducts(previous => [saved, ...previous.filter(item => item.id !== saved.id)]);
  };

  const handleTransactionComplete = async (sale: CompletedSale) => {
    setCompletedSales(previous => [sale, ...previous]);
    setProducts(previousProducts => previousProducts.map(product => {
      const soldUnits = sale.items
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.stockUnits * item.quantity, 0);
      return soldUnits > 0 ? { ...product, stock: Math.max(0, product.stock - soldUnits) } : product;
    }));

    try {
      const savedSale = await createSale(sale);
      setCompletedSales(previous => [savedSale, ...previous.filter(item => item.id !== sale.id)]);
      window.dispatchEvent(new Event('pos:notifications-changed'));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Sale was kept locally but could not be saved to backend.');
    }
  };

  const handleStockAdjustment = (productId: string, type: 'in' | 'out', quantity: number, reason: string) => {
    const product = products.find(item => item.id === productId);
    setProducts(previous => previous.map(item => {
      if (item.id !== productId) return item;
      const stock = type === 'in' ? item.stock + quantity : Math.max(0, item.stock - quantity);
      return { ...item, stock };
    }));
    setStockMovements(previous => [{
      id: String(Date.now()),
      productId,
      productName: product?.name || 'Item',
      item: product?.name || 'Item',
      type,
      quantity: type === 'in' ? quantity : -quantity,
      reason,
      date: todayKey()
    }, ...previous]);
  };

  const handleQuickAction = (action: QuickActionId) => {
    if (action === 'new-sale') setActiveItem('pos');
    if (action === 'add-product') {
      setActiveItem('products');
      setOpenAddProductSignal(signal => signal + 1);
    }
    if (action === 'add-customer') {
      setActiveItem('customers');
      setOpenAddCustomerSignal(signal => signal + 1);
    }
    if (action === 'quick-invoice') setActiveItem('invoices');
  };

  const handleCreateSupplierOrder = (invoice: Omit<SupplierOrderInvoice, 'id'>) => {
    setSupplierInvoices(previous => [{ ...invoice, id: String(Date.now()) }, ...previous]);
  };

  const content = () => {
    switch (activeItem) {
      case 'pos':
        return (
          <POSPage
            products={products}
            dayBalance={dayBalance}
            onTransactionComplete={handleTransactionComplete}
            onOpenDay={(openingBalance) => setDayBalance({ date: todayKey(), openingBalance, closingBalance: null, status: 'open' })}
            onCloseDay={(closingBalance) => setDayBalance(previous => ({ ...previous, closingBalance, status: 'closed' }))}
            cashSalesToday={cashSalesToday}
          />
        );
      case 'products':
        return <ProductsPageEnhanced products={products} openAddProductSignal={openAddProductSignal} onProductCreated={handleCreateProduct} />;
      case 'inventory':
        return (
          <InventoryPage
            products={products}
            stockMovements={stockMovements}
            openAddItemSignal={openAddInventorySignal}
            onStockAdjustment={handleStockAdjustment}
            onAddItem={handleCreateProduct}
            onBulkImportItems={async () => ({ created: 0, updated: 0, errors: [], message: 'Import endpoint is not wired yet.' })}
            onDownloadImportTemplate={async () => {
              window.open('/api/excel/template/products/', '_blank');
            }}
          />
        );
      case 'customers':
        return (
          <CustomersPage
            completedSales={completedSales}
            backendCustomers={customers}
            openAddCustomerSignal={openAddCustomerSignal}
            onCustomerCreated={async (customer) => {
              const saved = await createCustomer(customer);
              setCustomers(previous => [saved, ...previous.filter(item => item.id !== saved.id)]);
            }}
          />
        );
      case 'invoices':
        return <InvoicesPage completedSales={completedSales} supplierInvoices={supplierInvoices} />;
      case 'procurement':
        return (
          <ProcurementPage
            products={products}
            backendSuppliers={suppliers}
            supplierInvoices={supplierInvoices}
            onSupplierOrderCreated={handleCreateSupplierOrder}
            onSupplierCreated={async (supplier) => {
              const saved = await createSupplier(supplier);
              setSuppliers(previous => [saved, ...previous.filter(item => item.id !== saved.id)]);
            }}
          />
        );
      case 'expenses':
        return <ExpensesPage expenses={expenses} onExpenseCreated={(expense) => setExpenses(previous => [{ ...expense, id: String(Date.now()) }, ...previous])} />;
      case 'reports':
        return <ReportsPage products={products} completedSales={completedSales} expenses={expenses} supplierInvoices={supplierInvoices} dayBalance={dayBalance} />;
      case 'users':
        return (
          <UsersPage
            users={users}
            onCreateUser={async (user) => {
              const saved = await createUser(user);
              setUsers(previous => [saved, ...previous]);
            }}
            onUpdateUser={async (id, user) => {
              const saved = await updateUser(id, user);
              setUsers(previous => previous.map(item => item.id === id ? { ...item, ...saved } : item));
            }}
            onDeactivateUser={async (id) => {
              await deactivateUser(id);
              setUsers(previous => previous.map(item => item.id === id ? { ...item, is_active: false } : item));
            }}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <Dashboard
            products={products}
            completedSales={completedSales}
            dayBalance={dayBalance}
            cashSalesToday={cashSalesToday}
            customerCount={customers.length}
            supplierCount={suppliers.length || new Set(supplierInvoices.map(invoice => invoice.supplierName)).size}
            supplierInvoiceCount={supplierInvoices.length}
            userRole={userRole}
            onQuickAction={handleQuickAction}
          />
        );
    }
  };

  if (isBooting) {
    return <div className="flex min-h-screen items-center justify-center text-gray-600">Loading...</div>;
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} onVerifyTwoFactor={handleVerifyTwoFactor} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        onLogout={handleLogout}
        userRole={userRole}
        userName={userName}
      />
      <div className="min-w-0 flex-1">
        <TopHeader />
        <main className="p-4 sm:p-8">
          {loadError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}
          {content()}
        </main>
      </div>
    </div>
  );
}
