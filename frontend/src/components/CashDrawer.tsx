import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatCurrency } from './utils/helpers';
import type { DayBalance } from './pages/POSPageEnhanced';

export interface CashDrawerData {
  id: string;
  cashierId: string;
  date: string;
  openingBalance: number;
  closingBalance: number;
  transactions: number;
  status: 'open' | 'closed';
  createdAt: Date;
  closedAt?: Date;
}

interface CashDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cashier: string;
  dayBalance: DayBalance;
  cashSalesToday: number;
  onOpenDay: (openingBalance: number) => void;
  onCloseDay: (closingBalance: number) => void;
}

export function CashDrawer({
  isOpen,
  onOpenChange,
  cashier,
  dayBalance,
  cashSalesToday,
  onOpenDay,
  onCloseDay
}: CashDrawerProps) {
  const [openingBalance, setOpeningBalance] = useState(dayBalance.openingBalance.toString());
  const [closingBalance, setClosingBalance] = useState('');
  const [discrepancy, setDiscrepancy] = useState<number>(0);
  const expectedClosingBalance = dayBalance.openingBalance + cashSalesToday;

  const handleOpenDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (openingBalance && parseFloat(openingBalance) >= 0) {
      onOpenDay(parseFloat(openingBalance));
      setDiscrepancy(0);
    }
  };

  const handleCloseDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (closingBalance) {
      const closing = parseFloat(closingBalance);
      const diff = closing - expectedClosingBalance;
      setDiscrepancy(diff);
      onCloseDay(closing);
      
      alert(`
        Drawer Closed
        Opening Balance: ${formatCurrency(dayBalance.openingBalance)}
        Cash Sales: ${formatCurrency(cashSalesToday)}
        Expected Total: ${formatCurrency(expectedClosingBalance)}
        Actual Closing: ${formatCurrency(closing)}
        ${diff === 0 ? '✓ Balanced' : diff > 0 ? `⚠ Overage: ${formatCurrency(Math.abs(diff))}` : `✗ Shortage: ${formatCurrency(Math.abs(diff))}`}
      `);
      
      setClosingBalance('');
      onOpenChange(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (dayBalance.status === 'closed') {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 w-full">
            <DollarSign className="w-4 h-4" />
            Open Cash Drawer
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle>Open Cash Drawer for Today</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOpenDrawer} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Date</p>
              <p className="font-semibold text-gray-900">{today}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Cashier</p>
              <p className="font-semibold text-gray-900">{cashier}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Opening Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh </span>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="pl-12 bg-white border-gray-300"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Open Drawer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 w-full">
          <DollarSign className="w-4 h-4" />
          Drawer Open
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-200 max-w-md">
        <DialogHeader>
          <DialogTitle>Close Cash Drawer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Opening Balance</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(dayBalance.openingBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Today's Cash Sales</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(cashSalesToday)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-600 mb-1">Expected Balance</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(expectedClosingBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleCloseDrawer} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Closing Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh </span>
                <Input
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="pl-12 bg-white border-gray-300"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            {closingBalance && (
              <div className={`p-3 rounded-lg border ${
                Math.abs(parseFloat(closingBalance) - expectedClosingBalance) < 0.01
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {Math.abs(parseFloat(closingBalance) - expectedClosingBalance) < 0.01 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  )}
                  <p className="text-xs text-gray-600">Drawer Variance</p>
                </div>
                <p className={`font-bold text-lg ${
                  Math.abs(parseFloat(closingBalance) - expectedClosingBalance) < 0.01
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {formatCurrency(parseFloat(closingBalance) - expectedClosingBalance)}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              Finalize & Close Drawer
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
