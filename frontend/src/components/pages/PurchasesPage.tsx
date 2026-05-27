import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Search, Eye, FileText } from 'lucide-react';
import type { SupplierOrderInvoice } from '../../types/supplierOrder';

interface PurchasesPageProps {
  supplierInvoices: SupplierOrderInvoice[];
}

export function PurchasesPage({ supplierInvoices }: PurchasesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const livePurchases = supplierInvoices.map(invoice => ({
    id: invoice.id.replace('SUP-INV', 'PUR'),
    supplier: invoice.supplierName,
    date: invoice.date,
    amount: invoice.amount,
    status: invoice.status === 'paid' ? 'completed' : invoice.status === 'delivered' ? 'delivered' : invoice.status === 'overdue' ? 'pending' : invoice.status,
    items: invoice.items
  }));
  const pagePurchases = livePurchases;
  const pageSuppliers = Array.from(new Map(supplierInvoices.map(invoice => [invoice.supplierId, { id: invoice.supplierId, name: invoice.supplierName }])).values());

  const filteredPurchases = pagePurchases.filter(purchase => {
    const matchesSearch = purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-600">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-500/20 text-blue-600">Delivered</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/20 text-gray-500">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Management</h1>
          <p className="text-gray-500">Track and manage supplier purchases</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Create New Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Supplier</label>
                  <Select>
                    <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900">
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      {pageSuppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Expected Delivery</label>
                  <Input type="date" className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-600 text-sm mb-2">Purchase Items</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Item name" className="bg-gray-100 border-gray-200 text-gray-900 flex-1" />
                    <Input placeholder="Qty" type="number" className="bg-gray-100 border-gray-200 text-gray-900 w-20" />
                    <Input placeholder="Price" type="number" className="bg-gray-100 border-gray-200 text-gray-900 w-24" />
                    <Button size="sm" variant="outline">+</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Payment Method</label>
                  <Select>
                    <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900">
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Total Amount</label>
                  <Input placeholder="0.00" type="number" className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setIsAddDialogOpen(false)}>Create Purchase</Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Save as Draft</Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Purchases</p>
                <p className="text-2xl font-semibold text-gray-900">{pagePurchases.length}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  KSh {pagePurchases.reduce((sum, p) => sum + p.amount, 0).toFixed(0)}
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pagePurchases.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Suppliers</p>
                <p className="text-2xl font-semibold text-gray-900">{pageSuppliers.length}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-gray-200 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search by purchase ID or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-100 border-gray-200 text-gray-900"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-100 border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-100 border-gray-200">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Purchase Orders ({filteredPurchases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Purchase ID</TableHead>
                <TableHead className="text-gray-600">Supplier</TableHead>
                <TableHead className="text-gray-600">Date</TableHead>
                <TableHead className="text-gray-600">Amount</TableHead>
                <TableHead className="text-gray-600">Items</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map(purchase => (
                <TableRow key={purchase.id} className="border-gray-200">
                  <TableCell className="text-blue-600 font-medium">{purchase.id}</TableCell>
                  <TableCell className="text-gray-900">{purchase.supplier}</TableCell>
                  <TableCell className="text-gray-600">{purchase.date}</TableCell>
                  <TableCell className="text-green-600">KSh {purchase.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-gray-600">{purchase.items} items</TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-300">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
