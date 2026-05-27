import { Badge } from '../ui/badge';

// Status Badge Helpers
export const getStatusBadge = (status: string, stock?: number) => {
  if (stock !== undefined) {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stock < 10) return <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">Low Stock</Badge>;
    return <Badge variant="secondary" className="bg-green-500/20 text-green-600">In Stock</Badge>;
  }

  switch (status) {
    case 'paid':
    case 'completed':
    case 'active':
      return <Badge className="bg-green-500/20 text-green-600">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>;
    case 'pending':
      return <Badge className="bg-orange-500/20 text-orange-600">Pending</Badge>;
    case 'overdue':
      return <Badge className="bg-red-500/20 text-red-600">Overdue</Badge>;
    case 'draft':
      return <Badge className="bg-gray-500/20 text-gray-500">Draft</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-500/20 text-gray-500">Inactive</Badge>;
    case 'low_stock':
      return <Badge className="bg-orange-500/20 text-orange-600">Low Stock</Badge>;
    case 'out_of_stock':
      return <Badge className="bg-red-500/20 text-red-600">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const getPaymentMethodBadge = (method: string) => {
  const colors = {
    'Card': 'bg-blue-500/20 text-blue-600',
    'Cash': 'bg-green-500/20 text-green-600',
    'Digital': 'bg-purple-500/20 text-purple-600',
    'Bank Transfer': 'bg-purple-500/20 text-purple-600'
  };
  return <Badge className={colors[method as keyof typeof colors] || 'bg-gray-500/20 text-gray-500'}>{method}</Badge>;
};

export const getCustomerTier = (points: number) => {
  if (points >= 500) return <Badge className="bg-yellow-500/20 text-yellow-600">Gold</Badge>;
  if (points >= 200) return <Badge className="bg-gray-400/20 text-gray-600">Silver</Badge>;
  return <Badge className="bg-orange-500/20 text-orange-600">Bronze</Badge>;
};

export const getBalanceBadge = (balance: number) => {
  if (balance > 0) return <Badge className="bg-green-500/20 text-green-600">{`Credit: ${formatCurrency(balance)}`}</Badge>;
  if (balance < 0) return <Badge className="bg-red-500/20 text-red-600">{`Debt: ${formatCurrency(Math.abs(balance))}`}</Badge>;
  return <Badge variant="secondary">Settled</Badge>;
};

// Calculation Helpers
export const calculateTotal = (items: Array<{amount?: number, price?: number, quantity?: number}>) => {
  return items.reduce((sum, item) => {
    if (item.amount) return sum + item.amount;
    if (item.price && item.quantity) return sum + (item.price * item.quantity);
    return sum;
  }, 0);
};

export const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const formatCurrency = (amount: number) => {
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Filter Helpers
export const filterBySearch = <T extends Record<string, any>>(
  items: T[], 
  searchTerm: string, 
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm) return items;
  
  return items.filter(item =>
    searchFields.some(field => 
      String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
};

export const filterByCategory = <T extends Record<string, any>>(
  items: T[], 
  category: string, 
  categoryField: keyof T
): T[] => {
  if (category === 'all' || category === 'All') return items;
  return items.filter(item => item[categoryField] === category);
};

export const filterByStatus = <T extends Record<string, any>>(
  items: T[], 
  status: string, 
  statusField: keyof T
): T[] => {
  if (status === 'all') return items;
  return items.filter(item => item[statusField] === status);
};
