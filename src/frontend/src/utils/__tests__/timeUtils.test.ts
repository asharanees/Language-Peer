import {
  formatDuration,
  formatDurationHuman,
  msToSeconds,
  secondsToMs,
  formatTimestamp
} from '../timeUtils';

describe('timeUtils', () => {
  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(30)).toBe('00:30');
      expect(formatDuration(60)).toBe('01:00');
      expect(formatDuration(90)).toBe('01:30');
      expect(formatDuration(3661)).toBe('61:01'); // 1 hour 1 minute 1 second
    });

    it('handles decimal seconds', () => {
      expect(formatDuration(30.7)).toBe('00:30');
      expect(formatDuration(90.9)).toBe('01:30');
    });

    it('handles large durations', () => {
      expect(formatDuration(7200)).toBe('120:00'); // 2 hours
      expect(formatDuration(3665)).toBe('61:05'); // 1 hour 1 minute 5 seconds
    });
  });

  describe('formatDurationHuman', () => {
    it('formats seconds only', () => {
      expect(formatDurationHuman(0)).toBe('0 seconds');
      expect(formatDurationHuman(1)).toBe('1 second');
      expect(formatDurationHuman(30)).toBe('30 seconds');
      expect(formatDurationHuman(59)).toBe('59 seconds');
    });

    it('formats minutes only', () => {
      expect(formatDurationHuman(60)).toBe('1 minute');
      expect(formatDurationHuman(120)).toBe('2 minutes');
      expect(formatDurationHuman(300)).toBe('5 minutes');
    });

    it('formats minutes and seconds', () => {
      expect(formatDurationHuman(61)).toBe('1 minute 1 second');
      expect(formatDurationHuman(90)).toBe('1 minute 30 seconds');
      expect(formatDurationHuman(125)).toBe('2 minutes 5 seconds');
      expect(formatDurationHuman(3661)).toBe('61 minutes 1 second');
    });

    it('handles decimal seconds', () => {
      expect(formatDurationHuman(30.7)).toBe('30 seconds');
      expect(formatDurationHuman(90.9)).toBe('1 minute 30 seconds');
    });
  });

  describe('msToSeconds', () => {
    it('converts milliseconds to seconds with default precision', () => {
      expect(msToSeconds(1000)).toBe(1.0);
      expect(msToSeconds(1500)).toBe(1.5);
      expect(msToSeconds(2750)).toBe(2.8);
    });

    it('converts with custom precision', () => {
      expect(msToSeconds(1234, 0)).toBe(1);
      expect(msToSeconds(1234, 1)).toBe(1.2);
      expect(msToSeconds(1234, 2)).toBe(1.23);
      expect(msToSeconds(1234, 3)).toBe(1.234);
    });

    it('handles zero and negative values', () => {
      expect(msToSeconds(0)).toBe(0.0);
      expect(msToSeconds(-1000)).toBe(-1.0);
    });
  });

  describe('secondsToMs', () => {
    it('converts seconds to milliseconds', () => {
      expect(secondsToMs(0)).toBe(0);
      expect(secondsToMs(1)).toBe(1000);
      expect(secondsToMs(1.5)).toBe(1500);
      expect(secondsToMs(60)).toBe(60000);
    });

    it('handles decimal seconds', () => {
      expect(secondsToMs(0.1)).toBe(100);
      expect(secondsToMs(0.001)).toBe(1);
      expect(secondsToMs(2.5)).toBe(2500);
    });

    it('handles negative values', () => {
      expect(secondsToMs(-1)).toBe(-1000);
      expect(secondsToMs(-0.5)).toBe(-500);
    });
  });

  describe('formatTimestamp', () => {
    it('formats timestamp correctly', () => {
      // Create a specific date for consistent testing
      const date = new Date('2023-12-25T14:30:45.123Z');
      const timestamp = date.getTime();
      
      const formatted = formatTimestamp(timestamp);
      
      // The exact format depends on locale, but should include time components
      expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('handles different timestamps', () => {
      const morning = new Date('2023-12-25T09:15:30.000Z').getTime();
      const evening = new Date('2023-12-25T21:45:00.000Z').getTime();
      
      const morningFormatted = formatTimestamp(morning);
      const eveningFormatted = formatTimestamp(evening);
      
      expect(morningFormatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      expect(eveningFormatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      expect(morningFormatted).not.toBe(eveningFormatted);
    });

    it('handles current timestamp', () => {
      const now = Date.now();
      const formatted = formatTimestamp(now);
      
      expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      expect(typeof formatted).toBe('string');
    });

    it('handles edge cases', () => {
      // Test with epoch time
      const epoch = formatTimestamp(0);
      expect(epoch).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      
      // Test with future timestamp
      const future = formatTimestamp(Date.now() + 86400000); // +1 day
      expect(future).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe('edge cases and error handling', () => {
    it('handles NaN and Infinity', () => {
      expect(formatDuration(NaN)).toBe('NaN:NaN');
      expect(formatDuration(Infinity)).toBe('Infinity:NaN');
      
      expect(formatDurationHuman(NaN)).toBe('NaN seconds');
      expect(formatDurationHuman(Infinity)).toBe('Infinity minutes NaN seconds');
      
      expect(msToSeconds(NaN)).toBeNaN();
      expect(msToSeconds(Infinity)).toBe(Infinity);
      
      expect(secondsToMs(NaN)).toBeNaN();
      expect(secondsToMs(Infinity)).toBe(Infinity);
    });

    it('handles very large numbers', () => {
      const largeNumber = 999999;
      expect(formatDuration(largeNumber)).toBe('16666:39');
      expect(formatDurationHuman(largeNumber)).toBe('16666 minutes 39 seconds');
      expect(msToSeconds(largeNumber * 1000)).toBe(largeNumber);
      expect(secondsToMs(largeNumber)).toBe(largeNumber * 1000);
    });

    it('handles very small numbers', () => {
      const smallNumber = 0.001;
      expect(formatDuration(smallNumber)).toBe('00:00');
      expect(formatDurationHuman(smallNumber)).toBe('0 seconds');
      expect(msToSeconds(1, 3)).toBe(0.001);
      expect(secondsToMs(smallNumber)).toBe(1);
    });
  });

  describe('consistency between functions', () => {
    it('msToSeconds and secondsToMs are inverse operations', () => {
      const testValues = [0, 1, 1.5, 60, 3600, 0.001, 999.999];
      
      testValues.forEach(seconds => {
        const ms = secondsToMs(seconds);
        const backToSeconds = msToSeconds(ms, 3);
        expect(backToSeconds).toBeCloseTo(seconds, 3);
      });
    });

    it('formatDuration and formatDurationHuman handle same inputs', () => {
      const testValues = [0, 1, 30, 60, 90, 3600, 3661];
      
      testValues.forEach(seconds => {
        // Both functions should handle the input without throwing
        expect(() => formatDuration(seconds)).not.toThrow();
        expect(() => formatDurationHuman(seconds)).not.toThrow();
        
        // Both should return strings
        expect(typeof formatDuration(seconds)).toBe('string');
        expect(typeof formatDurationHuman(seconds)).toBe('string');
      });
    });
  });
});