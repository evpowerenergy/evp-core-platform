/**
 * Lead Validation Utils Test Suite
 * ทดสอบฟังก์ชัน validate และ filter สำหรับ Lead
 */
/// <reference types="vitest/globals" />

import type { Lead } from '@/types';
import {
  hasValidPhone,
  hasValidLineId,
  hasValidContact,
  filterLeadsWithPhone,
  filterLeadsWithLineId,
  filterLeadsWithContact,
  calculateTotalLeads,
  calculateTotalLeadsWithContact,
  calculateAssignedLeads,
  calculateAssignedLeadsWithContact,
} from '../leadValidation';

/** สร้าง lead object แบบ minimal สำหรับเทส (ใช้ type assertion) */
function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 1,
    created_at: '',
    updated_at: '',
    ...overrides,
  } as Lead;
}

describe('leadValidation', () => {
  describe('hasValidPhone', () => {
    it('returns true when tel is non-empty string', () => {
      expect(hasValidPhone(lead({ tel: '0812345678' }))).toBe(true);
      expect(hasValidPhone(lead({ tel: ' 02-123-4567 ' }))).toBe(true);
    });

    it('returns false when tel is empty, whitespace or missing', () => {
      expect(hasValidPhone(lead({ tel: '' }))).toBe(false);
      expect(hasValidPhone(lead({ tel: '   ' }))).toBe(false);
      expect(hasValidPhone(lead({ tel: null as any }))).toBe(false);
    });
  });

  describe('hasValidLineId', () => {
    it('returns true when line_id is non-empty string', () => {
      expect(hasValidLineId(lead({ line_id: 'line123' }))).toBe(true);
    });

    it('returns false when line_id is empty, whitespace or missing', () => {
      expect(hasValidLineId(lead({ line_id: '' }))).toBe(false);
      expect(hasValidLineId(lead({ line_id: '   ' }))).toBe(false);
    });
  });

  describe('hasValidContact', () => {
    it('returns true when phone or line_id is valid', () => {
      expect(hasValidContact(lead({ tel: '081', line_id: '' }))).toBe(true);
      expect(hasValidContact(lead({ tel: '', line_id: 'line1' }))).toBe(true);
      expect(hasValidContact(lead({ tel: '081', line_id: 'line1' }))).toBe(true);
    });

    it('returns false when both are invalid', () => {
      expect(hasValidContact(lead({ tel: '', line_id: '' }))).toBe(false);
    });
  });

  describe('filterLeadsWithPhone', () => {
    it('returns only leads with valid phone', () => {
      const leads = [
        lead({ id: 1, tel: '081' }),
        lead({ id: 2, tel: '' }),
        lead({ id: 3, tel: '02-123' }),
      ];
      const result = filterLeadsWithPhone(leads);
      expect(result).toHaveLength(2);
      expect(result.map(l => l.id)).toEqual([1, 3]);
    });
  });

  describe('filterLeadsWithLineId', () => {
    it('returns only leads with valid line_id', () => {
      const leads = [
        lead({ id: 1, line_id: 'a' }),
        lead({ id: 2, line_id: '' }),
      ];
      const result = filterLeadsWithLineId(leads);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('filterLeadsWithContact', () => {
    it('returns only leads with valid contact (phone or line)', () => {
      const leads = [
        lead({ id: 1, tel: '081' }),
        lead({ id: 2, line_id: 'line' }),
        lead({ id: 3, tel: '', line_id: '' }),
      ];
      const result = filterLeadsWithContact(leads);
      expect(result).toHaveLength(2);
      expect(result.map(l => l.id)).toEqual([1, 2]);
    });
  });

  describe('calculateTotalLeads', () => {
    it('counts leads with valid phone when requirePhone is true (default)', () => {
      const leads = [
        lead({ id: 1, tel: '081' }),
        lead({ id: 2, tel: '' }),
      ];
      expect(calculateTotalLeads(leads)).toBe(1);
      expect(calculateTotalLeads(leads, true)).toBe(1);
    });

    it('counts all leads when requirePhone is false', () => {
      const leads = [
        lead({ id: 1, tel: '081' }),
        lead({ id: 2, tel: '' }),
      ];
      expect(calculateTotalLeads(leads, false)).toBe(2);
    });
  });

  describe('calculateTotalLeadsWithContact', () => {
    it('counts leads with contact when requireContact is true (default)', () => {
      const leads = [
        lead({ id: 1, line_id: 'x' }),
        lead({ id: 2, tel: '', line_id: '' }),
      ];
      expect(calculateTotalLeadsWithContact(leads)).toBe(1);
    });

    it('counts all leads when requireContact is false', () => {
      const leads = [lead({ id: 1 }), lead({ id: 2 })];
      expect(calculateTotalLeadsWithContact(leads, false)).toBe(2);
    });
  });

  describe('calculateAssignedLeads', () => {
    it('counts assigned leads (sale_owner_id) with phone when requirePhone is true', () => {
      const leads = [
        lead({ id: 1, tel: '081', sale_owner_id: 10 }),
        lead({ id: 2, tel: '', sale_owner_id: 10 }),
      ];
      expect(calculateAssignedLeads(leads)).toBe(1);
    });

    it('counts all assigned when requirePhone is false', () => {
      const leads = [
        lead({ id: 1, tel: '', sale_owner_id: 10 }),
      ];
      expect(calculateAssignedLeads(leads, false)).toBe(1);
    });
  });

  describe('calculateAssignedLeadsWithContact', () => {
    it('counts assigned (sale_owner_id or post_sales_owner_id) with contact', () => {
      const leads = [
        lead({ id: 1, tel: '081', sale_owner_id: 10 }),
        lead({ id: 2, line_id: 'x', post_sales_owner_id: 20 }),
        lead({ id: 3, tel: '', line_id: '', sale_owner_id: 10 }),
      ];
      expect(calculateAssignedLeadsWithContact(leads)).toBe(2);
    });
  });
});
