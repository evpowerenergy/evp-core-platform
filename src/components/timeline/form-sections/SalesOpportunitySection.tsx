
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalesOpportunitySectionProps {
  saleChanceStatus: string;
  creditApprovalStatus: string;
  onSaleChanceStatusChange: (value: string) => void;
  onCreditApprovalStatusChange: (value: string) => void;
  isWholesale?: boolean;
}

const SalesOpportunitySection = ({
  saleChanceStatus,
  creditApprovalStatus,
  onSaleChanceStatusChange,
  onCreditApprovalStatusChange,
  isWholesale = false
}: SalesOpportunitySectionProps) => {
  // ตัวเลือกสถานะโอกาสสำหรับ wholesale (เพิ่ม "win + สินเชื่อ")
  const wholesaleStatusOptions = [
    "มากกว่า 50%",
    "50:50",
    "น้อยกว่า 50%",
    "win",
    "win + สินเชื่อ",
    "มัดจำเงิน",
    "CXL"
  ];
  
  // ตัวเลือกสถานะโอกาสสำหรับ non-wholesale (มี "win + สินเชื่อ")
  const regularStatusOptions = [
    "มากกว่า 50%",
    "50:50",
    "น้อยกว่า 50%",
    "win",
    "win + สินเชื่อ",
    "มัดจำเงิน",
    "CXL"
  ];
  
  const statusOptions = isWholesale ? wholesaleStatusOptions : regularStatusOptions;
  
  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">6. โอกาสในการปิดการขาย</h3>
      <div className="space-y-2">
        <Label>สถานะโอกาส</Label>
        <Select
          value={saleChanceStatus}
          onValueChange={onSaleChanceStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกสถานะโอกาส" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* ข้อความเน้นย้ำเมื่อเลือก win */}
        {saleChanceStatus === 'win' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-1">🎉 ยินดีด้วย! การขายสำเร็จ</h4>
                <p className="text-sm text-green-700">
                  <strong>⚠️ ข้อสำคัญ:</strong> ถ้า win แล้ว รบกวนไปเปลี่ยน <strong>สถานะการดำเนินงาน</strong> ในข้อ 3 เป็น <strong>"ปิดการขาย"</strong> ด้วยครับ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ข้อความเน้นย้ำเมื่อเลือก win + สินเชื่อ */}
        {saleChanceStatus === 'win + สินเชื่อ' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">💳 สินเชื่อ</h4>
                  <p className="text-sm text-blue-700">
                    <strong>⚠️ ข้อสำคัญ:</strong> ถ้า win + สินเชื่อ แล้ว รบกวนไปเปลี่ยน <strong>สถานะการดำเนินงาน</strong> ในข้อ 3 เป็น <strong>"ปิดการขาย"</strong> ด้วยครับ
                  </p>
                </div>
              </div>
              
              {/* เพิ่ม Checkbox สำหรับการอนุมัติ */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">สถานะการอนุมัติสินเชื่อ</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="creditApproval"
                      value="อนุมัติ"
                      checked={creditApprovalStatus === 'อนุมัติ'}
                      onChange={(e) => onCreditApprovalStatusChange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-800">อนุมัติ</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="creditApproval"
                      value="ไม่อนุมัติ"
                      checked={creditApprovalStatus === 'ไม่อนุมัติ'}
                      onChange={(e) => onCreditApprovalStatusChange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-800">ไม่อนุมัติ</span>
                  </label>
                </div>
                {saleChanceStatus === 'win + สินเชื่อ' && !creditApprovalStatus && (
                  <p className="text-xs text-red-600">กรุณาเลือกสถานะการอนุมัติสินเชื่อ</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesOpportunitySection;
