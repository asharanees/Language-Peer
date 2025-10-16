"use strict";
// Shared utility functions for LanguagePeer
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSessionId = generateSessionId;
exports.generateMessageId = generateMessageId;
exports.generateUserId = generateUserId;
exports.sanitizeText = sanitizeText;
exports.calculateStreak = calculateStreak;
exports.getRandomTopic = getRandomTopic;
exports.createErrorResponse = createErrorResponse;
exports.createSuccessResponse = createSuccessResponse;
exports.formatDuration = formatDuration;
exports.isValidEmail = isValidEmail;
exports.debounce = debounce;
exports.throttle = throttle;
exports.deepClone = deepClone;
const uuid_1 = require("uuid");
/**
 * Generate unique session ID
 */
function generateSessionId() {
    return `session_${(0, uuid_1.v4)()}`;
}
/**
 * Generate unique message ID
 */
function generateMessageId() {
    return `msg_${(0, uuid_1.v4)()}`;
}
/**
 * Generate unique user ID
 */
function generateUserId() {
    return `user_${(0, uuid_1.v4)()}`;
}
/**
 * Sanitize text content for safe display
 */
function sanitizeText(text) {
    return text
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}
/**
 * Calculate streak days from session dates
 */
function calculateStreak(sessionDates) {
    if (sessionDates.length === 0)
        return 0;
    const sortedDates = sessionDates
        .map(date => new Date(date.getFullYear(), date.getMonth(), date.getDate()))
        .sort((a, b) => b.getTime() - a.getTime());
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Check if most recent session was today or yesterday
    const mostRecent = sortedDates[0];
    const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1)
        return 0; // Streak broken
    // Count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
        const current = sortedDates[i];
        const previous = sortedDates[i - 1];
        const diff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
            streak++;
        }
        else {
            break;
        }
    }
    return streak;
}
/**
 * Get random topic from available topics
 */
function getRandomTopic(topics) {
    return topics[Math.floor(Math.random() * topics.length)];
}
/**
 * Create standardized error response
 */
function createErrorResponse(message, code) {
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
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString()
    };
}
/**
 * Format duration in milliseconds to human readable string
 */
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Debounce function calls
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Throttle function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
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
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
}
