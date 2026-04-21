
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuotationDetailsSectionProps {
  totalAmount: number | null;
  paymentMethod: string;
  installmentType: string;
  installmentPercent: number | null;
  installmentAmount: number | null;
  installmentPeriods: number | null;
  estimatePaymentDate: string;
  calculatedData: {
    remainingAmount: number;
    remainingPeriods: number;
  };
  quotationDocuments: Array<{ document_number: string; amount: number | null }>;
  invoiceDocuments: Array<{ document_number: string; amount: number | null }>;
  onTotalAmountChange: (value: number | null) => void;
  onPaymentMethodChange: (value: string) => void;
  onInstallmentTypeChange: (value: string) => void;
  onInstallmentPercentChange: (value: number | null) => void;
  onInstallmentAmountChange: (value: number | null) => void;
  onInstallmentPeriodsChange: (value: number | null) => void;
  onEstimatePaymentDateChange: (value: string) => void;
}

const QuotationDetailsSection = ({
  totalAmount,
  paymentMethod,
  installmentType,
  installmentPercent,
  installmentAmount,
  installmentPeriods,
  estimatePaymentDate,
  calculatedData,
  quotationDocuments,
  invoiceDocuments,
  onTotalAmountChange,
  onPaymentMethodChange,
  onInstallmentTypeChange,
  onInstallmentPercentChange,
  onInstallmentAmountChange,
  onInstallmentPeriodsChange,
  onEstimatePaymentDateChange
}: QuotationDetailsSectionProps) => {
  
  // คำนวณยอดรวมจาก QT เท่านั้น (ไม่รวม Invoice)
  const calculatedTotal = React.useMemo(() => {
    const qtTotal = quotationDocuments.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    return qtTotal;
  }, [quotationDocuments]);

  // อัปเดต totalAmount อัตโนมัติเมื่อมีการเปลี่ยนแปลงยอดแต่ละใบ
  React.useEffect(() => {
    if (calculatedTotal > 0) {
      onTotalAmountChange(calculatedTotal);
    }
  }, [calculatedTotal, onTotalAmountChange]);
  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">8. ข้อมูลเสนอราคา</h3>
      <div className="space-y-2">
        <Label>วิธีการชำระเงิน</Label>
        <Select
          value={paymentMethod}
          onValueChange={onPaymentMethodChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกวิธีชำระ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="เงินสด">เงินสด</SelectItem>
            <SelectItem value="สินเชื่อ">สินเชื่อ</SelectItem>
            <SelectItem value="บัตรเครดิต">บัตรเครดิต</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label>การชำระเงิน</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="full_payment"
              name="installment_type"
              value="full_payment"
              checked={installmentType === 'full_payment'}
              onChange={(e) => onInstallmentTypeChange(e.target.value)}
            />
            <Label htmlFor="full_payment">การจ่ายเต็มจำนวน</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="percent"
              name="installment_type"
              value="percent"
              checked={installmentType === 'percent'}
              onChange={(e) => onInstallmentTypeChange(e.target.value)}
            />
            <Label htmlFor="percent">เป็นเปอร์เซ็นต์</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="amount"
              name="installment_type"
              value="amount"
              checked={installmentType === 'amount'}
              onChange={(e) => onInstallmentTypeChange(e.target.value)}
            />
            <Label htmlFor="amount">เป็นยอดเงิน</Label>
          </div>
        </div>

        {installmentType === 'full_payment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ยอดที่จ่าย (บาท)</Label>
              <Input
                type="number"
                placeholder="0"
                value={totalAmount || ''}
                onChange={(e) => onTotalAmountChange(e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>วันที่จ่าย</Label>
              <Input
                type="date"
                value={estimatePaymentDate}
                onChange={(e) => onEstimatePaymentDateChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {installmentType !== 'full_payment' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {installmentType === 'percent' && (
              <div className="space-y-2">
                <Label>เปอร์เซ็นต์การแบ่งชำระ (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={installmentPercent || ''}
                  onChange={(e) => onInstallmentPercentChange(e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            )}

            {installmentType === 'amount' && (
              <div className="space-y-2">
                <Label>ยอดการแบ่งชำระ (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={installmentAmount || ''}
                  onChange={(e) => onInstallmentAmountChange(e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>จำนวนงวด</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={installmentPeriods || ''}
                onChange={(e) => onInstallmentPeriodsChange(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label>วันที่คาดว่าจะรับเงิน</Label>
              <Input
                type="date"
                value={estimatePaymentDate}
                onChange={(e) => onEstimatePaymentDateChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* แสดงการคำนวณ */}
        {installmentType === 'full_payment' && totalAmount && (
          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-green-900">การจ่ายเต็มจำนวน</h4>
            <div className="text-sm">
              <div>
                <span className="text-gray-600">ยอดจ่าย:</span>
                <span className="ml-2 font-medium text-green-900 text-lg">
                  {totalAmount.toLocaleString()} บาท
                </span>
              </div>
              {estimatePaymentDate && (
                <div>
                  <span className="text-gray-600">วันที่จ่าย:</span>
                  <span className="ml-2 font-medium text-green-900">
                    {new Date(estimatePaymentDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {installmentType !== 'full_payment' && calculatedData.remainingAmount > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900">การคำนวณยอดคงเหลือ</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">ยอดรวม:</span>
                <span className="ml-2 font-medium">{totalAmount?.toLocaleString()} บาท</span>
              </div>
              <div>
                <span className="text-gray-600">เงินดาวน์:</span>
                <span className="ml-2 font-medium">
                  {installmentType === 'percent' && installmentPercent
                    ? ((totalAmount || 0) * installmentPercent / 100).toLocaleString()
                    : (installmentAmount || 0).toLocaleString()
                  } บาท
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-blue-200">
                <span className="text-blue-800 font-medium">ยอดคงเหลือ:</span>
                <span className="ml-2 text-blue-900 font-bold text-lg">
                  {calculatedData.remainingAmount.toLocaleString()} บาท
                </span>
              </div>
              {installmentPeriods && (
                <div className="col-span-2">
                  <span className="text-blue-800 font-medium">จำนวนงวดที่เหลือ:</span>
                  <span className="ml-2 text-blue-900 font-bold">
                    {installmentPeriods} งวด
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationDetailsSection;
