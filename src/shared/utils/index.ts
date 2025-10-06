// Shared utility functions for LanguagePeer

import { LanguageLevel, DifficultyLevel } from '../types';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${randomStr}`;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `msg_${timestamp}_${randomStr}`;
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `user_${timestamp}_${randomStr}`;
}

/**
 * Convert language level to numeric value for calculations
 */
export function languageLevelToNumber(level: LanguageLevel): number {
  const levelMap: Record<LanguageLevel, number> = {
    'beginner': 1,
    'elementary': 2,
    'intermediate': 3,
    'upper-intermediate': 4,
    'advanced': 5,
    'proficient': 6
  };
  return levelMap[level];
}

/**
 * Convert numeric value back to language level
 */
export function numberToLanguageLevel(num: number): LanguageLevel {
  const levels: LanguageLevel[] = [
    'beginner', 'elementary', 'intermediate', 
    'upper-intermediate', 'advanced', 'proficient'
  ];
  const index = Math.max(0, Math.min(levels.length - 1, Math.floor(num) - 1));
  return levels[index];
}

/**
 * Calculate difficulty adjustment based on user performance
 */
export function calculateDifficultyAdjustment(
  currentLevel: LanguageLevel,
  recentPerformance: number[]
): DifficultyLevel {
  if (recentPerformance.length === 0) return 'medium';
  
  const avgPerformance = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
  const levelNum = languageLevelToNumber(currentLevel);
  
  // Adjust based on performance and current level
  if (avgPerformance > 0.8 && levelNum >= 3) return 'hard';
  if (avgPerformance < 0.5 || levelNum <= 2) return 'easy';
  return 'medium';
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
 * Calculate confidence score from multiple metrics
 */
export function calculateConfidenceScore(metrics: {
  transcriptionConfidence?: number;
  grammarScore?: number;
  fluencyScore?: number;
  vocabularyScore?: number;
}): number {
  const scores = [
    metrics.transcriptionConfidence || 0,
    metrics.grammarScore || 0,
    metrics.fluencyScore || 0,
    metrics.vocabularyScore || 0
  ].filter(score => score > 0);
  
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Sanitize text for safe processing
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a random topic from predefined list
 */
export function getRandomTopic(): string {
  const topics = [
    'Travel and Culture',
    'Food and Cooking',
    'Hobbies and Interests',
    'Work and Career',
    'Family and Friends',
    'Technology and Innovation',
    'Health and Fitness',
    'Entertainment and Media',
    'Education and Learning',
    'Environment and Nature'
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Calculate streak days from session dates
 */
export function calculateStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;
  
  // Sort dates in descending order
  const sortedDates = sessionDates
    .map(date => new Date(date.getFullYear(), date.getMonth(), date.getDate()))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  for (const sessionDate of sortedDates) {
    const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }
  
  return streak;
}

/**
 * Validate AWS region format
 */
export function isValidAwsRegion(region: string): boolean {
  const regionRegex = /^[a-z]{2}-[a-z]+-\d{1}$/;
  return regionRegex.test(region);
}

/**
 * Create error response object
 */
export function createErrorResponse(message: string, code?: string) {
  return {
    error: true,
    message,
    code: code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };
}

/**
 * Create success response object
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message: message || 'Operation completed successfully',
    timestamp: new Date().toISOString()
  };
}