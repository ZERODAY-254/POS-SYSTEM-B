import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatCurrency } from './utils/helpers';
import { initiateMpesaPayment } from '../services/api';

type MpesaPromptResponse = {
  success?: boolean;
  demo_mode?: boolean;
  message?: string;
  transaction?: {
    id?: number;
    checkout_request_id?: string;
    status?: string;
  };
};

export type PaymentMethod = 'cash' | 'card' | 'mpesa' | 'check' | 'bank_transfer';

export interface PaymentTransaction {
  method: PaymentMethod;
  amount: number;
  timestamp: Date;
  reference?: string;
}

interface MultiPaymentProps {
  totalAmount: number;
  onComplete: (payments: PaymentTransaction[]) => void;
  onCancel: () => void;
}

export function MultiPaymentHandler({ totalAmount, onComplete, onCancel }: MultiPaymentProps) {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>('cash');
  const [currentAmount, setCurrentAmount] = useState('');
  const [reference, setReference] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('0798550825');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [isSendingMpesaPrompt, setIsSendingMpesaPrompt] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - totalPaid;
  const currentAmountNumber = parseFloat(currentAmount);

  const formatPaymentMethod = (method: PaymentMethod) => {
    if (method === 'mpesa') return 'M-Pesa';
    if (method === 'bank_transfer') return 'Bank Transfer';
    if (method === 'card') return 'Credit/Debit Card';
    if (method === 'check') return 'Check';
    return 'Cash';
  };

  const addPayment = async () => {
    if (!currentAmount || currentAmountNumber <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (currentAmountNumber > remaining) {
      alert(`Amount cannot exceed remaining: ${formatCurrency(remaining)}`);
      return;
    }

    let paymentReference = reference || undefined;

    if (currentMethod === 'mpesa') {
      if (!mpesaPhone.trim()) {
        alert('Enter the customer M-Pesa phone number.');
        return;
      }

      setIsSendingMpesaPrompt(true);
      setMpesaMessage('');

      try {
        const response = await initiateMpesaPayment({
          phoneNumber: mpesaPhone.trim(),
          amount: currentAmountNumber,
          customerName: 'SALES MANAGEMENT SYSTEM',
          accountReference: 'SALES MANAGEMENT SYSTEM',
          transactionDesc: 'POS payment'
        }) as MpesaPromptResponse;

        paymentReference = response.transaction?.checkout_request_id || response.message || 'M-Pesa prompt sent';
        setMpesaMessage(
          response.demo_mode
            ? `Demo M-Pesa request created. Ref: ${paymentReference}`
            : `M-Pesa prompt sent. Ref: ${paymentReference}`
        );
      } catch (error) {
        alert(error instanceof Error ? error.message : 'M-Pesa prompt could not be sent.');
        setIsSendingMpesaPrompt(false);
        return;
      } finally {
        setIsSendingMpesaPrompt(false);
      }
    }

    const newPayment: PaymentTransaction = {
      method: currentMethod,
      amount: currentAmountNumber,
      timestamp: new Date(),
      reference: paymentReference
    };

    setPayments([...payments, newPayment]);
    setCurrentAmount('');
    setReference('');
    setMpesaPhone('0798550825');
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const isComplete = Math.abs(totalPaid - totalAmount) < 0.01;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600 mb-1">Total Amount Due</p>
        <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Payment Method</label>
            <Select value={currentMethod} onValueChange={(val) => {
              setCurrentMethod(val as PaymentMethod);
              setReference('');
              setMpesaMessage('');
            }}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh </span>
              <Input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="pl-12 bg-white border-gray-300"
              />
            </div>
          </div>
        </div>

        {(currentMethod === 'check' || currentMethod === 'bank_transfer') && (
          <div>
            <label className="text-sm font-medium text-gray-600">Reference/Check #</label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter reference number"
              className="bg-white border-gray-300"
            />
          </div>
        )}

        {currentMethod === 'mpesa' && (
          <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3">
            <div>
              <label className="text-sm font-medium text-gray-600">M-Pesa Phone Number</label>
              <Input
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="e.g. 254712345678"
                className="bg-white border-gray-300"
              />
            </div>
            {mpesaMessage && <p className="text-xs font-medium text-green-700">{mpesaMessage}</p>}
          </div>
        )}

        <Button 
          onClick={addPayment} 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={!currentAmount || currentAmountNumber <= 0 || isSendingMpesaPrompt}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isSendingMpesaPrompt ? 'Sending M-Pesa Prompt...' : currentMethod === 'mpesa' ? 'Send M-Pesa Prompt' : 'Add Payment'}
        </Button>
      </div>

      {/* Payments List */}
      {payments.length > 0 && (
        <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-3">Payment Breakdown</p>
          {payments.map((payment, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{formatPaymentMethod(payment.method)}</p>
                {payment.reference && <p className="text-xs text-gray-500">Ref: {payment.reference}</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removePayment(idx)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card className="border-gray-200">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Paid</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Remaining</span>
              <span className={`font-semibold ${remaining <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {formatCurrency(Math.max(0, remaining))}
              </span>
            </div>
            {totalPaid > totalAmount && (
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600">Change Due</span>
                <span className="font-bold text-green-600">{formatCurrency(totalPaid - totalAmount)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={() => onComplete(payments)}
          disabled={!isComplete}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Complete Payment
        </Button>
      </div>
    </div>
  );
}
