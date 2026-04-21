import { useMemo } from 'react';
import { ProductivityLogFormData } from './useProductivityLogForm';

interface OldLogFieldIndicator {
  isFromOldLog: (fieldName: keyof ProductivityLogFormData) => boolean;
  getFieldStyle: (fieldName: keyof ProductivityLogFormData) => string;
}

export const useOldLogFieldIndicator = (
  formData: ProductivityLogFormData,
  isEditMode: boolean = false
): OldLogFieldIndicator => {
  
  const isFromOldLog = useMemo(() => {
    return (fieldName: keyof ProductivityLogFormData): boolean => {
      // ถ้าเป็น edit mode หรือ presentation_type เป็น "การนำเสนอเก่า"
      if (isEditMode || formData.presentation_type === 'การนำเสนอเก่า') {
        // ตรวจสอบว่า field นี้มีข้อมูลหรือไม่
        const value = formData[fieldName];
        
        // ถ้าเป็น string และไม่ว่าง
        if (typeof value === 'string' && value.trim() !== '') {
          return true;
        }
        
        // ถ้าเป็น number และไม่ใช่ 0
        if (typeof value === 'number' && value !== 0) {
          return true;
        }
        
        // ถ้าเป็น boolean และเป็น true
        if (typeof value === 'boolean' && value === true) {
          return true;
        }
        
        // ถ้าเป็น array และมีข้อมูล
        if (Array.isArray(value) && value.length > 0) {
          return true;
        }
      }
      
      return false;
    };
  }, [formData, isEditMode]);

  const getFieldStyle = useMemo(() => {
    return (fieldName: keyof ProductivityLogFormData): string => {
      const isOldLog = isFromOldLog(fieldName);
      
      if (isOldLog) {
        return "border-blue-200 bg-blue-50 text-blue-900 focus:border-blue-300 focus:ring-blue-200";
      }
      
      return "border-gray-200 bg-white text-gray-900 focus:border-gray-300 focus:ring-gray-200";
    };
  }, [isFromOldLog]);

  return {
    isFromOldLog,
    getFieldStyle
  };
};

export default useOldLogFieldIndicator;
