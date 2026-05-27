import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, AlertTriangle, TrendingDown, TrendingUp, Package, Plus, Upload, Download } from 'lucide-react';
import type { StockMovement } from '../../types/supplierOrder';
import type { POSProduct } from './POSPageEnhanced';
import type { Product } from './ProductsPageEnhanced';
import type { ProductExcelImportResult } from '../../services/api';

interface InventoryPageProps {
  products: POSProduct[];
  stockMovements: StockMovement[];
  openAddItemSignal?: number;
  onStockAdjustment: (productId: string, type: 'in' | 'out', quantity: number, reason: string) => void;
  onAddItem: (product: Product) => Promise<void> | void;
  onBulkImportItems: (file: File) => Promise<ProductExcelImportResult>;
  onDownloadImportTemplate: () => Promise<void>;
}

const getReorderLevel = (product: POSProduct) => {
  if (product.category === 'Beverages') return 20;
  if (product.category === 'Bakery' || product.category === 'Food') return 12;
  return 10;
};
const getLocation = (category: string) => {
  if (category === 'Bakery' || category === 'Food') return 'Kitchen B1';
  if (category === 'Dairy') return 'Fridge A1';
  if (category === 'Supplies') return 'Storage C1';
  return 'Storage A1';
};

export function InventoryPage({
  products,
  stockMovements,
  openAddItemSignal = 0,
  onStockAdjustment,
  onAddItem,
  onBulkImportItems,
  onDownloadImportTemplate
}: InventoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    quantity: '1',
    reason: ''
  });
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportMessage, setBulkImportMessage] = useState('');
  const [bulkImportErrors, setBulkImportErrors] = useState<ProductExcelImportResult['errors']>([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isTemplateDownloading, setIsTemplateDownloading] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    name: '',
    sku: '',
    category: '',
    uom: 'pcs',
    buyingPrice: '',
    retailPrice: '',
    wholesalePrice: '',
    corporatePrice: '',
    loyalPrice: '',
    stock: '0',
    reorderLevel: '0',
    tax: '10'
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (openAddItemSignal > 0) {
      setIsAddItemOpen(true);
    }
  }, [openAddItemSignal]);

  const openAdjustmentDialog = (type: 'in' | 'out') => {
    setFormError('');
    setAdjustmentType(type);
    setAdjustmentForm({
      productId: products[0]?.id || '',
      quantity: '1',
      reason: type === 'in' ? 'Stock received' : 'Stock removed'
    });
  };

  const handleStockAdjustment = () => {
    setFormError('');
    const quantity = Number(adjustmentForm.quantity);
    if (!adjustmentType || !adjustmentForm.productId || quantity <= 0) {
      setFormError('Select an item and enter a quantity greater than zero.');
      return;
    }

    onStockAdjustment(adjustmentForm.productId, adjustmentType, quantity, adjustmentForm.reason || (adjustmentType === 'in' ? 'Stock in' : 'Stock out'));
    setAdjustmentType(null);
  };

  const handleAddItem = async () => {
    setFormError('');
    if (!addItemForm.name || !addItemForm.sku || !addItemForm.category) {
      setFormError('Enter item name, SKU, and category.');
      return;
    }

    const retailPrice = Number(addItemForm.retailPrice) || 0;
    const wholesalePrice = Number(addItemForm.wholesalePrice) || retailPrice;
    const corporatePrice = Number(addItemForm.corporatePrice) || wholesalePrice || retailPrice;
    const loyalPrice = Number(addItemForm.loyalPrice) || retailPrice;
    const buyingPrice = Number(addItemForm.buyingPrice) || 0;

    try {
      await onAddItem({
        id: Date.now().toString(),
        name: addItemForm.name,
        sku: addItemForm.sku,
        category: addItemForm.category,
        buyingPrice,
        prices: {
          retail: retailPrice,
          wholesale: wholesalePrice,
          corporate: corporatePrice,
          loyal: loyalPrice
        },
        profitMargin: buyingPrice > 0 ? ((retailPrice - buyingPrice) / buyingPrice) * 100 : 0,
        uom: addItemForm.uom,
        stock: Number(addItemForm.stock) || 0,
        reorderLevel: Number(addItemForm.reorderLevel) || 0,
        image: '',
        tax: Number(addItemForm.tax) || 0
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Inventory item could not be added.');
      return;
    }

    setAddItemForm({
      name: '',
      sku: '',
      category: '',
      uom: 'pcs',
      buyingPrice: '',
      retailPrice: '',
      wholesalePrice: '',
      corporatePrice: '',
      loyalPrice: '',
      stock: '0',
      reorderLevel: '0',
      tax: '10'
    });
    setIsAddItemOpen(false);
  };

  const handleDownloadTemplate = async () => {
    setFormError('');
    setIsTemplateDownloading(true);

    try {
      await onDownloadImportTemplate();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Product template could not be downloaded.');
    } finally {
      setIsTemplateDownloading(false);
    }
  };

  const handleBulkImport = async () => {
    setBulkImportMessage('');
    setBulkImportErrors([]);

    if (!bulkImportFile) {
      setFormError('Choose an Excel file to import.');
      return;
    }

    setFormError('');
    setIsBulkImporting(true);

    try {
      const result = await onBulkImportItems(bulkImportFile);
      setBulkImportMessage(`Imported ${result.created} new item${result.created === 1 ? '' : 's'} and updated ${result.updated} item${result.updated === 1 ? '' : 's'}.`);
      setBulkImportErrors(result.errors || []);
      setBulkImportFile(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Products could not be imported.');
    } finally {
      setIsBulkImporting(false);
    }
  };
  const inventory = products.map(product => ({
    id: product.id,
    name: product.name,
    current: product.stock,
    reorderLevel: getReorderLevel(product),
    location: getLocation(product.category),
    category: product.category,
    cost: product.prices.wholesale,
    selling: product.prices.retail
  }));

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter(item => item.current <= item.reorderLevel);
  const categories = ['all', ...Array.from(new Set(inventory.map(item => item.category)))];

  const getStockStatus = (current: number, reorderLevel: number) => {
    if (current === 0) return <Badge className="bg-red-500/20 text-red-600">Out of Stock</Badge>;
    if (current <= reorderLevel) return <Badge className="bg-orange-500/20 text-orange-600">Low Stock</Badge>;
    return <Badge className="bg-green-500/20 text-green-600">In Stock</Badge>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-500">Monitor stock levels and inventory movements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openAdjustmentDialog('in')}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Stock In
          </Button>
          <Button variant="outline" onClick={() => openAdjustmentDialog('out')}>
            <TrendingDown className="w-4 h-4 mr-2" />
            Stock Out
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
            setFormError('');
            setIsAddItemOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate} disabled={isTemplateDownloading}>
            <Download className="w-4 h-4 mr-2" />
            {isTemplateDownloading ? 'Downloading...' : 'Excel Template'}
          </Button>
          <Button variant="outline" onClick={() => {
            setFormError('');
            setBulkImportMessage('');
            setBulkImportErrors([]);
            setIsBulkImportOpen(true);
          }}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      <Dialog open={!!adjustmentType} onOpenChange={(open) => !open && setAdjustmentType(null)}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle>{adjustmentType === 'in' ? 'Stock In' : 'Stock Out'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Item</label>
              <Select
                value={adjustmentForm.productId}
                onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, productId: value })}
              >
                <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 border-gray-200">
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.stock} {product.uom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Quantity</label>
              <Input
                type="number"
                min="1"
                value={adjustmentForm.quantity}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                className="bg-gray-100 border-gray-200 text-gray-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Reason</label>
              <Input
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                className="bg-gray-100 border-gray-200 text-gray-900"
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleStockAdjustment}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setAdjustmentType(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Item name" value={addItemForm.name} onChange={(e) => setAddItemForm({ ...addItemForm, name: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="SKU" value={addItemForm.sku} onChange={(e) => setAddItemForm({ ...addItemForm, sku: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="Category" value={addItemForm.category} onChange={(e) => setAddItemForm({ ...addItemForm, category: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="Unit of measure" value={addItemForm.uom} onChange={(e) => setAddItemForm({ ...addItemForm, uom: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Buying price" value={addItemForm.buyingPrice} onChange={(e) => setAddItemForm({ ...addItemForm, buyingPrice: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Retail price" value={addItemForm.retailPrice} onChange={(e) => setAddItemForm({ ...addItemForm, retailPrice: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Wholesale price" value={addItemForm.wholesalePrice} onChange={(e) => setAddItemForm({ ...addItemForm, wholesalePrice: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Corporate price" value={addItemForm.corporatePrice} onChange={(e) => setAddItemForm({ ...addItemForm, corporatePrice: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Loyal price" value={addItemForm.loyalPrice} onChange={(e) => setAddItemForm({ ...addItemForm, loyalPrice: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Opening stock" value={addItemForm.stock} onChange={(e) => setAddItemForm({ ...addItemForm, stock: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Reorder level" value={addItemForm.reorderLevel} onChange={(e) => setAddItemForm({ ...addItemForm, reorderLevel: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input type="number" placeholder="Tax %" value={addItemForm.tax} onChange={(e) => setAddItemForm({ ...addItemForm, tax: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddItem}>
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Items from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Use the product import template, then upload the completed `.xlsx` file here.
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Excel File</label>
              <Input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="bg-gray-100 border-gray-200 text-gray-900"
                onChange={(event) => {
                  setBulkImportFile(event.target.files?.[0] || null);
                  setBulkImportMessage('');
                  setBulkImportErrors([]);
                }}
              />
            </div>
            {bulkImportMessage && <p className="text-sm text-green-600">{bulkImportMessage}</p>}
            {bulkImportErrors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {bulkImportErrors.map(error => (
                  <p key={`${error.row}-${error.message}`}>Row {error.row}: {error.message}</p>
                ))}
              </div>
            )}
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleBulkImport} disabled={isBulkImporting}>
                {isBulkImporting ? 'Importing...' : 'Import Items'}
              </Button>
              <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{inventory.length}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Low Stock Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{lowStockItems.length}</p>
              </div>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Stock Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  KSh {inventory.reduce((sum, item) => sum + (item.current * item.cost), 0).toFixed(0)}
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{categories.length - 1}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="bg-white border-gray-200">
          <TabsTrigger value="stock" className="data-[state=active]:bg-blue-600">Stock Overview</TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-blue-600">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-blue-600">Low Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          {/* Filters */}
          <Card className="bg-white border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    placeholder="Search inventory items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-100 border-gray-200 text-gray-900"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 bg-gray-100 border-gray-200 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-100 border-gray-200">
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Inventory Items ({filteredInventory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Product</TableHead>
                    <TableHead className="text-gray-600">Category</TableHead>
                    <TableHead className="text-gray-600">Current Stock</TableHead>
                    <TableHead className="text-gray-600">Reorder Level</TableHead>
                    <TableHead className="text-gray-600">Location</TableHead>
                    <TableHead className="text-gray-600">Cost</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map(item => (
                    <TableRow key={item.id} className="border-gray-200">
                      <TableCell className="text-gray-900 font-medium">{item.name}</TableCell>
                      <TableCell className="text-gray-600">{item.category}</TableCell>
                      <TableCell className="text-gray-900">{item.current}</TableCell>
                      <TableCell className="text-gray-600">{item.reorderLevel}</TableCell>
                      <TableCell className="text-gray-600">{item.location}</TableCell>
                      <TableCell className="text-green-600">KSh {item.cost.toFixed(2)}</TableCell>
                      <TableCell>{getStockStatus(item.current, item.reorderLevel)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Item</TableHead>
                    <TableHead className="text-gray-600">Type</TableHead>
                    <TableHead className="text-gray-600">Quantity</TableHead>
                    <TableHead className="text-gray-600">Date</TableHead>
                    <TableHead className="text-gray-600">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map(movement => (
                    <TableRow key={movement.id} className="border-gray-200">
                      <TableCell className="text-gray-900 font-medium">{movement.item}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {movement.type === 'in' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-gray-600">
                            {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </TableCell>
                      <TableCell className="text-gray-600">{movement.date}</TableCell>
                      <TableCell className="text-gray-600">{movement.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Low Stock Alerts ({lowStockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No low stock alerts at the moment!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Product</TableHead>
                      <TableHead className="text-gray-600">Current Stock</TableHead>
                      <TableHead className="text-gray-600">Reorder Level</TableHead>
                      <TableHead className="text-gray-600">Location</TableHead>
                      <TableHead className="text-gray-600">Action Needed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map(item => (
                      <TableRow key={item.id} className="border-gray-200">
                        <TableCell className="text-gray-900 font-medium">{item.name}</TableCell>
                        <TableCell className="text-orange-600">{item.current}</TableCell>
                        <TableCell className="text-gray-600">{item.reorderLevel}</TableCell>
                        <TableCell className="text-gray-600">{item.location}</TableCell>
                        <TableCell>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Reorder Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
