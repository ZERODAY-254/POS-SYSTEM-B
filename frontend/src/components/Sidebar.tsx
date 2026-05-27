import React, { useState } from 'react';
import {
  Home,
  ShoppingCart,
  FileText,
  Users,
  Package,
  Truck,
  BarChart3,
  CreditCard,
  TrendingUp,
  UserCheck,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserRole } from '../types/auth';

const allMenuItems = [
  { icon: Home, label: 'Dashboard', id: 'dashboard', roles: ['admin', 'manager', 'cashier', 'storekeeper', 'accountant'] },
  { icon: ShoppingCart, label: 'POS / Sales', id: 'pos', roles: ['admin', 'manager', 'cashier'] },
  { icon: FileText, label: 'Invoices', id: 'invoices', roles: ['admin', 'manager', 'cashier', 'accountant'] },
  { icon: Users, label: 'Customers', id: 'customers', roles: ['admin', 'manager', 'cashier'] },
  { icon: Package, label: 'Products / Items', id: 'products', roles: ['admin', 'manager', 'storekeeper'] },
  { icon: Truck, label: 'Procurement', id: 'procurement', roles: ['admin', 'manager', 'storekeeper'] },
  { icon: BarChart3, label: 'Inventory', id: 'inventory', roles: ['admin', 'manager', 'storekeeper'] },
  { icon: CreditCard, label: 'Expenses', id: 'expenses', roles: ['admin', 'manager', 'accountant'] },
  { icon: TrendingUp, label: 'Reports', id: 'reports', roles: ['admin', 'manager', 'accountant'] },
  { icon: UserCheck, label: 'Users / Staff', id: 'users', roles: ['admin', 'manager'] },
  { icon: Settings, label: 'Settings', id: 'settings', roles: ['admin', 'manager'] }
];

interface SidebarProps {
  activeItem: string;
  onItemClick: (itemId: string) => void;
  onLogout: () => void;
  userRole: UserRole;
  userName: string;
}

export function Sidebar({ activeItem, onItemClick, onLogout, userRole, userName }: SidebarProps) {
  const filteredMenuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const getRoleBadgeColor = (role: UserRole) => {
    switch(role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'cashier':
        return 'bg-blue-100 text-blue-800';
      case 'accountant':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-emerald-100 text-emerald-800';
      case 'storekeeper':
        return 'bg-amber-100 text-amber-800';
      case 'customer':
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo/Brand */}
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-gray-900 font-semibold text-lg tracking-tight">SALES ENTRY & RECEIPT</h2>
        <p className="text-gray-400 text-xs mt-0.5">Management System</p>
      </div>

      {/* User Info */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">Logged in as</p>
        <p className="text-sm font-semibold text-gray-900">{userName}</p>
        <Badge className={`mt-2 ${getRoleBadgeColor(userRole)}`}>
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </Badge>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <IconComponent className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="p-3 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-sm"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
