import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CompletedSale } from './pages/POSPageEnhanced';

const paymentColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

interface ChartsProps {
  completedSales: CompletedSale[];
}

const buildSalesData = (completedSales: CompletedSale[]) => {
  const salesByDay = new Map<string, number>();

  completedSales.forEach(sale => {
    const label = sale.timestamp.toLocaleDateString(undefined, { weekday: 'short' });
    salesByDay.set(label, (salesByDay.get(label) || 0) + sale.amount);
  });

  return Array.from(salesByDay.entries()).map(([name, sales]) => ({ name, sales }));
};

const buildPaymentData = (completedSales: CompletedSale[]) => {
  const totalsByMethod = new Map<string, number>();
  completedSales.forEach(sale => {
    const method = sale.method.split(':')[0] || 'Unknown';
    totalsByMethod.set(method, (totalsByMethod.get(method) || 0) + sale.amount);
  });

  return Array.from(totalsByMethod.entries()).map(([name, value], index) => ({
    name,
    value,
    color: paymentColors[index % paymentColors.length]
  }));
};

export function Charts({ completedSales }: ChartsProps) {
  const salesData = buildSalesData(completedSales);
  const paymentData = buildPaymentData(completedSales);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Sales Over Time Chart */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No sales yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: '#374151' }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2 }}
              />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Type Chart */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No payments yet</div>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {paymentData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {item.name} ({item.value.toFixed(0)})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
