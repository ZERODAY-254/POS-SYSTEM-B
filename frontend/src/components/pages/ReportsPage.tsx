import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, DollarSign, ShoppingCart, Users, Package, Receipt } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import type { BusinessExpense, SupplierOrderInvoice } from '../../types/supplierOrder';
import type { CompletedSale, DayBalance, POSProduct } from './POSPageEnhanced';

interface ReportsPageProps {
  products: POSProduct[];
  completedSales: CompletedSale[];
  expenses: BusinessExpense[];
  supplierInvoices: SupplierOrderInvoice[];
  dayBalance: DayBalance;
}

type DateRange = '7days' | '30days' | '3months' | '6months' | '1year';

const rangeDays: Record<DateRange, number> = {
  '7days': 7,
  '30days': 30,
  '3months': 90,
  '6months': 180,
  '1year': 365
};

const shortDate = (date: Date) => date.toISOString().slice(0, 10);
const monthKey = (date: Date) => date.toLocaleString('en-US', { month: 'short' });
const toDate = (value: string | Date) => value instanceof Date ? value : new Date(value);

export function ReportsPage({ products, completedSales, expenses, supplierInvoices, dayBalance }: ReportsPageProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - rangeDays[dateRange]);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [dateRange]);

  const filteredSales = completedSales.filter(sale => toDate(sale.timestamp) >= startDate);
  const filteredExpenses = expenses.filter(expense => toDate(expense.date) >= startDate);
  const filteredSupplierInvoices = supplierInvoices.filter(invoice => toDate(invoice.date) >= startDate);

  const revenue = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const supplierSpend = filteredSupplierInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const transactions = filteredSales.length;
  const averageOrderValue = transactions > 0 ? revenue / transactions : 0;
  const uniqueCustomers = new Set(filteredSales.map(sale => sale.customer || 'Walk-in Customer')).size;
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.prices.wholesale, 0);
  const outstandingSupplierBalance = supplierInvoices
    .filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const grossProfit = revenue - expenseTotal;

  const salesTrend = useMemo(() => {
    const buckets = new Map<string, { name: string; revenue: number; transactions: number }>();
    filteredSales.forEach(sale => {
      const date = toDate(sale.timestamp);
      const key = dateRange === '7days' || dateRange === '30days' ? shortDate(date) : `${date.getFullYear()}-${date.getMonth()}`;
      const name = dateRange === '7days' || dateRange === '30days' ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : monthKey(date);
      const bucket = buckets.get(key) || { name, revenue: 0, transactions: 0 };
      bucket.revenue += sale.amount;
      bucket.transactions += 1;
      buckets.set(key, bucket);
    });
    return Array.from(buckets.values());
  }, [filteredSales, dateRange]);

  const productPerformance = useMemo(() => {
    const productTotals = new Map<string, { name: string; sales: number; revenue: number; stock: number }>();
    products.forEach(product => {
      productTotals.set(product.id, { name: product.name, sales: 0, revenue: 0, stock: product.stock });
    });
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const current = productTotals.get(item.productId) || { name: item.name, sales: 0, revenue: 0, stock: 0 };
        current.sales += item.quantity;
        current.revenue += item.total;
        productTotals.set(item.productId, current);
      });
    });
    return Array.from(productTotals.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 8);
  }, [filteredSales, products]);

  const profitData = useMemo(() => {
    const buckets = new Map<string, { name: string; revenue: number; expenses: number; supplierSpend: number; profit: number }>();
    const ensureBucket = (date: Date) => {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = buckets.get(key) || { name: monthKey(date), revenue: 0, expenses: 0, supplierSpend: 0, profit: 0 };
      buckets.set(key, bucket);
      return bucket;
    };

    filteredSales.forEach(sale => {
      ensureBucket(toDate(sale.timestamp)).revenue += sale.amount;
    });
    filteredExpenses.forEach(expense => {
      ensureBucket(toDate(expense.date)).expenses += expense.amount;
    });
    filteredSupplierInvoices.forEach(invoice => {
      ensureBucket(toDate(invoice.date)).supplierSpend += invoice.amount;
    });

    return Array.from(buckets.values()).map(bucket => ({
      ...bucket,
      profit: bucket.revenue - bucket.expenses
    }));
  }, [filteredSales, filteredExpenses, filteredSupplierInvoices]);

  const keyMetrics = [
    { title: 'Total Revenue', value: formatCurrency(revenue), change: `${transactions} completed sales`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-500/20' },
    { title: 'Total Transactions', value: String(transactions), change: `${formatCurrency(averageOrderValue)} avg order`, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-500/20' },
    { title: 'Gross Profit', value: formatCurrency(grossProfit), change: `${formatCurrency(expenseTotal)} expenses`, icon: TrendingUp, color: grossProfit >= 0 ? 'text-purple-600' : 'text-red-600', bg: 'bg-purple-500/20' },
    { title: 'Unique Customers', value: String(uniqueCustomers), change: `${formatCurrency(outstandingSupplierBalance)} supplier balance`, icon: Users, color: 'text-orange-600', bg: 'bg-orange-500/20' }
  ];

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Revenue', revenue.toFixed(2)],
      ['Transactions', String(transactions)],
      ['Average order value', averageOrderValue.toFixed(2)],
      ['Expenses', expenseTotal.toFixed(2)],
      ['Supplier spend', supplierSpend.toFixed(2)],
      ['Inventory value', inventoryValue.toFixed(2)],
      ['Cash drawer status', dayBalance.status]
    ];
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pos-report-${shortDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-500">Business performance from live sales, expenses, purchases, and stock</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-40 bg-gray-100 border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-100 border-gray-200">
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {keyMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{metric.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      {metric.change}
                    </p>
                  </div>
                  <div className={`p-2 ${metric.bg} rounded-lg`}>
                    <IconComponent className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Inventory Value</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(inventoryValue)}</p>
            </div>
            <Package className="w-6 h-6 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Supplier Purchases</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(supplierSpend)}</p>
            </div>
            <Receipt className="w-6 h-6 text-orange-600" />
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cash Drawer</p>
              <p className="text-xl font-semibold text-gray-900">{dayBalance.status === 'open' ? 'Open' : 'Closed'}</p>
            </div>
            <DollarSign className="w-6 h-6 text-green-600" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-white border-gray-200">
          <TabsTrigger value="sales" className="data-[state=active]:bg-blue-600">Sales Report</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-blue-600">Product Performance</TabsTrigger>
          <TabsTrigger value="profit" className="data-[state=active]:bg-blue-600">Profit & Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Transactions Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={140} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
                  <Bar dataKey="stock" fill="#14B8A6" name="Stock" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Profit & Loss Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  <Bar dataKey="supplierSpend" fill="#F59E0B" name="Supplier Purchases" />
                  <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
