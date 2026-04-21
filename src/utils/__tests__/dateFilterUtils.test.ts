/**
 * Date Filter Utils Test Suite
 * ทดสอบฟังก์ชัน pure สำหรับ date filter (getStartOfWeek, getDateRangeDisplayText)
 */
/// <reference types="vitest/globals" />

import { getStartOfWeek, getDateRangeDisplayText } from '../dateFilterUtils';

describe('dateFilterUtils', () => {
  describe('getStartOfWeek', () => {
    it('returns Monday 00:00:00 for a given date (week starts Monday)', () => {
      // Wednesday 15 Jan 2025
      const wed = new Date(2025, 0, 15, 14, 30, 0);
      const start = getStartOfWeek(wed);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(13); // Monday 13 Jan
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('when date is Sunday, start of week is previous Monday', () => {
      const sun = new Date(2025, 0, 19); // Sunday
      const start = getStartOfWeek(sun);
      expect(start.getDay()).toBe(1); // Monday = 1
      expect(start.getDate()).toBe(13);
    });

    it('when date is Monday, returns same day at 00:00', () => {
      const mon = new Date(2025, 0, 13, 10, 0, 0);
      const start = getStartOfWeek(mon);
      expect(start.getDate()).toBe(13);
      expect(start.getHours()).toBe(0);
    });
  });

  describe('getDateRangeDisplayText', () => {
    it('returns Thai label for known filters', () => {
      expect(getDateRangeDisplayText('today')).toBe('วันนี้');
      expect(getDateRangeDisplayText('this_week')).toBe('สัปดาห์นี้');
      expect(getDateRangeDisplayText('this_month')).toBe('เดือนนี้');
      expect(getDateRangeDisplayText('all')).toBe('ทั้งหมด');
    });

    it('returns ทั้งหมด for unknown filter', () => {
      expect(getDateRangeDisplayText('unknown')).toBe('ทั้งหมด');
      expect(getDateRangeDisplayText('')).toBe('ทั้งหมด');
    });
  });
});
