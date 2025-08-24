/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return Math.round((value / total) * 100) + '%';
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}

export function formatFileSize(bytes: number): string {
  return formatBytes(bytes);
}

export function formatCompressionRatio(originalSize: number, optimizedSize: number): string {
  const ratio = ((originalSize - optimizedSize) / originalSize) * 100;
  return `${Math.round(ratio)}% smaller`;
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}

/**
 * Format file name with truncation
 */
export function formatFileName(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) return name;

  const extension = name.split('.').pop();
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const maxNameLength = maxLength - (extension ? extension.length + 1 : 0);

  if (maxNameLength <= 0) return name;

  return `${nameWithoutExt.substring(0, maxNameLength)}...${extension ? '.' + extension : ''}`;
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return `${days}d ${remainingHours}h`;
}

/**
 * Format API key for display
 */
export function formatApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  const visibleChars = 8;
  return `${apiKey.substring(0, visibleChars)}...${apiKey.substring(apiKey.length - visibleChars)}`;
}

/**
 * Format subscription plan name
 */
export function formatPlanName(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/**
 * Format subscription status
 */
export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    canceled: 'Canceled',
    past_due: 'Past Due',
    unpaid: 'Unpaid',
  };
  
  return statusMap[status] || status;
}

/**
 * Construct API URL properly by handling trailing slashes
 */
export function buildApiUrl(path: string): string {
  // Check for production backend URL first
  const productionUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 buildApiUrl Debug:', {
      path,
      productionUrl,
      nodeEnv: process.env.NODE_ENV,
      hasProductionUrl: !!productionUrl
    });
  }
  
  // If we're in production and have a backend URL, use it
  if (productionUrl) {
    const cleanBaseUrl = productionUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    // Only add /api prefix if the path doesn't already start with 'api'
    const finalUrl = cleanPath.startsWith('api') 
      ? `${cleanBaseUrl}/${cleanPath}`
      : `${cleanBaseUrl}/api/${cleanPath}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Using production backend:', finalUrl);
    }
    
    return finalUrl;
  }
  
  // For development, use localhost
  const baseUrl = 'http://localhost:5002';
  
  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // If path is empty, just return the base URL
  if (!path || path.trim() === '') {
    return cleanBaseUrl;
  }
  
  // Remove leading slash from path
  const cleanPath = path.replace(/^\//, '');
  
  // Combine baseUrl and path with /api prefix
  const finalUrl = `${cleanBaseUrl}/api/${cleanPath}`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 Using local backend:', finalUrl);
  }
  
  return finalUrl;
} 