// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  apiKey: string;
  subscription: Subscription;
  usage: Usage;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface Usage {
  monthlyImages: number;
  monthlyBandwidth: number;
  lastResetDate: string;
}

// Image types
export interface Image {
  id: string;
  user: string;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  optimizedSize: number;
  optimizedFormat: string;
  compressionRatio: number;
  quality: number;
  dimensions: {
    original: {
      width: number;
      height: number;
    };
    optimized: {
      width: number;
      height: number;
    };
  };
  downloadUrl: string;
  expiresAt: string;
  metadata?: {
    preserved: boolean;
    exif?: any;
    iptc?: any;
    xmp?: any;
  };
  processingTime: number;
  status: 'processing' | 'completed' | 'failed';
  error?: {
    message: string;
    code: string;
  };
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  lastDownloaded?: string;
  createdAt: string;
  updatedAt: string;
}

// Optimization result types
export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  downloadUrl: string;
  expiresAt: string;
  format: string;
  dimensions: {
    original: {
      width: number;
      height: number;
    };
    optimized: {
      width: number;
      height: number;
    };
  };
  processingTime: number;
}

export interface BatchOptimizationResult {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  results: Array<{
    originalName: string;
    success: boolean;
    originalSize?: number;
    optimizedSize?: number;
    compressionRatio?: number;
    downloadUrl?: string;
    expiresAt?: string;
    format?: string;
    dimensions?: {
      original: {
        width: number;
        height: number;
      };
      optimized: {
        width: number;
        height: number;
      };
    };
    processingTime?: number;
    error?: string;
  }>;
}

// Statistics types
export interface UserStats {
  usage: {
    monthlyImages: number;
    monthlyBandwidth: number;
    planLimit: number;
    remainingImages: number;
    lastResetDate: string;
  };
  subscription: {
    plan: string;
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  };
  statistics: {
    period: string;
    startDate: string;
    endDate: string;
    totalImages: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    totalSizeSaved: number;
    averageCompressionRatio: number;
    totalDownloads: number;
  };
}

// Subscription plan types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number | null;
  priceId: string | null;
  features: string[];
  limits: {
    images: number;
    maxFileSize: number;
  };
}

// File upload types
export interface FileUpload {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: OptimizationResult;
  error?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  company?: string;
}

export interface OptimizationSettings {
  quality: number;
  format: 'auto' | 'jpeg' | 'png' | 'webp';
  preserveMetadata: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

// Pagination types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Admin types
export interface AdminDashboard {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    newThisWeek: number;
  };
  subscriptions: Array<{
    _id: string;
    count: number;
    activeCount: number;
  }>;
  images: {
    totalImages: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    totalSizeSaved: number;
    averageCompressionRatio: number;
    totalDownloads: number;
  };
  dailyStats: Array<{
    _id: string;
    count: number;
    totalSizeSaved: number;
    averageCompressionRatio: number;
  }>;
  storage: {
    fileCount: number;
    totalSize: number;
    bucket: string;
    region: string;
  };
}

// Error types
export interface ApiError {
  error: string;
  code: string;
  details?: any;
}

// Component props types
export interface LayoutProps {
  children: React.ReactNode;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  help?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
}

// Chart types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Theme types
export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
}

// Settings types
export interface UserSettings {
  defaultQuality: number;
  preserveMetadata: boolean;
  autoOptimize: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
  };
}

// Webhook types
export interface StripeWebhook {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: any;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string | null;
  };
  type: string;
} 