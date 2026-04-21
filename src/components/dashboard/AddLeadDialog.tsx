import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import BasicInfoSection from "./form-sections/BasicInfoSection";
import PlatformCategorySection from "./form-sections/PlatformCategorySection";
import ContactLocationSection from "./form-sections/ContactLocationSection";
import AdditionalInfoSection from "./form-sections/AdditionalInfoSection";
import QRCodeSection from "./form-sections/QRCodeSection";

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  isLoading: boolean;
}

const AddLeadDialog = ({ isOpen, onOpenChange, onSubmit, isLoading }: AddLeadDialogProps) => {
  const form = useForm({
    defaultValues: {
      full_name: "",
      display_name: "",
      email: "",
      platform: "",
      category: "",
      tel: "",
      line_id: "",
      region: "",
      avg_electricity_bill: "",
      daytime_percent: "",
      notes: "",
      qr_code: ""
    }
  });

  const handleSubmit = (values: any) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-green-50/30 border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-green-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            เพิ่มลีดใหม่
          </DialogTitle>
          <p className="text-gray-600 text-sm mt-2">กรอกข้อมูลลูกค้าใหม่เพื่อเพิ่มเข้าสู่ระบบ</p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <BasicInfoSection control={form.control} />
            <PlatformCategorySection control={form.control} />
            <ContactLocationSection control={form.control} />
            <QRCodeSection control={form.control} />
            <AdditionalInfoSection control={form.control} />

            <div className="flex justify-end space-x-3 pt-6 border-t border-green-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </div>
                ) : (
                  "บันทึกลีด"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;
