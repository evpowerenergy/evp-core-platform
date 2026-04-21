
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactStatusSectionProps {
  contactStatus: string;
  contactFailReason: string;
  onContactStatusChange: (value: string) => void;
  onContactFailReasonChange: (value: string) => void;
}

const ContactStatusSection = ({ 
  contactStatus, 
  contactFailReason, 
  onContactStatusChange, 
  onContactFailReasonChange 
}: ContactStatusSectionProps) => {
  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">2. สถานะการติดต่อ</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            สถานะการติดต่อ
            <span className="text-red-500 text-lg font-bold">*</span>
            <span className="text-sm text-gray-500">(จำเป็น)</span>
          </Label>
          <Select
            value={contactStatus}
            onValueChange={onContactStatusChange}
            required
          >
            <SelectTrigger className={!contactStatus ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ติดต่อได้">ติดต่อได้</SelectItem>
              <SelectItem value="ติดต่อไม่ได้">ติดต่อไม่ได้</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {contactStatus === 'ติดต่อไม่ได้' && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              เหตุผลที่ติดต่อไม่ได้
              <span className="text-red-500 text-lg font-bold">*</span>
              <span className="text-sm text-gray-500">(จำเป็น)</span>
            </Label>
            <Input
              value={contactFailReason}
              onChange={(e) => onContactFailReasonChange(e.target.value)}
              placeholder="ระบุเหตุผล..."
              required
              className={!contactFailReason ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactStatusSection;
