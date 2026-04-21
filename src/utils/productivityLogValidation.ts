
import { ProductivityLogFormData } from "@/hooks/useProductivityLogForm";

export const validateProductivityLogForm = (formData: ProductivityLogFormData, isPackage: boolean = false) => {
  const errors: string[] = [];

  // ตรวจสอบฟิลด์บังคับ
  if (!formData.operation_status || formData.operation_status.trim() === '') {
    errors.push("กรุณาเลือกสถานะการดำเนินงาน");
  }

  if (!formData.presentation_type || formData.presentation_type.trim() === '') {
    errors.push("กรุณาเลือกประเภทการนำเสนอ");
  }

  if (!formData.note || formData.note.trim() === '') {
    errors.push("กรุณากรอกรายละเอียดการติดตาม");
  }

  if (formData.contact_status === 'ติดต่อไม่ได้' && !formData.contact_fail_reason) {
    errors.push("ระบุเหตุผลที่ติดต่อไม่ได้");
  }

  if (formData.can_issue_qt === false && !formData.qt_fail_reason) {
    errors.push("ระบุเหตุผลที่ไม่สามารถออกใบเสนอราคาได้");
  }

  if (formData.sale_chance_status === 'CXL' && !formData.cxl_reason) {
    errors.push("กรอกข้อมูล CXL ให้ครบถ้วน");
  }

  // ตรวจสอบสถานะการอนุมัติสินเชื่อ
  if (formData.sale_chance_status === 'win + สินเชื่อ' && !formData.credit_approval_status) {
    errors.push("กรุณาเลือกสถานะการอนุมัติสินเชื่อ");
  }

  // ตรวจสอบขนาดที่สนใจ (สำหรับ package เท่านั้น)
  if (isPackage && (!formData.interested_kw_size || formData.interested_kw_size.trim() === '')) {
    errors.push("กรุณาเลือกขนาดที่สนใจ (kW)");
  }

  // ตรวจสอบ QT documents - ถ้ามีหมายเลขต้องมียอดด้วย
  formData.quotation_documents.forEach((doc, index) => {
    const hasNumber = doc.document_number.trim() !== '';
    const hasAmount = doc.amount !== null && doc.amount > 0;
    if (hasNumber && !hasAmount) {
      errors.push(`กรุณากรอกยอดเงินสำหรับใบเสนอราคา QT หมายเลข: ${doc.document_number || `รายการที่ ${index + 1}`}`);
    }
  });

  // ตรวจสอบ Invoice documents - ถ้ามีหมายเลขต้องมียอดด้วย
  formData.invoice_documents.forEach((doc, index) => {
    const hasNumber = doc.document_number.trim() !== '';
    const hasAmount = doc.amount !== null && doc.amount > 0;
    if (hasNumber && !hasAmount) {
      errors.push(`กรุณากรอกยอดเงินสำหรับ Invoice หมายเลข: ${doc.document_number || `รายการที่ ${index + 1}`}`);
    }
  });

  return errors;
};
