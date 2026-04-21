import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface CustomerTypeSectionProps {
  leadGroup: string;
  onLeadGroupChange: (value: string) => void;
  presentationType: string;
  onPresentationTypeChange: (value: string) => void;
  isAutoSelected?: boolean;
}

const CustomerTypeSection = ({ leadGroup, onLeadGroupChange, presentationType, onPresentationTypeChange, isAutoSelected = false }: CustomerTypeSectionProps) => {
  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">1. ประเภทลูกค้า</h3>
      
      {isAutoSelected && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">เลือกอัตโนมัติ</p>
            <p className="text-xs text-green-600">
              {leadGroup === 'ลูกค้าใหม่' 
                ? 'นี่เป็นการติดตามครั้งแรก - เลือกเป็นลูกค้าใหม่' 
                : 'มีการติดตามก่อนหน้านี้แล้ว - เลือกเป็นลูกค้าเดิม'
              }
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-1">
              ประเภทลูกค้า
              <span className="text-red-500 text-lg font-bold">*</span>
              <span className="text-sm text-gray-500">(จำเป็น)</span>
            </Label>
            {isAutoSelected && (
              <Badge variant="secondary" className="text-xs">
                เลือกอัตโนมัติ
              </Badge>
            )}
          </div>
          <Select
            value={leadGroup}
            onValueChange={onLeadGroupChange}
            required
          >
            <SelectTrigger className={`${!leadGroup ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"} ${isAutoSelected ? "bg-green-50 border-green-200" : ""}`}>
              <SelectValue placeholder="เลือกประเภทลูกค้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ลูกค้าใหม่">ลูกค้าใหม่</SelectItem>
              <SelectItem value="ลูกค้าเดิม">ลูกค้าเดิม</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            ประเภทการนำเสนอ
            <span className="text-red-500 text-lg font-bold">*</span>
            <span className="text-sm text-gray-500">(จำเป็น)</span>
          </Label>
          <Select
            value={presentationType}
            onValueChange={onPresentationTypeChange}
            required
          >
            <SelectTrigger className={!presentationType ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"}>
              <SelectValue placeholder="เลือกประเภทการนำเสนอ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="การนำเสนอเก่า">การนำเสนอเก่า</SelectItem>
              <SelectItem value="การนำเสนอใหม่">การนำเสนอใหม่</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CustomerTypeSection;
