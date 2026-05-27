import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ShoppingBag, Truck } from 'lucide-react';
import { PurchasesPage } from './PurchasesPage';
import { SuppliersPage } from './SuppliersPage';
import type { SupplierOrderInvoice } from '../../types/supplierOrder';
import type { POSProduct } from './POSPageEnhanced';
import type { BackendSupplier } from '../../services/api';

interface ProcurementPageProps {
  products: POSProduct[];
  backendSuppliers?: BackendSupplier[];
  supplierInvoices: SupplierOrderInvoice[];
  onSupplierOrderCreated: (invoice: Omit<SupplierOrderInvoice, 'id'>) => void;
  onSupplierCreated?: (supplier: { name: string; contact_person?: string; email?: string; phone?: string; address?: string }) => Promise<void> | void;
}

export function ProcurementPage({
  products,
  backendSuppliers = [],
  supplierInvoices,
  onSupplierOrderCreated,
  onSupplierCreated
}: ProcurementPageProps) {
  const [activeView, setActiveView] = useState<'suppliers' | 'purchases'>('suppliers');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Procurement</h1>
          <p className="text-gray-500">Manage suppliers and supplier purchases in one place</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'suppliers' ? 'default' : 'outline'}
            className={activeView === 'suppliers' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            onClick={() => setActiveView('suppliers')}
          >
            <Truck className="w-4 h-4 mr-2" />
            Suppliers
          </Button>
          <Button
            variant={activeView === 'purchases' ? 'default' : 'outline'}
            className={activeView === 'purchases' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            onClick={() => setActiveView('purchases')}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Purchases
          </Button>
        </div>
      </div>

      {activeView === 'suppliers' ? (
        <SuppliersPage
          products={products}
          backendSuppliers={backendSuppliers}
          supplierInvoices={supplierInvoices}
          onSupplierOrderCreated={onSupplierOrderCreated}
          onSupplierCreated={onSupplierCreated}
        />
      ) : (
        <PurchasesPage supplierInvoices={supplierInvoices} />
      )}
    </div>
  );
}
