// Shared utility functions for LanguagePeer

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${uuidv4()}`;
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `msg_${uuidv4()}`;
}

/**
 * Generate unique user ID
 */
export function generateUserId(): string {
  return `user_${uuidv4()}`;
}

/**
 * Sanitize text content for safe display
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate streak days from session dates
 */
export function calculateStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;
  
  const sortedDates = sessionDates
    .map(date => new Date(date.getFullYear(), date.getMonth(), date.getDate()))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if most recent session was today or yesterday
  const mostRecent = sortedDates[0];
  const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 1) return 0; // Streak broken
  
  // Count consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i];
    const previous = sortedDates[i - 1];
    const diff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Get random topic from available topics
 */
export function getRandomTopic(topics: readonly string[]): string {
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Create standardized error response
 */
export function createErrorResponse(message: string, code?: string) {
  return {
    success: false,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}