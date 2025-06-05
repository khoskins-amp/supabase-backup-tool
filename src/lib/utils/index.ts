import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';
import { format, formatDistanceToNow } from 'date-fns';

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate UUID
export function generateId(): string {
  return uuidv4();
}

// Format file size from bytes to human readable
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Validate Supabase URL format
export function isValidSupabaseUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') || urlObj.hostname.includes('supabase.com');
  } catch {
    return false;
  }
}

// Extract project reference from Supabase URL
export function extractProjectRef(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Handle format: https://project-ref.supabase.co
    if (hostname.includes('.supabase.co')) {
      return hostname.split('.')[0];
    }
    
    // Handle dashboard URL format: https://supabase.com/dashboard/project/project-ref
    if (hostname.includes('supabase.com') && url.includes('/project/')) {
      const match = url.match(/\/project\/([^/?]+)/);
      return match ? match[1] : null;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Generate database URL from project configuration
export function generateDatabaseUrl(projectRef: string, password: string, region = 'us-east-1'): {
  sessionPooler: string;
  directConnection: string;
} {
  const sessionPooler = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const directConnection = `postgresql://postgres.${projectRef}:${password}@db.${projectRef}.supabase.com:5432/postgres`;
  
  return {
    sessionPooler,
    directConnection,
  };
}

// Validate project reference format
export function isValidProjectRef(ref: string): boolean {
  // Supabase project refs are typically 20 character alphanumeric strings
  return /^[a-zA-Z0-9]{20}$/.test(ref);
}

// Create backup file name with timestamp
export function createBackupFileName(projectName: string, type: 'schema' | 'data' | 'full' = 'full'): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${sanitizedName}_${type}_${timestamp}.sql`;
}

// Parse schedule time (HH:MM format)
export function parseScheduleTime(timeString: string): { hours: number; minutes: number } | null {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  
  return { hours, minutes };
}

// Calculate next scheduled backup time
export function calculateNextBackupTime(
  scheduleType: 'daily' | 'weekly' | 'monthly',
  scheduleTime: string,
  scheduleDays?: number[]
): Date | null {
  const time = parseScheduleTime(scheduleTime);
  if (!time) return null;
  
  const now = new Date();
  const next = new Date();
  next.setHours(time.hours, time.minutes, 0, 0);
  
  switch (scheduleType) {
    case 'daily':
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
      
    case 'weekly':
      if (!scheduleDays || scheduleDays.length === 0) return null;
      
      // Find the next occurrence of any of the scheduled days
      for (let i = 0; i < 8; i++) { // Check up to 8 days ahead
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + i);
        checkDate.setHours(time.hours, time.minutes, 0, 0);
        
        if (scheduleDays.includes(checkDate.getDay()) && checkDate > now) {
          return checkDate;
        }
      }
      return null;
      
    case 'monthly':
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
      
    default:
      return null;
  }
}

// Sanitize file path
export function sanitizeFilePath(path: string): string {
  return path.replace(/[<>:"|?*]/g, '_').replace(/\\/g, '/');
}

// Validate backup retention days
export function validateRetentionDays(days: number): boolean {
  return days >= 1 && days <= 365;
}

// Format duration in milliseconds to human readable
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitFor: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), waitFor);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Environment variable helper
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}

// Check if running in browser
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Check if running in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Parse Supabase database URL to extract essential components
export function parseSupabaseDatabaseUrl(databaseUrl: string): {
  projectRef: string | null;
  region: string | null;
  supabaseUrl: string | null;
  isValid: boolean;
  error?: string;
} {
  try {
    const url = new URL(databaseUrl);
    
    // Check if it's a Supabase URL
    if (!url.hostname.includes('supabase.com') && !url.hostname.includes('supabase.co')) {
      return {
        projectRef: null,
        region: null,
        supabaseUrl: null,
        isValid: false,
        error: 'Not a Supabase database URL'
      };
    }

    let projectRef: string | null = null;
    let region: string | null = null;

    // Parse different URL formats
    if (url.hostname.includes('pooler.supabase.com')) {
      // Format: postgres://postgres.PROJECT-REF:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
      // Extract project ref from username
      const username = url.username;
      if (username && username.includes('.')) {
        projectRef = username.split('.')[1];
      }
      
      // Extract region from hostname
      const hostnameParts = url.hostname.split('.');
      if (hostnameParts.length >= 3) {
        const regionPart = hostnameParts[0]; // e.g., "aws-0-us-east-1"
        const regionMatch = regionPart.match(/aws-\d+-(.+)/);
        if (regionMatch) {
          region = regionMatch[1]; // e.g., "us-east-1"
        }
      }
    } else if (url.hostname.includes('supabase.co')) {
      // Format: postgres://postgres:password@db.PROJECT-REF.supabase.co:5432/postgres
      const hostnameParts = url.hostname.split('.');
      if (hostnameParts.length >= 3 && hostnameParts[0] === 'db') {
        projectRef = hostnameParts[1];
        // Direct connections don't specify region in URL, default to us-east-1
        region = 'us-east-1';
      }
    }

    if (!projectRef) {
      return {
        projectRef: null,
        region: null,
        supabaseUrl: null,
        isValid: false,
        error: 'Could not extract project reference from URL'
      };
    }

    // Validate project ref format
    if (!isValidProjectRef(projectRef)) {
      return {
        projectRef,
        region,
        supabaseUrl: null,
        isValid: false,
        error: 'Invalid project reference format'
      };
    }

    // Construct Supabase API URL
    const supabaseUrl = `https://${projectRef}.supabase.co`;

    return {
      projectRef,
      region: region || 'us-east-1', // Default region
      supabaseUrl,
      isValid: true
    };
  } catch (error) {
    return {
      projectRef: null,
      region: null,
      supabaseUrl: null,
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid URL format'
    };
  }
}