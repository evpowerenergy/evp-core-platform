
import { useProductivityLogSubmissionAPI as useProductivityLogSubmission } from "@/hooks/useProductivityLogSubmissionAPI";
import { validateProductivityLogForm } from "@/utils/productivityLogValidation";
import { useToast } from "@/hooks/useToast";
import { ProductivityLogFormData } from "./useProductivityLogForm";
import { supabase } from "@/integrations/supabase/client";

export const useProductivityLogFormSubmission = (leadId: number, formData: ProductivityLogFormData, resetForm: () => void, onSuccess: () => void, isPackage: boolean = false) => {
  const { toast } = useToast();
  
  function handleClose() {
    resetForm();
    onSuccess();
  }

  const createLogMutation = useProductivityLogSubmission(leadId, handleClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateProductivityLogForm(formData, isPackage);
    if (validationErrors.length > 0) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: validationErrors[0],
        variant: "destructive",
      });
      return;
    }

    try {
      // Submit the main productivity log
      const logResult = await createLogMutation.mutateAsync(formData);
      
      // If there are selected products and the log was created successfully
      if (formData.selected_products.length > 0 && logResult) {
        // Save each selected product to lead_products table
        const productPromises = formData.selected_products
          .filter(product => product.product_id > 0 && product.quantity > 0)
          .map(product => {
            // คำนวณค่าต่างๆ หน้าบ้าน
            const totalPrice = (product.quantity || 0) * (product.unit_price || 0);
            const totalCost = (product.quantity || 0) * (product.cost_price || 0);
            const profit = totalPrice - totalCost;
            const profitPercent = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;
            
            return supabase
              .from('lead_products')
              .insert({
                productivity_log_id: logResult.id,
                product_id: product.product_id,
                quantity: product.quantity,
                unit_price: product.unit_price,
                cost_price: product.cost_price || 0,
                total_price: totalPrice,
                total_cost: totalCost,
                profit: profit,
                profit_percent: profitPercent,
              });
          });
        
        await Promise.all(productPromises);
      }
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกข้อมูลการติดตามและรายการสินค้าเรียบร้อยแล้ว",
      });
      
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  return {
    handleSubmit,
    handleClose,
    createLogMutation
  };
};
