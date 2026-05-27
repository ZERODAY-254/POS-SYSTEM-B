import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { registerAccount } from '../../services/api';
import type { LoginResult, RegistrationRole } from '../../services/api';

interface LoginPageProps {
  onLogin: (username: string, password: string, role: UserRole) => Promise<LoginResult>;
  onVerifyTwoFactor: (username: string, code: string, role: UserRole) => Promise<LoginResult>;
}

export function LoginPage({ onLogin, onVerifyTwoFactor }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const selectedRole: UserRole = 'admin';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createRole, setCreateRole] = useState<RegistrationRole>('cashier');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createMessage, setCreateMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      const result = await onLogin(email, password, selectedRole);
      if (result.twoFactorRequired) {
        if (!result.verificationCode) {
          throw new Error('Login requires verification, but no verification code was returned.');
        }

        await onVerifyTwoFactor(email, result.verificationCode, selectedRole);
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '';
      setLoginError(message || 'Unable to sign in. Check your backend server and credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(`Password reset link sent to ${resetEmail}`);
    setTimeout(() => {
      setIsResetOpen(false);
      setResetEmail('');
      setResetMessage('');
    }, 2000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateMessage('');

    if (createPassword !== confirmPassword) {
      setCreateError('Passwords do not match.');
      return;
    }

    setIsCreatingAccount(true);

    try {
      await registerAccount({
        username: createUsername.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: createRole
      });

      setEmail(createUsername.trim());
      setPassword('');
      setCreateMessage('Account created. Sign in with your new password.');
      setCreateUsername('');
      setCreateEmail('');
      setCreatePassword('');
      setConfirmPassword('');
      setCreateRole('cashier');
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateMessage('');
      }, 1600);
    } catch (error) {
      console.error(error);
      setCreateError(error instanceof Error ? error.message : 'Account could not be created.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">SALES ENTRY & RECEIPT MANAGEMENT SYSTEM</CardTitle>
          <p className="text-gray-500">Enter your credentials to access the dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-100 border-gray-200 text-gray-900"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-100 border-gray-200 text-gray-900"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogTrigger asChild>
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-200">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Email Address</label>
                      <Input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="bg-gray-100 border-gray-200"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    {resetMessage && (
                      <p className="text-sm text-green-600">{resetMessage}</p>
                    )}
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Send Reset Link
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
          </form>

          <div className="mt-6 text-center">
            <div className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="text-blue-600 hover:text-blue-700">
                    Create account
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-200">
                  <DialogHeader>
                    <DialogTitle>Create Account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Username</label>
                      <Input
                        type="text"
                        value={createUsername}
                        onChange={(e) => setCreateUsername(e.target.value)}
                        className="bg-gray-100 border-gray-200"
                        placeholder="Choose a username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <Input
                        type="email"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        className="bg-gray-100 border-gray-200"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <select
                        value={createRole}
                        onChange={(e) => setCreateRole(e.target.value as RegistrationRole)}
                        className="w-full h-10 rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-900"
                      >
                        <option value="admin">Admin</option>
                        <option value="accountant">Accountant</option>
                        <option value="cashier">Cashier</option>
                        <option value="storekeeper">Storekeeper</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Password</label>
                      <Input
                        type="password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="bg-gray-100 border-gray-200"
                        placeholder="Create a password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Confirm Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-gray-100 border-gray-200"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    {createError && (
                      <p className="text-sm text-red-600">{createError}</p>
                    )}
                    {createMessage && (
                      <p className="text-sm text-green-600">{createMessage}</p>
                    )}
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isCreatingAccount}>
                      {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-xs">
              © 2026 Sales Entry & Receipt Management System. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
