/**
 * Safe Date Filter Test Suite
 * ทดสอบ safeIsInDateRange (input validation และ custom range)
 */
/// <reference types="vitest/globals" />

import { safeIsInDateRange } from '../safeDateFilter';

describe('safeDateFilter', () => {
  describe('safeIsInDateRange', () => {
    it('returns false for invalid createdAtThai', () => {
      expect(safeIsInDateRange('', 'today')).toBe(false);
      expect(safeIsInDateRange('invalid-date', 'today')).toBe(false);
    });

    it('returns false for null/undefined createdAtThai', () => {
      expect(safeIsInDateRange(null as any, 'today')).toBe(false);
      expect(safeIsInDateRange(undefined as any, 'today')).toBe(false);
    });

    it('returns true for custom range when date is within range', () => {
      const start = '2025-01-01T00:00:00.000Z';
      const end = '2025-01-31T23:59:59.999Z';
      const created = '2025-01-15T12:00:00.000Z';
      expect(safeIsInDateRange(created, 'custom', { start, end })).toBe(true);
    });

    it('returns false for custom range when date is outside range', () => {
      const start = '2025-01-01T00:00:00.000Z';
      const end = '2025-01-31T23:59:59.999Z';
      const created = '2025-02-15T12:00:00.000Z';
      expect(safeIsInDateRange(created, 'custom', { start, end })).toBe(false);
    });
  });
});
