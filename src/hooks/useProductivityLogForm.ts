
import { useState, useEffect, useCallback } from 'react';

export interface ProductItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  product_name?: string;
}

export interface QuotationDocument {
  document_number: string;
  amount: number | null;
  delivery_fee: number | null;
}

export interface ProductivityLogFormData {
  // Basic fields
  operation_status: string;
  note: string;
  next_follow_up: string;
  next_follow_up_details: string;

  
  // Contact fields
  contact_status: string;
  contact_fail_reason: string;
  
  // PRD fields
  lead_group: string;
  customer_category: string;
  presentation_type: string;
  
  // Site visit fields
  site_visit_date: string;
  location: string;
  building_info: string;
  installation_notes: string;
  
  // Quotation issuing
  can_issue_qt: boolean | null;
  qt_fail_reason: string;
  
  // Sales opportunity
  sale_chance_percent: number | null;
  sale_chance_status: string;
  credit_approval_status: string;
  
  // CXL info
  cxl_group: string;
  cxl_detail: string;
  cxl_reason: string;
  
  // Quotation details
  has_qt: boolean;
  has_inv: boolean;
  quotation_documents: QuotationDocument[];
  invoice_documents: QuotationDocument[];
  total_amount: number | null;
  payment_method: string;
  installment_type: string;
  installment_percent: number | null;
  installment_amount: number | null;
  estimate_payment_date: string;
  installment_periods: number | null;
  is_zero_down_payment: boolean;
  down_payment_amount: number | null;
  
  // Product selection for wholesale
  selected_products: ProductItem[];
  
  // kW size interest (Package only)
  interested_kw_size: string;
}

const getInitialFormData = (): ProductivityLogFormData => ({
  operation_status: '',
  note: '',
  next_follow_up: '',
  next_follow_up_details: '',
  contact_status: 'ติดต่อได้',
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
  installment_type: 'full_payment',
  installment_percent: null,
  installment_amount: null,
  estimate_payment_date: '',
  installment_periods: null,
  is_zero_down_payment: false,
  down_payment_amount: null,
  selected_products: [],
  interested_kw_size: '',
});

export const useProductivityLogForm = (initialData?: Partial<ProductivityLogFormData>, storageKey?: string) => {
  // โหลดข้อมูลจาก localStorage ถ้ามี
  const loadFromStorage = () => {
    if (!storageKey) return null;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
    return null;
  };

  const [formData, setFormData] = useState<ProductivityLogFormData>(() => {
    const storedData = loadFromStorage();
    return {
      ...getInitialFormData(),
      ...initialData,
      ...storedData, // ให้ข้อมูลจาก localStorage มีความสำคัญสูงสุด
    };
  });

  const [calculatedData, setCalculatedData] = useState({
    remainingAmount: 0,
    remainingPeriods: 0
  });

  // บันทึกข้อมูลลง localStorage ทุกครั้งที่ formData เปลี่ยน
  useEffect(() => {
    if (storageKey && formData) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    }
  }, [formData, storageKey]);

  useEffect(() => {
    if (formData.installment_type === 'full_payment') {
      setCalculatedData(prev => ({ ...prev, remainingAmount: 0 }));
      return;
    }

    if (formData.total_amount && formData.installment_type === 'percent' && formData.installment_percent) {
      const downPayment = (formData.total_amount * formData.installment_percent) / 100;
      const remaining = formData.total_amount - downPayment;
      setCalculatedData(prev => ({ ...prev, remainingAmount: remaining }));
    } else if (formData.total_amount && formData.installment_type === 'amount' && formData.installment_amount) {
      const remaining = formData.total_amount - formData.installment_amount;
      setCalculatedData(prev => ({ ...prev, remainingAmount: remaining }));
    } else {
      setCalculatedData(prev => ({ ...prev, remainingAmount: 0 }));
    }
  }, [formData.total_amount, formData.installment_type, formData.installment_percent, formData.installment_amount]);

  useEffect(() => {
    if (calculatedData.remainingAmount > 0 && formData.installment_periods) {
      const periodsLeft = formData.installment_periods;
      setCalculatedData(prev => ({ ...prev, remainingPeriods: periodsLeft }));
    }
  }, [calculatedData.remainingAmount, formData.installment_periods]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, []);

  const initializeForm = useCallback((data: Partial<ProductivityLogFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  // ฟังก์ชันสำหรับลบข้อมูลจาก localStorage
  const clearStorage = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Error clearing form data from localStorage:', error);
      }
    }
  }, [storageKey]);

  return {
    formData,
    setFormData,
    calculatedData,
    resetForm,
    initializeForm,
    clearStorage
  };
};
