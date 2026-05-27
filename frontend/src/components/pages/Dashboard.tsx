import React from 'react';
import { KPICards } from '../KPICards';
import { Charts } from '../Charts';
import { DataTables } from '../DataTables';
import { QuickActions, type QuickActionId } from '../QuickActions';
import { Card, CardContent } from '../ui/card';
import { Building2, FileText, Users } from 'lucide-react';
import type { CompletedSale, DayBalance, POSProduct } from './POSPageEnhanced';
import type { UserRole } from '../../types/auth';

interface DashboardProps {
  products: POSProduct[];
  completedSales: CompletedSale[];
  dayBalance: DayBalance;
  cashSalesToday: number;
  customerCount: number;
  supplierCount: number;
  supplierInvoiceCount: number;
  userRole: UserRole;
  onQuickAction: (action: QuickActionId) => void;
}

export function Dashboard({
  products,
  completedSales,
  dayBalance,
  cashSalesToday,
  customerCount,
  supplierCount,
  supplierInvoiceCount,
  userRole,
  onQuickAction
}: DashboardProps) {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">DASHBOARD OVERVIEW</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* KPI Cards */}
      <KPICards
        products={products}
        completedSales={completedSales}
        dayBalance={dayBalance}
        cashSalesToday={cashSalesToday}
      />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{customerCount}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suppliers</p>
                <p className="text-2xl font-semibold text-gray-900">{supplierCount}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Supplier Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{supplierInvoiceCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Charts completedSales={completedSales} />

      {/* Data Tables */}
      <DataTables products={products} completedSales={completedSales} />

      {/* Quick Actions and Staff Leaderboard */}
      <QuickActions completedSales={completedSales} userRole={userRole} onAction={onQuickAction} />
    </div>
  );
}
