/// <reference types="vitest/globals" />

import {
  bangkokDateTimeToUTC,
  bangkokDateOnlyToUTC,
  utcToBangkokInput,
  getThaiDisplayValue,
  parseUserDateTimeToUTC,
} from '../thailandDateTime';
import { formatTime } from '../dashboardUtils';

describe('thailandDateTime', () => {
  describe('bangkokDateTimeToUTC', () => {
    it('converts 11:00 Bangkok to 04:00 UTC', () => {
      expect(bangkokDateTimeToUTC('2026-06-29T11:00')).toBe('2026-06-29T04:00:00.000Z');
    });

    it('converts 13:00 Bangkok to 06:00 UTC', () => {
      expect(bangkokDateTimeToUTC('2026-06-29T13:00')).toBe('2026-06-29T06:00:00.000Z');
    });

    it('handles 23:00 Bangkok (day boundary)', () => {
      expect(bangkokDateTimeToUTC('2026-06-29T23:00')).toBe('2026-06-29T16:00:00.000Z');
    });

    it('handles 00:30 Bangkok', () => {
      expect(bangkokDateTimeToUTC('2026-06-30T00:30')).toBe('2026-06-29T17:30:00.000Z');
    });

    it('returns null for empty input', () => {
      expect(bangkokDateTimeToUTC('')).toBeNull();
      expect(bangkokDateTimeToUTC(null)).toBeNull();
      expect(bangkokDateTimeToUTC(undefined)).toBeNull();
    });

    it('is idempotent when input already has +07:00', () => {
      const input = '2026-06-29T11:00+07:00';
      expect(bangkokDateTimeToUTC(input)).toBe('2026-06-29T04:00:00.000Z');
    });

    it('is idempotent when input is already UTC ISO', () => {
      const input = '2026-06-29T04:00:00.000Z';
      expect(bangkokDateTimeToUTC(input)).toBe('2026-06-29T04:00:00.000Z');
    });
  });

  describe('bangkokDateOnlyToUTC', () => {
    it('converts date-only to midnight Bangkok as UTC', () => {
      expect(bangkokDateOnlyToUTC('2026-06-29')).toBe('2026-06-28T17:00:00.000Z');
    });

    it('returns null for invalid date', () => {
      expect(bangkokDateOnlyToUTC('invalid')).toBeNull();
    });
  });

  describe('utcToBangkokInput', () => {
    it('converts 04:00 UTC to 11:00 Bangkok input', () => {
      expect(utcToBangkokInput('2026-06-29T04:00:00.000Z')).toBe('2026-06-29T11:00');
    });

    it('converts case 0898332902 after migration', () => {
      expect(utcToBangkokInput('2026-06-29T04:00:00.000Z')).toBe('2026-06-29T11:00');
    });

    it('returns empty for invalid input', () => {
      expect(utcToBangkokInput('')).toBe('');
      expect(utcToBangkokInput(null)).toBe('');
    });
  });

  describe('getThaiDisplayValue', () => {
    it('prefers thai over utc', () => {
      expect(getThaiDisplayValue('2026-06-29T11:00:00Z', '2026-06-29T04:00:00Z')).toBe(
        '2026-06-29T11:00:00Z'
      );
    });

    it('falls back to utc when thai is null', () => {
      expect(getThaiDisplayValue(null, '2026-06-29T04:00:00Z')).toBe('2026-06-29T04:00:00Z');
    });
  });

  describe('parseUserDateTimeToUTC', () => {
    it('parses datetime input', () => {
      expect(parseUserDateTimeToUTC('2026-06-29T11:00')).toBe('2026-06-29T04:00:00.000Z');
    });

    it('parses date-only input', () => {
      expect(parseUserDateTimeToUTC('2026-06-29')).toBe('2026-06-28T17:00:00.000Z');
    });
  });

  describe('case 0898332902 display chain', () => {
    it('04:00Z stored → date_thai 11:00Z → formatTime shows 11:00', () => {
      const utc = bangkokDateTimeToUTC('2026-06-29T11:00');
      expect(utc).toBe('2026-06-29T04:00:00.000Z');

      const dateThai = '2026-06-29T11:00:00.000Z';
      expect(formatTime(dateThai)).toBe('11:00');
      expect(utcToBangkokInput(utc!)).toBe('2026-06-29T11:00');
    });
  });
});
