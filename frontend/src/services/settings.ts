export interface AppSettings {
  [key: string]: any;
  businessInfo: {
    [key: string]: any;
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
  };
  invoiceSettings: {
    [key: string]: any;
  };
  paymentMethods: Array<{
    [key: string]: any;
    name: string;
    description: string;
    enabled: boolean;
  }>;
  business: {
    [key: string]: any;
    name: string;
    address: string;
    phone: string;
    email: string;
    taxPin: string;
  };
  posSettings: {
    [key: string]: any;
    scannerEnabled: boolean;
    receiptFooter: string;
    defaultTaxRate: number;
  };
  paymentSettings: {
    [key: string]: any;
    mpesaEnabled: boolean;
    cashEnabled: boolean;
    cardEnabled: boolean;
  };
}

const SETTINGS_KEY = 'pos_app_settings';

export const defaultAppSettings: AppSettings = {
  businessInfo: {
    name: 'SALES MANAGEMENT SYSTEM',
    address: '',
    phone: '0798550825',
    email: '',
    taxId: ''
  },
  invoiceSettings: {
    prefix: 'INV',
    startingNumber: '1001',
    taxRate: '0',
    paymentTerms: '7',
    footerNote: 'Thank you for your business.'
  },
  paymentMethods: [
    {
      name: 'Cash',
      description: 'Accept cash payments at the counter.',
      enabled: true
    },
    {
      name: 'M-Pesa - SALES MANAGEMENT SYSTEM',
      description: 'Till/paybill phone: 0798550825',
      enabled: true
    },
    {
      name: 'Card',
      description: 'Accept card payments.',
      enabled: true
    }
  ],
  business: {
    name: 'SALES MANAGEMENT SYSTEM',
    address: '',
    phone: '0798550825',
    email: '',
    taxPin: ''
  },
  posSettings: {
    scannerEnabled: true,
    receiptFooter: 'Thank you for your business.',
    defaultTaxRate: 0
  },
  paymentSettings: {
    mpesaEnabled: true,
    cashEnabled: true,
    cardEnabled: true
  },
  systemSettings: {
    currency: 'KES',
    language: 'English',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    emailNotifications: true,
    lowStockAlerts: true,
    autoBackup: true
  },
  securitySettings: {
    passwordChangeRequired: false,
    minimumCharacters: true,
    specialCharactersRequired: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    twoFactorRequired: false
  }
};

export function getStoredAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultAppSettings;
    const stored = JSON.parse(raw);
    const merged = { ...defaultAppSettings, ...stored };
    merged.businessInfo = { ...defaultAppSettings.businessInfo, ...stored.businessInfo };
    merged.business = { ...defaultAppSettings.business, ...stored.business };
    merged.invoiceSettings = { ...defaultAppSettings.invoiceSettings, ...stored.invoiceSettings };
    merged.posSettings = { ...defaultAppSettings.posSettings, ...stored.posSettings };
    merged.paymentSettings = { ...defaultAppSettings.paymentSettings, ...stored.paymentSettings };
    merged.systemSettings = { ...defaultAppSettings.systemSettings, ...stored.systemSettings };
    merged.securitySettings = { ...defaultAppSettings.securitySettings, ...stored.securitySettings };
    merged.paymentMethods = stored.paymentMethods || defaultAppSettings.paymentMethods;
    return merged;
  } catch {
    return defaultAppSettings;
  }
}

export function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('pos:settings-changed'));
}
