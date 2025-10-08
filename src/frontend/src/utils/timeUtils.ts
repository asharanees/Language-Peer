/**
 * Formats duration in seconds to MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats duration in seconds to human-readable format
 */
export const formatDurationHuman = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes === 0) {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
};

/**
 * Converts milliseconds to seconds with decimal precision
 */
export const msToSeconds = (milliseconds: number, precision: number = 1): number => {
  return Number((milliseconds / 1000).toFixed(precision));
};

/**
 * Converts seconds to milliseconds
 */
export const secondsToMs = (seconds: number): number => {
  return seconds * 1000;
};

/**
 * Formats timestamp to readable time
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};