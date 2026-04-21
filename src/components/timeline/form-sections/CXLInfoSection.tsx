
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CXLInfoSectionProps {
  cxlReason: string;
  cxlDetail: string;
  onCxlReasonChange: (value: string) => void;
  onCxlDetailChange: (value: string) => void;
}

const CXLInfoSection = ({
  cxlReason,
  cxlDetail,
  onCxlReasonChange,
  onCxlDetailChange
}: CXLInfoSectionProps) => {
  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">7. ข้อมูลกลุ่ม CXL</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            เหตุผลที่ไม่สามารถปิดการขายได้
            <span className="text-red-500 text-lg font-bold">*</span>
            <span className="text-sm text-gray-500">(จำเป็น)</span>
          </Label>
          <Select
            value={cxlReason}
            onValueChange={onCxlReasonChange}
            required
          >
            <SelectTrigger className={!cxlReason ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"}>
              <SelectValue placeholder="เลือกเหตุผล" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ขอข้อมูลหลายครั้งแต่ไม่ส่งมา">ขอข้อมูลหลายครั้งแต่ไม่ส่งมา</SelectItem>
              <SelectItem value="ราคาเกินงบ">ราคาเกินงบ</SelectItem>
              <SelectItem value="สินเชื่อไม่ผ่าน">สินเชื่อไม่ผ่าน</SelectItem>
              <SelectItem value="ครอบครัวไม่อนุมัติ">ครอบครัวไม่อนุมัติ</SelectItem>
              <SelectItem value="โทรไม่ติด / ปฏิเสธ">โทรไม่ติด / ปฏิเสธ</SelectItem>
              <SelectItem value="ติดตั้งกับเจ้าอื่นแล้ว">ติดตั้งกับเจ้าอื่นแล้ว</SelectItem>
              <SelectItem value="สนใจแค่อุปกรณ์">สนใจแค่อุปกรณ์</SelectItem>
              <SelectItem value="สอบถาม ข้อมูล">สอบถาม ข้อมูล</SelectItem>
              <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>รายละเอียด CXL</Label>
          <Textarea
            placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับ CXL..."
            value={cxlDetail}
            onChange={(e) => onCxlDetailChange(e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};

export default CXLInfoSection;
