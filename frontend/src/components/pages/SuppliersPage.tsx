import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Plus, Search, Edit, Eye, Phone, Mail, Building, PackagePlus } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { SupplierOrderInvoice, SupplierOrderStatus } from '../../types/supplierOrder';
import type { POSProduct } from './POSPageEnhanced';
import type { BackendSupplier } from '../../services/api';

interface SupplierSummary {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  balance: number;
  lastPurchase: string;
  totalPurchases: number;
}

interface SuppliersPageProps {
  products: POSProduct[];
  backendSuppliers?: BackendSupplier[];
  supplierInvoices: SupplierOrderInvoice[];
  onSupplierOrderCreated: (invoice: Omit<SupplierOrderInvoice, 'id'>) => void;
  onSupplierCreated?: (supplier: { name: string; contact_person?: string; email?: string; phone?: string; address?: string }) => Promise<void> | void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function SuppliersPage({
  products,
  backendSuppliers = [],
  supplierInvoices,
  onSupplierOrderCreated,
  onSupplierCreated
}: SuppliersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierSummary | null>(null);
  const [orderSupplier, setOrderSupplier] = useState<SupplierSummary | null>(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', email: '', phone: '', address: '', notes: '' });
  const [supplierFormError, setSupplierFormError] = useState('');
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [orderForm, setOrderForm] = useState({
    date: today(),
    amount: '',
    items: '1',
    productId: '',
    quantityDelivered: '1',
    paymentMethod: 'Credit',
    status: 'pending' as SupplierOrderStatus
  });

  const invoiceSuppliers = Array.from(
    supplierInvoices.reduce((map, invoice) => {
      const existing = map.get(invoice.supplierId);
      const pendingBalance = invoice.status === 'pending' || invoice.status === 'overdue' ? invoice.amount : 0;
      map.set(invoice.supplierId, {
        id: invoice.supplierId,
        name: invoice.supplierName,
        contact: invoice.contact || 'Not captured',
        email: existing?.email || '',
        phone: existing?.phone || 'Not captured',
        balance: (existing?.balance || 0) + pendingBalance,
        lastPurchase: existing && existing.lastPurchase > invoice.date ? existing.lastPurchase : invoice.date,
        totalPurchases: (existing?.totalPurchases || 0) + 1
      });
      return map;
    }, new Map<number, SupplierSummary>()).values()
  );
  const suppliers = [
    ...backendSuppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contact_person || 'Not captured',
      email: supplier.email || '',
      phone: supplier.phone || 'Not captured',
      balance: 0,
      lastPurchase: 'No purchases yet',
      totalPurchases: 0
    })),
    ...invoiceSuppliers.filter((invoiceSupplier) =>
      !backendSuppliers.some((supplier) => supplier.name.toLowerCase() === invoiceSupplier.name.toLowerCase())
    )
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBalanceBadge = (balance: number) => {
    if (balance > 0) return <Badge className="bg-green-500/20 text-green-600">Credit: {formatCurrency(balance)}</Badge>;
    if (balance < 0) return <Badge className="bg-red-500/20 text-red-600">Debt: {formatCurrency(Math.abs(balance))}</Badge>;
    return <Badge variant="secondary">Settled</Badge>;
  };

  const getSupplierInvoices = (supplierId: number) =>
    supplierInvoices.filter(invoice => invoice.supplierId === supplierId);

  const getSupplierSummary = (supplier: SupplierSummary) => {
    const invoices = getSupplierInvoices(supplier.id);
    return {
      totalPurchases: supplier.totalPurchases,
      lastPurchase: supplier.lastPurchase,
      balance: supplier.balance
    };
  };

  const openOrderDialog = (supplier: SupplierSummary) => {
    setOrderSupplier(supplier);
    setOrderForm({
      date: today(),
      amount: '',
      items: '1',
      productId: products[0]?.id || '',
      quantityDelivered: '1',
      paymentMethod: 'Credit',
      status: 'pending'
    });
  };

  const handleCreateOrder = () => {
    if (!orderSupplier) return;

    const amount = Number(orderForm.amount);
    const items = Math.max(1, Number(orderForm.items) || 1);
    const quantityDelivered = Math.max(1, Number(orderForm.quantityDelivered) || 1);
    const deliveredProduct = products.find(product => product.id === orderForm.productId) || products[0];
    if (!amount || amount <= 0) return;

    onSupplierOrderCreated({
      supplierId: orderSupplier.id,
      supplierName: orderSupplier.name,
      contact: orderSupplier.contact,
      date: orderForm.date || today(),
      amount,
      status: orderForm.status,
      items,
      paymentMethod: orderForm.paymentMethod,
      productId: orderForm.status === 'delivered' ? deliveredProduct?.id : undefined,
      productName: orderForm.status === 'delivered' ? deliveredProduct?.name : undefined,
      quantityDelivered: orderForm.status === 'delivered' ? quantityDelivered : undefined
    });
    setOrderSupplier(null);
  };

  const handleCreateSupplier = async () => {
    setSupplierFormError('');
    if (!supplierForm.name.trim()) {
      setSupplierFormError('Enter the supplier company name.');
      return;
    }

    setIsSavingSupplier(true);
    try {
      await onSupplierCreated?.({
        name: supplierForm.name.trim(),
        contact_person: supplierForm.contact.trim(),
        email: supplierForm.email.trim(),
        phone: supplierForm.phone.trim(),
        address: supplierForm.address.trim()
      });
      setSupplierForm({ name: '', contact: '', email: '', phone: '', address: '', notes: '' });
      setIsAddDialogOpen(false);
    } catch (error) {
      setSupplierFormError(error instanceof Error ? error.message : 'Supplier could not be saved.');
    } finally {
      setIsSavingSupplier(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Management</h1>
          <p className="text-gray-500">Manage your vendor relationships and contacts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Company Name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="Contact Person" value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="Email Address" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} type="email" className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="Phone Number" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Textarea placeholder="Company Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Textarea placeholder="Notes (Optional)" value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              {supplierFormError && <p className="text-sm text-red-600">{supplierFormError}</p>}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCreateSupplier} disabled={isSavingSupplier}>
                  {isSavingSupplier ? 'Saving...' : 'Add Supplier'}
                </Button>
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
                <p className="text-gray-500 text-sm">Total Suppliers</p>
                <p className="text-2xl font-semibold text-gray-900">{suppliers.length}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Outstanding Balance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  KSh {suppliers.reduce((sum, s) => sum + Math.max(0, getSupplierSummary(s).balance), 0).toFixed(0)}
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
                <p className="text-gray-500 text-sm">Active This Month</p>
                <p className="text-2xl font-semibold text-gray-900">{suppliers.length}</p>
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
                <p className="text-gray-500 text-sm">Total Purchases</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {suppliers.reduce((sum, s) => sum + getSupplierSummary(s).totalPurchases, 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-white border-gray-200 mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search suppliers by name or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-100 border-gray-200 text-gray-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Suppliers ({filteredSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Company</TableHead>
                <TableHead className="text-gray-600">Contact</TableHead>
                <TableHead className="text-gray-600">Balance</TableHead>
                <TableHead className="text-gray-600">Purchases</TableHead>
                <TableHead className="text-gray-600">Last Purchase</TableHead>
                <TableHead className="text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id} className="border-gray-200">
                  <TableCell className="text-gray-900 font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="text-gray-600 text-sm">
                      <div>{supplier.contact}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {supplier.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {supplier.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getBalanceBadge(getSupplierSummary(supplier).balance)}</TableCell>
                  <TableCell className="text-gray-600">{getSupplierSummary(supplier).totalPurchases}</TableCell>
                  <TableCell className="text-gray-600">{getSupplierSummary(supplier).lastPurchase}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-600 hover:text-orange-300"
                        onClick={() => openOrderDialog(supplier)}
                      >
                        <PackagePlus className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-300"
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-300">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Supplier Detail Dialog */}
      {selectedSupplier && (
        <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
          <DialogContent className="bg-white border-gray-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Supplier Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-900 font-semibold text-lg">{selectedSupplier.name}</h3>
                <p className="text-gray-500">{selectedSupplier.contact}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {selectedSupplier.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {selectedSupplier.phone}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-gray-500 text-xs">Total Purchases</p>
                  <p className="text-gray-900 font-semibold">{getSupplierSummary(selectedSupplier).totalPurchases}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Current Balance</p>
                  <p className={`font-semibold ${getSupplierSummary(selectedSupplier).balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    KSh {Math.abs(getSupplierSummary(selectedSupplier).balance).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">Last Purchase</p>
                  <p className="text-gray-900 font-semibold">{getSupplierSummary(selectedSupplier).lastPurchase}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => openOrderDialog(selectedSupplier)}>
                  Record Order
                </Button>
                <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {orderSupplier && (
        <Dialog open={!!orderSupplier} onOpenChange={() => setOrderSupplier(null)}>
          <DialogContent className="bg-white border-gray-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Record Supplier Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 font-medium">{orderSupplier.name}</p>
                <p className="text-sm text-gray-500">{orderSupplier.contact}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={orderForm.date}
                  onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
                  className="bg-gray-100 border-gray-200 text-gray-900"
                />
                <Input
                  type="number"
                  min="1"
                  placeholder="Items"
                  value={orderForm.items}
                  onChange={(e) => setOrderForm({ ...orderForm, items: e.target.value })}
                  className="bg-gray-100 border-gray-200 text-gray-900"
                />
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Order amount"
                value={orderForm.amount}
                onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                className="bg-gray-100 border-gray-200 text-gray-900"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={orderForm.paymentMethod}
                  onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}
                  className="h-9 rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-900"
                >
                  <option>Credit</option>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Check</option>
                </select>
                <select
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as SupplierOrderStatus })}
                  className="h-9 rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-900"
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              {orderForm.status === 'delivered' && (
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={orderForm.productId}
                    onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}
                    className="h-9 rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-900"
                  >
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty delivered"
                    value={orderForm.quantityDelivered}
                    onChange={(e) => setOrderForm({ ...orderForm, quantityDelivered: e.target.value })}
                    className="bg-gray-100 border-gray-200 text-gray-900"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCreateOrder}>
                  {orderForm.status === 'delivered' ? 'Receive Delivery' : 'Create Invoice'}
                </Button>
                <Button variant="outline" onClick={() => setOrderSupplier(null)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
