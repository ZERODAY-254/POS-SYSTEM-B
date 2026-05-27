import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Plus, Search, Edit, Trash2, Receipt, TrendingDown } from 'lucide-react';
import type { BusinessExpense } from '../../types/supplierOrder';

const categories = ['Rent', 'Utilities', 'Staff Salary', 'Equipment', 'Marketing', 'Supplies', 'Other'];
const today = () => new Date().toISOString().slice(0, 10);

interface ExpensesPageProps {
  expenses: BusinessExpense[];
  onExpenseCreated: (expense: Omit<BusinessExpense, 'id'>) => void;
}

export function ExpensesPage({ expenses, onExpenseCreated }: ExpensesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Supplies',
    amount: '',
    date: today(),
    paymentMethod: 'Cash',
    description: ''
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses
    .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
    .reduce((sum, exp) => sum + exp.amount, 0);

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      'Card': 'bg-blue-500/20 text-blue-600',
      'Cash': 'bg-green-500/20 text-green-600',
      'Bank Transfer': 'bg-purple-500/20 text-purple-600'
    };
    return <Badge className={colors[method as keyof typeof colors] || 'bg-gray-500/20 text-gray-500'}>{method}</Badge>;
  };

  const handleCreateExpense = () => {
    const amount = Number(expenseForm.amount);
    if (!amount || amount <= 0 || !expenseForm.description.trim()) return;

    onExpenseCreated({
      category: expenseForm.category,
      description: expenseForm.description.trim(),
      amount,
      date: expenseForm.date || today(),
      paymentMethod: expenseForm.paymentMethod,
      receipt: true
    });
    setExpenseForm({
      category: 'Supplies',
      amount: '',
      date: today(),
      paymentMethod: 'Cash',
      description: ''
    });
    setIsAddDialogOpen(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Management</h1>
          <p className="text-gray-500">Track and manage business expenses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={expenseForm.category} onValueChange={(category) => setExpenseForm({ ...expenseForm, category })}>
                <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 border-gray-200">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Amount"
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="bg-gray-100 border-gray-200 text-gray-900"
              />
              <Input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="bg-gray-100 border-gray-200 text-gray-900"
              />
              <Select value={expenseForm.paymentMethod} onValueChange={(paymentMethod) => setExpenseForm({ ...expenseForm, paymentMethod })}>
                <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 border-gray-200">
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="bg-gray-100 border-gray-200 text-gray-900"
              />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCreateExpense}>Add Expense</Button>
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
                <p className="text-gray-500 text-sm">Total Expenses</p>
                <p className="text-2xl font-semibold text-gray-900">KSh {totalExpenses.toFixed(0)}</p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">KSh {thisMonthExpenses.toFixed(0)}</p>
              </div>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Records</p>
                <p className="text-2xl font-semibold text-gray-900">{expenses.length}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">With Receipt</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {expenses.filter(exp => exp.receipt).length}
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Search className="w-6 h-6 text-green-600" />
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
                placeholder="Search expenses..."
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
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Expenses ({filteredExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Category</TableHead>
                <TableHead className="text-gray-600">Description</TableHead>
                <TableHead className="text-gray-600">Amount</TableHead>
                <TableHead className="text-gray-600">Date</TableHead>
                <TableHead className="text-gray-600">Payment Method</TableHead>
                <TableHead className="text-gray-600">Receipt</TableHead>
                <TableHead className="text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map(expense => (
                <TableRow key={expense.id} className="border-gray-200">
                  <TableCell>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-600">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-900">{expense.description}</TableCell>
                  <TableCell className="text-red-600">KSh {expense.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-gray-600">{expense.date}</TableCell>
                  <TableCell>{getPaymentMethodBadge(expense.paymentMethod)}</TableCell>
                  <TableCell>
                    {expense.receipt ? (
                      <Badge className="bg-green-500/20 text-green-600">
                        <Receipt className="w-3 h-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-500">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
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
