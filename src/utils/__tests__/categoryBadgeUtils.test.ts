/**
 * Category Badge Utils Test Suite
 * ทดสอบฟังก์ชันกำหนด className สำหรับ Badge กลุ่มลูกค้า
 */
/// <reference types="vitest/globals" />

import {
  getCategoryBadgeClassName,
  getCategoryBadgeClassNameWithCustom,
} from '../categoryBadgeUtils';

describe('categoryBadgeUtils', () => {
  describe('getCategoryBadgeClassName', () => {
    it('returns gray for null or undefined', () => {
      expect(getCategoryBadgeClassName(null)).toContain('gray');
      expect(getCategoryBadgeClassName(undefined)).toContain('gray');
    });

    it('returns green for Package (case insensitive)', () => {
      expect(getCategoryBadgeClassName('Package')).toContain('green');
      expect(getCategoryBadgeClassName('package')).toContain('green');
      expect(getCategoryBadgeClassName('PACKAGE')).toContain('green');
    });

    it('returns yellow for Wholesale', () => {
      expect(getCategoryBadgeClassName('Wholesale')).toContain('yellow');
      expect(getCategoryBadgeClassName('wholesales')).toContain('yellow');
    });

    it('returns gray for other categories', () => {
      expect(getCategoryBadgeClassName('Others')).toContain('gray');
      expect(getCategoryBadgeClassName('')).toContain('gray');
    });

    it('always includes text-xs and border', () => {
      const c = getCategoryBadgeClassName('Package');
      expect(c).toContain('text-xs');
      expect(c).toContain('border-');
    });
  });

  describe('getCategoryBadgeClassNameWithCustom', () => {
    it('appends custom class to base', () => {
      const base = getCategoryBadgeClassName('Package');
      const withCustom = getCategoryBadgeClassNameWithCustom('Package', 'ml-2');
      expect(withCustom).toContain('ml-2');
      expect(withCustom.startsWith(base.trim()) || withCustom.includes(base.trim())).toBe(true);
    });

    it('trims extra spaces when custom is empty', () => {
      const withCustom = getCategoryBadgeClassNameWithCustom('Package', '');
      expect(withCustom).not.toMatch(/\s{2,}/);
    });
  });
});
