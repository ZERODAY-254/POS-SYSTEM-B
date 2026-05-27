import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from './utils/helpers';
import type { CompletedSale, POSProduct } from './pages/POSPageEnhanced';

interface DataTablesProps {
  products: POSProduct[];
  completedSales: CompletedSale[];
}

export function DataTables({ products, completedSales }: DataTablesProps) {
  const recentSales = completedSales.slice(0, 5);
  const lowStockItems = products
    .filter(product => product.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Recent Sales Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Invoice #</TableHead>
                <TableHead className="text-gray-600">Customer</TableHead>
                <TableHead className="text-gray-600">Total</TableHead>
                <TableHead className="text-gray-600">Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.length === 0 ? (
                <TableRow className="border-gray-200">
                  <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                recentSales.map(sale => (
                  <TableRow key={sale.id} className="border-gray-200">
                    <TableCell className="text-blue-600">{sale.id}</TableCell>
                    <TableCell className="text-gray-600">{sale.customer}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(sale.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                        {sale.method.split(':')[0]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Item</TableHead>
                <TableHead className="text-gray-600">Quantity</TableHead>
                <TableHead className="text-gray-600">Reorder Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.length === 0 ? (
                <TableRow className="border-gray-200">
                  <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                    Stock levels are healthy
                  </TableCell>
                </TableRow>
              ) : (
                lowStockItems.map(item => (
                <TableRow key={item.id} className="border-gray-200">
                  <TableCell className="text-gray-600">{item.name}</TableCell>
                  <TableCell>
                    <span className="text-orange-600 font-semibold">
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">10</TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
