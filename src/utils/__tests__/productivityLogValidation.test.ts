/**
 * Productivity Log Validation Test Suite
 * ทดสอบ validateProductivityLogForm
 */
/// <reference types="vitest/globals" />

import type { ProductivityLogFormData } from '@/hooks/useProductivityLogForm';
import { validateProductivityLogForm } from '../productivityLogValidation';

function minimalFormData(overrides: Partial<ProductivityLogFormData> = {}): ProductivityLogFormData {
  return {
    operation_status: '',
    note: '',
    next_follow_up: '',
    next_follow_up_details: '',
    contact_status: '',
    contact_fail_reason: '',
    lead_group: '',
    customer_category: '',
    presentation_type: '',
    site_visit_date: '',
    location: '',
    building_info: '',
    installation_notes: '',
    can_issue_qt: null,
    qt_fail_reason: '',
    sale_chance_percent: null,
    sale_chance_status: '',
    credit_approval_status: '',
    cxl_group: '',
    cxl_detail: '',
    cxl_reason: '',
    has_qt: false,
    has_inv: false,
    quotation_documents: [],
    invoice_documents: [],
    total_amount: null,
    payment_method: '',
    installment_type: '',
    installment_percent: null,
    installment_amount: null,
    estimate_payment_date: '',
    installment_periods: null,
    is_zero_down_payment: false,
    down_payment_amount: null,
    selected_products: [],
    interested_kw_size: '',
    ...overrides,
  };
}

describe('productivityLogValidation', () => {
  describe('validateProductivityLogForm', () => {
    it('returns errors for empty required fields', () => {
      const errors = validateProductivityLogForm(minimalFormData());
      expect(errors).toContain('กรุณาเลือกสถานะการดำเนินงาน');
      expect(errors).toContain('กรุณาเลือกประเภทการนำเสนอ');
      expect(errors).toContain('กรุณากรอกรายละเอียดการติดตาม');
    });

    it('returns no errors when required fields are filled', () => {
      const data = minimalFormData({
        operation_status: 'อยู่ระหว่างการติดต่อ',
        presentation_type: 'การนำเสนอใหม่',
        note: 'ติดตามแล้ว',
      });
      const errors = validateProductivityLogForm(data);
      expect(errors).not.toContain('กรุณาเลือกสถานะการดำเนินงาน');
      expect(errors).not.toContain('กรุณาเลือกประเภทการนำเสนอ');
      expect(errors).not.toContain('กรุณากรอกรายละเอียดการติดตาม');
    });

    it('requires contact_fail_reason when contact_status is ติดต่อไม่ได้', () => {
      const data = minimalFormData({
        operation_status: 'อยู่ระหว่างการติดต่อ',
        presentation_type: 'การนำเสนอใหม่',
        note: 'note',
        contact_status: 'ติดต่อไม่ได้',
        contact_fail_reason: '',
      });
      const errors = validateProductivityLogForm(data);
      expect(errors).toContain('ระบุเหตุผลที่ติดต่อไม่ได้');
    });

    it('does not require contact_fail_reason when contact_status is other', () => {
      const data = minimalFormData({
        operation_status: 'อยู่ระหว่างการติดต่อ',
        presentation_type: 'การนำเสนอใหม่',
        note: 'note',
        contact_status: 'ติดต่อได้',
      });
      const errors = validateProductivityLogForm(data);
      expect(errors).not.toContain('ระบุเหตุผลที่ติดต่อไม่ได้');
    });

    it('requires qt_fail_reason when can_issue_qt is false', () => {
      const data = minimalFormData({
        operation_status: 'อยู่ระหว่างการติดต่อ',
        presentation_type: 'การนำเสนอใหม่',
        note: 'note',
        can_issue_qt: false,
        qt_fail_reason: '',
      });
      const errors = validateProductivityLogForm(data);
      expect(errors).toContain('ระบุเหตุผลที่ไม่สามารถออกใบเสนอราคาได้');
    });

    it('requires cxl_reason when sale_chance_status is CXL', () => {
      const data = minimalFormData({
        operation_status: 'อยู่ระหว่างการติดต่อ',
        presentation_type: 'การนำเสนอใหม่',
        note: 'note',
        sale_chance_status: 'CXL',
        cxl_reason: '',
      });
      const errors = validateProductivityLogForm(data);
      expect(errors.some(e => e.includes('CXL'))).toBe(true);
    });

    it('for package, requires interested_kw_size', () => {
      const data = minimalFormData({
        operation_status: 'อยู่ระหว่างการติดต่อ',
        presentation_type: 'การนำเสนอใหม่',
        note: 'note',
        interested_kw_size: '',
      });
      const errors = validateProductivityLogForm(data, true);
      expect(errors).toContain('กรุณาเลือกขนาดที่สนใจ (kW)');
    });

    it('quotation_documents: requires amount when document_number is set', () => {
      const data = minimalFormData({
        operation_status: 'อยู่ระหว่างการติดต่อ',
        presentation_type: 'การนำเสนอใหม่',
        note: 'note',
        quotation_documents: [
          { document_number: 'QT-001', amount: null, delivery_fee: null },
        ],
      });
      const errors = validateProductivityLogForm(data);
      expect(errors.some(e => e.includes('ยอดเงิน') && e.includes('QT'))).toBe(true);
    });
  });
});
