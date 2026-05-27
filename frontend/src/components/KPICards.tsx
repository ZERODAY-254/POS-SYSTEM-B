import React from 'react';
import { Card, CardContent } from './ui/card';
import { LockKeyhole, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from './utils/helpers';
import type { CompletedSale, DayBalance, POSProduct } from './pages/POSPageEnhanced';

interface KPICardsProps {
  products: POSProduct[];
  completedSales: CompletedSale[];
  dayBalance: DayBalance;
  cashSalesToday: number;
}

export function KPICards({ completedSales, dayBalance, cashSalesToday }: KPICardsProps) {
  const totalSales = completedSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalTransactions = completedSales.length;
  const expectedClosingBalance = dayBalance.openingBalance + cashSalesToday;

  const kpiData = [
    {
      title: 'Opening Balance',
      value: formatCurrency(dayBalance.openingBalance),
      change: dayBalance.status === 'open' ? 'Day open' : 'Open drawer',
      changeType: dayBalance.status === 'open' ? 'positive' : 'neutral',
      icon: Wallet,
      color: 'text-blue-600'
    },
    {
      title: 'Expected Closing Balance',
      value: formatCurrency(expectedClosingBalance),
      change: `${formatCurrency(cashSalesToday)} cash sales`,
      changeType: cashSalesToday > 0 ? 'positive' : 'neutral',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Closing Balance',
      value: dayBalance.closingBalance === null ? 'Not closed' : formatCurrency(dayBalance.closingBalance),
      change: dayBalance.status === 'closed' && dayBalance.closingBalance !== null ? 'Day closed' : 'Pending close',
      changeType: dayBalance.status === 'closed' && dayBalance.closingBalance !== null ? 'positive' : 'neutral',
      icon: LockKeyhole,
      color: 'text-orange-600'
    },
    {
      title: 'Transactions Today',
      value: totalTransactions.toString(),
      change: formatCurrency(totalSales),
      changeType: totalTransactions > 0 ? 'positive' : 'neutral',
      icon: ShoppingCart,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Card key={index} className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gray-100 ${item.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.changeType === 'positive'
                      ? 'text-green-600 bg-green-400/10'
                      : 'text-gray-500 bg-gray-400/10'
                  }`}
                >
                  {item.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900 mb-1">{item.value}</p>
                <p className="text-sm text-gray-500">{item.title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
