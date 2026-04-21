
import React from 'react';
import { Button } from "@/components/ui/button";

interface ProductivityLogFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
}

const ProductivityLogFormActions = ({ onCancel, isSubmitting }: ProductivityLogFormActionsProps) => {
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        ยกเลิก
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลครบถ้วน'}
      </Button>
    </div>
  );
};

export default ProductivityLogFormActions;
