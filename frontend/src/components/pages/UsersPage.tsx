import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Plus, Search, Edit, Trash2, UserCheck, Shield, Users } from 'lucide-react';
import type { BackendRole, BackendUser, RegistrationRole } from '../../services/api';
import { getStatusBadge } from '../utils/helpers';

const roles: Array<{ value: BackendRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'inventory_clerk', label: 'Storekeeper' },
  { value: 'viewer', label: 'Viewer' }
];
const permissions = ['sales', 'inventory', 'customers', 'suppliers', 'reports', 'settings', 'users'];

interface UsersPageProps {
  users: BackendUser[];
  onCreateUser: (user: { username: string; email: string; password: string; role: RegistrationRole | BackendRole }) => Promise<void>;
  onUpdateUser: (userId: number, data: { role?: BackendRole; is_active?: boolean }) => Promise<void>;
  onDeactivateUser: (userId: number) => Promise<void>;
}

const roleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: 'Admin',
    accountant: 'Accountant',
    manager: 'Manager',
    cashier: 'Cashier',
    inventory_clerk: 'Storekeeper',
    storekeeper: 'Storekeeper',
    viewer: 'Viewer',
    super_admin: 'Super Admin',
    customer: 'Customer'
  };
  return labels[role] || role;
};

export function UsersPage({ users, onCreateUser, onUpdateUser, onDeactivateUser }: UsersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cashier' as RegistrationRole | BackendRole
  });
  const [editForm, setEditForm] = useState({
    role: 'cashier' as BackendRole,
    is_active: true
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      'Admin': 'bg-green-500/20 text-green-600',
      'Super Admin': 'bg-red-500/20 text-red-600',
      'Accountant': 'bg-yellow-500/20 text-yellow-700',
      'Manager': 'bg-blue-500/20 text-blue-600',
      'Cashier': 'bg-green-500/20 text-green-600',
      'Storekeeper': 'bg-purple-500/20 text-purple-600',
      'Customer': 'bg-gray-500/20 text-gray-500'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[role as keyof typeof colors] || 'bg-gray-500/20 text-gray-500'}`}>{role}</span>;
  };

  const resetNewUser = () => {
    setNewUser({ username: '', email: '', password: '', role: 'cashier' });
    setFormError('');
  };

  const handleCreateUser = async () => {
    setFormError('');
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password) {
      setFormError('Enter username, email, and password.');
      return;
    }

    setIsSaving(true);
    try {
      await onCreateUser({
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role
      });
      resetNewUser();
      setIsAddDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'User could not be created.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (user: BackendUser) => {
    setEditingUser(user);
    setEditForm({
      role: user.role as BackendRole,
      is_active: user.is_active
    });
    setFormError('');
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    setFormError('');
    try {
      await onUpdateUser(editingUser.id, editForm);
      setEditingUser(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'User could not be updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateUser = async (user: BackendUser) => {
    setFormError('');
    try {
      await onDeactivateUser(user.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'User could not be deactivated.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-500">Manage staff accounts, roles, and permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetNewUser();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} type="email" className="bg-gray-100 border-gray-200 text-gray-900" />
              <Input placeholder="Temporary password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} type="password" className="bg-gray-100 border-gray-200 text-gray-900" />
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as BackendRole })}>
                <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 border-gray-200">
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <label className="text-gray-600 text-sm">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {permissions.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox id={permission} />
                      <label htmlFor={permission} className="text-sm text-gray-600 capitalize">
                        {permission}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCreateUser} disabled={isSaving}>
                  {isSaving ? 'Adding...' : 'Add User'}
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">{editingUser?.username}</p>
              <p className="text-sm text-gray-500">{editingUser?.email}</p>
            </div>
            <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as BackendRole })}>
              <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-100 border-gray-200">
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox id="edit-active" checked={editForm.is_active} onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked === true })} />
              <label htmlFor="edit-active" className="text-sm text-gray-600">Active account</label>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUpdateUser} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
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
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Administrators</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Managers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role === 'manager').length}
                </p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Search className="w-6 h-6 text-purple-600" />
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
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-100 border-gray-200 text-gray-900"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-gray-100 border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-100 border-gray-200">
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Staff Members ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Name</TableHead>
                <TableHead className="text-gray-600">Email</TableHead>
                <TableHead className="text-gray-600">Role</TableHead>
                <TableHead className="text-gray-600">Last Login</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id} className="border-gray-200">
                  <TableCell className="text-gray-900 font-medium">{user.username}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(roleLabel(user.role))}</TableCell>
                  <TableCell className="text-gray-600">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</TableCell>
                  <TableCell>{getStatusBadge(user.is_active ? 'active' : 'inactive')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-300" onClick={() => openEditDialog(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-300" onClick={() => handleDeactivateUser(user)}>
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
