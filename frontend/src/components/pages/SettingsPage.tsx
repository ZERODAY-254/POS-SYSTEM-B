import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Barcode, Bell, Building, CreditCard, Database, FileText, Globe, Percent, QrCode, ScanBarcode, Settings, Shield } from 'lucide-react';
import { TaxConfig } from '../TaxConfig';
import { getStoredAppSettings, saveAppSettings } from '../../services/settings';
import { loadAppSettings, saveBackendAppSettings } from '../../services/api';

export function SettingsPage() {
  const savedSettings = getStoredAppSettings();
  const [businessInfo, setBusinessInfo] = useState(savedSettings.businessInfo);
  const [invoiceSettings, setInvoiceSettings] = useState(savedSettings.invoiceSettings);
  const [paymentMethods, setPaymentMethods] = useState(savedSettings.paymentMethods);
  const [posSettings, setPosSettings] = useState(savedSettings.posSettings);
  const [systemSettings, setSystemSettings] = useState(savedSettings.systemSettings);
  const [securitySettings, setSecuritySettings] = useState(savedSettings.securitySettings);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    loadAppSettings()
      .then((backendSettings) => {
        if (!isMounted) return;
        const backendSettingsObject = (backendSettings && typeof backendSettings === 'object') ? backendSettings : {};
        const mergedSettings = {
          ...getStoredAppSettings(),
          ...backendSettingsObject
        };
        setBusinessInfo(mergedSettings.businessInfo);
        setInvoiceSettings(mergedSettings.invoiceSettings);
        setPaymentMethods(mergedSettings.paymentMethods);
        setPosSettings(mergedSettings.posSettings);
        setSystemSettings(mergedSettings.systemSettings);
        setSecuritySettings(mergedSettings.securitySettings);
        saveAppSettings(mergedSettings);
      })
      .catch((error) => {
        console.warn('Settings API unavailable, using local settings.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveSettings = async (message: string) => {
    const nextSettings = {
      ...getStoredAppSettings(),
      businessInfo,
      invoiceSettings,
      paymentMethods,
      posSettings,
      systemSettings,
      securitySettings
    };

    saveAppSettings(nextSettings);

    try {
      await saveBackendAppSettings(nextSettings);
      setSavedMessage(`${message} Saved to database.`);
    } catch (error) {
      console.warn('Unable to save settings to backend. Local settings were saved.', error);
      setSavedMessage(`${message} Saved locally; database is unavailable.`);
    }

    window.setTimeout(() => setSavedMessage(''), 2500);
  };

  const updatePaymentMethod = (index: number, enabled: boolean) => {
    setPaymentMethods(previousMethods => previousMethods.map((method, methodIndex) =>
      methodIndex === index ? { ...method, enabled } : method
    ));
  };

  const planOptions = [
    { level: 'Basic', features: ['Single Payment', 'Basic Reporting', 'Single Store'], cashiers: 5, className: 'border-blue-200 bg-blue-50 text-blue-900' },
    { level: 'Standard', features: ['Multi Payment', 'Inventory Tracking', 'Customer Management'], cashiers: 15, className: 'border-green-200 bg-green-50 text-green-900' },
    { level: 'Advanced', features: ['All Standard Features', 'Advanced Analytics', 'Discount Management'], cashiers: 50, className: 'border-purple-200 bg-purple-50 text-purple-900' },
    { level: 'Enterprise', features: ['Multiple Stores', 'Advanced Analytics', 'API Access', 'Custom Reports'], cashiers: 'Unlimited', className: 'border-red-200 bg-red-50 text-red-900' }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-500">Configure your POS system preferences and business information</p>
        {savedMessage && <p className="mt-2 text-sm font-medium text-green-600">{savedMessage}</p>}
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-white border-gray-200">
          <TabsTrigger value="business" className="data-[state=active]:bg-blue-600">Business Info</TabsTrigger>
          <TabsTrigger value="invoice" className="data-[state=active]:bg-blue-600">Invoice Settings</TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-blue-600">Payment Methods</TabsTrigger>
          <TabsTrigger value="pos" className="data-[state=active]:bg-blue-600">POS Config</TabsTrigger>
          <TabsTrigger value="tax" className="data-[state=active]:bg-blue-600">Taxes</TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-blue-600">System</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Business Name</label>
                  <Input value={businessInfo.name} onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Email</label>
                  <Input type="email" value={businessInfo.email} onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Phone</label>
                  <Input value={businessInfo.phone} onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Tax ID</label>
                  <Input value={businessInfo.taxId} onChange={(e) => setBusinessInfo({ ...businessInfo, taxId: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-2">Address</label>
                <Textarea value={businessInfo.address} onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              </div>
              <Button onClick={() => saveSettings('Business information saved.')} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Invoice Prefix</label>
                  <Input value={invoiceSettings.prefix} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Starting Number</label>
                  <Input value={invoiceSettings.startingNumber} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, startingNumber: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Tax Rate (%)</label>
                  <Input value={invoiceSettings.taxRate} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, taxRate: e.target.value })} type="number" className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Payment Terms (Days)</label>
                  <Input value={invoiceSettings.paymentTerms} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, paymentTerms: e.target.value })} type="number" className="bg-gray-100 border-gray-200 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-2">Invoice Footer Note</label>
                <Textarea value={invoiceSettings.footerNote} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerNote: e.target.value })} className="bg-gray-100 border-gray-200 text-gray-900" />
              </div>
              <Button onClick={() => saveSettings('Invoice settings saved.')} className="bg-blue-600 hover:bg-blue-700 text-white">Save Invoice Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentMethods.map((method, index) => (
                <div key={method.name} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                  <div>
                    <h4 className="text-gray-900 font-medium">{method.name}</h4>
                    <p className="text-gray-500 text-sm">{method.description}</p>
                  </div>
                  <Switch checked={method.enabled} onCheckedChange={(checked) => updatePaymentMethod(index, checked)} />
                </div>
              ))}
              <Button onClick={() => saveSettings('Payment settings saved.')} className="bg-blue-600 hover:bg-blue-700 text-white">Save Payment Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                POS Configuration Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planOptions.map((plan) => (
                  <button
                    key={plan.level}
                    type="button"
                    onClick={() => setPosSettings({ ...posSettings, level: plan.level })}
                    className={`rounded-lg border-2 p-4 text-left ${plan.className} ${posSettings.level === plan.level ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-bold">{plan.level}</h4>
                      <Badge variant="outline">Up to {plan.cashiers} cashiers</Badge>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="text-sm flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <Separator className="bg-gray-200" />

              <div className="space-y-3">
                <h4 className="text-gray-900 font-medium">POS Devices & Receipt Codes</h4>
                <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <ScanBarcode className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-gray-900">Enable barcode scanner input in POS</p>
                      <p className="text-gray-500 text-sm">Scan or type SKU/barcode values to add products to the cart.</p>
                    </div>
                  </div>
                  <Switch checked={posSettings.scannerEnabled} onCheckedChange={(checked) => setPosSettings({ ...posSettings, scannerEnabled: checked })} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <Barcode className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-gray-900">Print barcode on receipt</p>
                      <p className="text-gray-500 text-sm">Adds a transaction barcode to every receipt.</p>
                    </div>
                  </div>
                  <Switch checked={posSettings.receiptBarcodeEnabled} onCheckedChange={(checked) => setPosSettings({ ...posSettings, receiptBarcodeEnabled: checked })} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-gray-900">Print QR code on receipt</p>
                      <p className="text-gray-500 text-sm">Adds a transaction reference block to receipts.</p>
                    </div>
                  </div>
                  <Switch checked={posSettings.receiptQrEnabled} onCheckedChange={(checked) => setPosSettings({ ...posSettings, receiptQrEnabled: checked })} />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">Select your POS configuration level to unlock features that match your business needs.</p>
              </div>
              <Button onClick={() => saveSettings('POS settings saved.')} className="bg-blue-600 hover:bg-blue-700 text-white">Save POS Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Tax Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaxConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Currency</label>
                  <Select value={systemSettings.currency} onValueChange={(value) => setSystemSettings({ ...systemSettings, currency: value })}>
                    <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Language</label>
                  <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings({ ...systemSettings, language: value })}>
                    <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Timezone</label>
                  <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}>
                    <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Date Format</label>
                  <Select value={systemSettings.dateFormat} onValueChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}>
                    <SelectTrigger className="bg-gray-100 border-gray-200 text-gray-900"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-4">
                <h4 className="text-gray-900 font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">Email Notifications</p>
                      <p className="text-gray-500 text-sm">Receive email alerts for important events</p>
                    </div>
                    <Switch checked={systemSettings.emailNotifications} onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, emailNotifications: checked })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">Low Stock Alerts</p>
                      <p className="text-gray-500 text-sm">Get notified when items are running low</p>
                    </div>
                    <Switch checked={systemSettings.lowStockAlerts} onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, lowStockAlerts: checked })} />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-4">
                <h4 className="text-gray-900 font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Management
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Automatic Backup</p>
                    <p className="text-gray-500 text-sm">Automatically backup data daily</p>
                  </div>
                  <Switch checked={systemSettings.autoBackup} onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })} />
                </div>
              </div>

              <Button onClick={() => saveSettings('System settings saved.')} className="bg-blue-600 hover:bg-blue-700 text-white">Save System Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-gray-900 font-medium">Password Policy</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Require password change every 90 days</span>
                    <Switch checked={securitySettings.passwordChangeRequired} onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordChangeRequired: checked })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Minimum 8 characters</span>
                    <Switch checked={securitySettings.minimumCharacters} onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, minimumCharacters: checked })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Require special characters</span>
                    <Switch checked={securitySettings.specialCharactersRequired} onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, specialCharactersRequired: checked })} />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-4">
                <h4 className="text-gray-900 font-medium">Session Management</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm mb-2">Session Timeout (minutes)</label>
                    <Input value={securitySettings.sessionTimeout} onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })} type="number" className="bg-gray-100 border-gray-200 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm mb-2">Max Login Attempts</label>
                    <Input value={securitySettings.maxLoginAttempts} onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })} type="number" className="bg-gray-100 border-gray-200 text-gray-900" />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-4">
                <h4 className="text-gray-900 font-medium">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Enable 2FA for all users</p>
                    <p className="text-gray-500 text-sm">Require two-factor authentication for enhanced security</p>
                  </div>
                  <Switch checked={securitySettings.twoFactorRequired} onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorRequired: checked })} />
                </div>
              </div>

              <Button onClick={() => saveSettings('Security settings saved.')} className="bg-blue-600 hover:bg-blue-700 text-white">Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
