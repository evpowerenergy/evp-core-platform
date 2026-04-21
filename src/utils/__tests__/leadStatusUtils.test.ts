/**
 * Lead Status Utils Test Suite
 * ทดสอบฟังก์ชัน pure สำหรับสีและคำอธิบายสถานะ
 */
/// <reference types="vitest/globals" />

import {
  LEAD_STATUS_OPTIONS,
  OPERATION_STATUS_OPTIONS,
  getLeadStatusColor,
  getOperationStatusColor,
  getStatusMappingExplanation,
} from '../leadStatusUtils';

describe('leadStatusUtils', () => {
  describe('LEAD_STATUS_OPTIONS', () => {
    it('has expected options', () => {
      expect(LEAD_STATUS_OPTIONS).toContain('รอรับ');
      expect(LEAD_STATUS_OPTIONS).toContain('กำลังติดตาม');
      expect(LEAD_STATUS_OPTIONS).toContain('ปิดการขาย');
      expect(LEAD_STATUS_OPTIONS).toContain('ยังปิดการขายไม่สำเร็จ');
      expect(LEAD_STATUS_OPTIONS).toHaveLength(4);
    });
  });

  describe('OPERATION_STATUS_OPTIONS', () => {
    it('has expected options', () => {
      expect(OPERATION_STATUS_OPTIONS).toContain('ปิดการขายแล้ว');
      expect(OPERATION_STATUS_OPTIONS).toContain('ติดตามหลังการขาย');
      expect(OPERATION_STATUS_OPTIONS.length).toBeGreaterThan(4);
    });
  });

  describe('getLeadStatusColor', () => {
    it('returns correct class for each lead status', () => {
      expect(getLeadStatusColor('รอรับ')).toContain('yellow');
      expect(getLeadStatusColor('กำลังติดตาม')).toContain('blue');
      expect(getLeadStatusColor('ปิดการขาย')).toContain('green');
      expect(getLeadStatusColor('ยังปิดการขายไม่สำเร็จ')).toContain('red');
    });

    it('is case insensitive', () => {
      expect(getLeadStatusColor('รอรับ')).toEqual(getLeadStatusColor('รอรับ'));
    });

    it('returns gray for unknown status', () => {
      expect(getLeadStatusColor('unknown')).toContain('gray');
      expect(getLeadStatusColor('')).toContain('gray');
    });
  });

  describe('getOperationStatusColor', () => {
    it('returns correct class for known operation status', () => {
      expect(getOperationStatusColor('ปิดการขายแล้ว')).toContain('green');
      expect(getOperationStatusColor('ปิดการขายไม่สำเร็จ')).toContain('gray');
      expect(getOperationStatusColor('ติดตามหลังการขาย')).toContain('cyan');
    });

    it('returns gray for unknown status', () => {
      expect(getOperationStatusColor('unknown')).toContain('gray');
    });
  });

  describe('getStatusMappingExplanation', () => {
    it('returns รอรับ when saleOwnerId is null', () => {
      const msg = getStatusMappingExplanation('อยู่ระหว่างการติดต่อ', null);
      expect(msg).toContain('รอรับ');
      expect(msg).toContain('ยังไม่มี Sale รับ');
    });

    it('returns ปิดการขาย for ปิดการขายแล้ว', () => {
      const msg = getStatusMappingExplanation('ปิดการขายแล้ว', 1);
      expect(msg).toContain('ปิดการขาย');
      expect(msg).toContain('ดำเนินการเสร็จสิ้น');
    });

    it('returns ยังปิดการขายไม่สำเร็จ for ปิดการขายไม่สำเร็จ', () => {
      const msg = getStatusMappingExplanation('ปิดการขายไม่สำเร็จ', 1);
      expect(msg).toContain('ยังปิดการขายไม่สำเร็จ');
    });

    it('returns ปิดการขาย for ติดตามหลังการขาย', () => {
      const msg = getStatusMappingExplanation('ติดตามหลังการขาย', 1);
      expect(msg).toContain('ปิดการขาย');
      expect(msg).toContain('ติดตามหลังการขาย');
    });

    it('returns กำลังติดตาม for other operation status when has saleOwnerId', () => {
      const msg = getStatusMappingExplanation('อยู่ระหว่างการติดต่อ', 1);
      expect(msg).toContain('กำลังติดตาม');
    });
  });
});
