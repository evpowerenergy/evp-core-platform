import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { OPERATION_STATUS_OPTIONS, getOperationStatusColor } from "@/utils/leadStatusUtils";
import { FieldWithOldLogIndicator } from "@/components/ui/FieldWithOldLogIndicator";

interface BasicInfoSectionProps {
  customerCategory: string;
  operationStatus: string;
  onCustomerCategoryChange: (value: string) => void;
  onOperationStatusChange: (value: string) => void;
  canShowFullForm: boolean;
  operationStatusOptions: string[];
  isWholesale?: boolean;
  isPackage?: boolean;
  interestedKwSize?: string;
  onInterestedKwSizeChange?: (value: string) => void;
  // Props สำหรับแสดง Old Log Indicator
  isFromOldLog?: boolean;
}

const BasicInfoSection = ({
  customerCategory,
  operationStatus,
  onCustomerCategoryChange,
  onOperationStatusChange,
  canShowFullForm,
  operationStatusOptions,
  isWholesale = false,
  isPackage = false,
  interestedKwSize = '',
  onInterestedKwSizeChange,
  isFromOldLog = false
}: BasicInfoSectionProps) => {
  const statusOptions = operationStatusOptions || OPERATION_STATUS_OPTIONS;
  
  // ตัวเลือกกลุ่มลูกค้าสำหรับ wholesale
  const wholesaleCustomerCategories = [
    "ผู้รับเหมา",
    "ลูกบ้าน",
    "เจ้าของกิจการ",
    "ตัวแทนจำหน่าย",
    "อื่นๆ"
  ];
  
  // ตัวเลือกกลุ่มลูกค้าสำหรับ package
  const packageCustomerCategories = [
    "โรงแรม/รีสอร์ท",
    "นายหน้า",
    "เจ้าของฟาร์ม",
    "ราชการ(ของรัฐ)",
    "บ้านพักอาศัย",
    "โฮมออฟฟิศ",
    "โรงงาน",
    "ร้านอาหาร",
    "วัด",
    "เจ้าของกิจการ",
    "อื่นๆ"
  ];
  
  // ตัวเลือกกลุ่มลูกค้าสำหรับ non-wholesale และ non-package
  const regularCustomerCategories = [
    "C&I",
    "บ้าน",
    "ราชการ",
    "อื่นๆ"
  ];
  
  let customerCategoryOptions;
  if (isWholesale) {
    customerCategoryOptions = wholesaleCustomerCategories;
  } else if (isPackage) {
    customerCategoryOptions = packageCustomerCategories;
  } else {
    customerCategoryOptions = regularCustomerCategories;
  }

  // ตัวเลือกขนาด kW สำหรับ package
  const kwSizeOptions = [
    "ไม่ระบุ",
    "3kW",
    "5kW", 
    "10kW",
    "15kW",
    "20kW",
    "30kW",
    "50kW",
    "80kW",
    "100kW",
    "มากกว่า 100kW"
  ];
  
  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">3. ข้อมูลเบื้องต้น</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canShowFullForm && (
          <div className="space-y-2">
            <Label>กลุ่มลูกค้า</Label>
            <Select
              value={customerCategory.startsWith("อื่นๆ") ? "อื่นๆ" : customerCategory}
              onValueChange={(value) => {
                if (value === "อื่นๆ") {
                  onCustomerCategoryChange("อื่นๆ");
                } else {
                  onCustomerCategoryChange(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกกลุ่มลูกค้า" />
              </SelectTrigger>
              <SelectContent>
                {customerCategoryOptions.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPackage && customerCategory.startsWith("อื่นๆ") && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">ระบุรายละเอียด</Label>
                <Input
                  value={customerCategory === "อื่นๆ" ? "" : customerCategory.replace("อื่นๆ - ", "")}
                  onChange={(e) => {
                    const otherText = e.target.value;
                    if (otherText.trim()) {
                      onCustomerCategoryChange(`อื่นๆ - ${otherText}`);
                    } else {
                      onCustomerCategoryChange("อื่นๆ");
                    }
                  }}
                  placeholder="กรุณาระบุกลุ่มลูกค้า"
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {isPackage && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              ขนาดที่สนใจ (kW)
              <span className="text-red-500 text-lg font-bold">*</span>
              <span className="text-sm text-gray-500">(จำเป็น)</span>
            </Label>
            <Select
              value={interestedKwSize}
              onValueChange={onInterestedKwSizeChange}
              required
            >
              <SelectTrigger className={!interestedKwSize ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"}>
                <SelectValue placeholder="เลือกขนาด kW" />
              </SelectTrigger>
              <SelectContent>
                {kwSizeOptions.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          สถานะการดำเนินงาน
          <span className="text-red-500 text-lg font-bold">*</span>
          <span className="text-sm text-gray-500">(จำเป็น)</span>
        </Label>
        <Select
          value={operationStatus}
          onValueChange={onOperationStatusChange}
          required
        >
          <SelectTrigger className={!operationStatus ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"}>
            <SelectValue placeholder="เลือกสถานะการดำเนินงาน" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(status => {
              const statusColor = getOperationStatusColor(status);
              return (
                <SelectItem 
                  key={status} 
                  value={status}
                  className={`${statusColor} hover:opacity-80 transition-opacity`}
                >
                  {status}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BasicInfoSection;
