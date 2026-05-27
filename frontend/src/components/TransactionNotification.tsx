import React, { useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { CheckCircle } from 'lucide-react';
import { formatCurrency } from './utils/helpers';

interface TransactionNotificationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  paymentMethod: string;
  transactionId: string;
}

export function TransactionNotification({
  isOpen,
  onOpenChange,
  amount,
  paymentMethod,
  transactionId
}: TransactionNotificationProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onOpenChange]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border-green-200 max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-green-900">Transaction Complete</AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Amount</span>
              <span className="font-bold text-gray-900">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Method</span>
              <span className="font-semibold text-gray-900">{paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-600 text-sm">Transaction ID</span>
              <span className="text-xs font-mono text-gray-600">{transactionId}</span>
            </div>
          </div>
          <p className="text-xs text-center text-gray-500">
            💰 Drawer is now open for the next transaction
          </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
