import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Percent } from 'lucide-react';

export interface TaxConfiguration {
  id: string;
  name: string;
  percentage: number;
  description: string;
  active: boolean;
}

interface TaxConfigProps {
  onSave?: (taxes: TaxConfiguration[]) => void;
}

export function TaxConfig({ onSave }: TaxConfigProps) {
  const [taxes, setTaxes] = useState<TaxConfiguration[]>([
    {
      id: '1',
      name: 'Standard VAT',
      percentage: 10,
      description: 'Standard Value Added Tax',
      active: true
    },
    {
      id: '2',
      name: 'Luxury Tax',
      percentage: 15,
      description: 'Applied to premium products',
      active: true
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    percentage: 0,
    description: ''
  });

  const resetForm = () => {
    setFormData({ name: '', percentage: 0, description: '' });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.percentage < 0 || formData.percentage > 100) {
      alert('Please fill all fields correctly');
      return;
    }

    if (editingId) {
      setTaxes(taxes.map(t => t.id === editingId ? {
        ...t,
        ...formData
      } : t));
    } else {
      const newTax: TaxConfiguration = {
        id: Date.now().toString(),
        ...formData,
        active: true
      };
      setTaxes([...taxes, newTax]);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (tax: TaxConfiguration) => {
    setFormData({
      name: tax.name,
      percentage: tax.percentage,
      description: tax.description
    });
    setEditingId(tax.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this tax configuration?')) {
      setTaxes(taxes.filter(t => t.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setTaxes(taxes.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const handleSave = () => {
    onSave?.(taxes);
    alert('Tax configurations saved!');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Tax Configurations</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => resetForm()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tax
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Tax' : 'Add New Tax'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Tax Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., VAT, Sales Tax"
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Percentage</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) })}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    max="100"
                    className="pr-8 bg-white border-gray-300"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update Tax' : 'Add Tax'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {taxes.map(tax => (
          <Card key={tax.id} className="border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{tax.name}</h4>
                    <Badge variant={tax.active ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                      {tax.percentage}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{tax.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(tax.id)}
                  >
                    {tax.active ? 'Active' : 'Inactive'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(tax)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(tax.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={handleSave}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        Save Tax Configuration
      </Button>
    </div>
  );
}
