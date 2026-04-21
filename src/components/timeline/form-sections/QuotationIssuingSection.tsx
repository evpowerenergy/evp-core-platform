import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, Plus, FileText, Receipt } from "lucide-react";
import { QuotationDocument } from "@/hooks/useProductivityLogForm";

interface QuotationIssuingSectionProps {
  canIssueQt: boolean | null;
  qtFailReason: string;
  hasQt: boolean;
  hasInv: boolean;
  quotationDocuments: QuotationDocument[];
  invoiceDocuments: QuotationDocument[];
  isWholesale?: boolean;
  isZeroDownPayment: boolean;
  downPaymentAmount: number | null;
  onCanIssueQtChange: (value: boolean) => void;
  onQtFailReasonChange: (value: string) => void;
  onHasQtChange: (checked: boolean) => void;
  onHasInvChange: (checked: boolean) => void;
  onQuotationDocumentsChange: (documents: QuotationDocument[]) => void;
  onInvoiceDocumentsChange: (documents: QuotationDocument[]) => void;
  onIsZeroDownPaymentChange: (value: boolean) => void;
  onDownPaymentAmountChange: (value: number | null) => void;
}

const QuotationIssuingSection = ({
  canIssueQt,
  qtFailReason,
  hasQt,
  hasInv,
  quotationDocuments,
  invoiceDocuments,
  isWholesale,
  isZeroDownPayment,
  downPaymentAmount,
  onCanIssueQtChange,
  onQtFailReasonChange,
  onHasQtChange,
  onHasInvChange,
  onQuotationDocumentsChange,
  onInvoiceDocumentsChange,
  onIsZeroDownPaymentChange,
  onDownPaymentAmountChange
}: QuotationIssuingSectionProps) => {
  
  // ตรวจสอบ validation สำหรับ QT documents
  const validateQuotationDocument = (document: QuotationDocument) => {
    const hasNumber = document.document_number.trim() !== '';
    const hasAmount = document.amount !== null && document.amount > 0;
    return !hasNumber || (hasNumber && hasAmount);
  };

  // ตรวจสอบ validation สำหรับ Invoice documents
  const validateInvoiceDocument = (document: QuotationDocument) => {
    const hasNumber = document.document_number.trim() !== '';
    const hasAmount = document.amount !== null && document.amount > 0;
    return !hasNumber || (hasNumber && hasAmount);
  };
  
  const addQuotationDocument = () => {
    onQuotationDocumentsChange([...quotationDocuments, { document_number: '', amount: null, delivery_fee: null }]);
  };

  const removeQuotationDocument = (index: number) => {
    const newDocuments = quotationDocuments.filter((_, i) => i !== index);
    onQuotationDocumentsChange(newDocuments);
  };

  const updateQuotationDocument = (index: number, field: 'document_number' | 'amount' | 'delivery_fee', value: string | number | null) => {
    const newDocuments = [...quotationDocuments];
    newDocuments[index] = { ...newDocuments[index], [field]: value };
    onQuotationDocumentsChange(newDocuments);
  };

  const addInvoiceDocument = () => {
    onInvoiceDocumentsChange([...invoiceDocuments, { document_number: '', amount: null, delivery_fee: null }]);
  };

  const removeInvoiceDocument = (index: number) => {
    const newDocuments = invoiceDocuments.filter((_, i) => i !== index);
    onInvoiceDocumentsChange(newDocuments);
  };

  const updateInvoiceDocument = (index: number, field: 'document_number' | 'amount' | 'delivery_fee', value: string | number | null) => {
    const newDocuments = [...invoiceDocuments];
    newDocuments[index] = { ...newDocuments[index], [field]: value };
    onInvoiceDocumentsChange(newDocuments);
  };

  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">5. ออกใบเสนอราคา (QT)</h3>
      <div className="space-y-2">
        <div className="space-y-2">
          <Label htmlFor="canIssueQt">สามารถออกใบเสนอราคาได้</Label>
          <Select 
            value={canIssueQt === null ? '' : canIssueQt ? 'yes' : 'no'} 
            onValueChange={(value) => {
              if (value === 'yes') {
                onCanIssueQtChange(true);
              } else if (value === 'no') {
                onCanIssueQtChange(false);
              } else {
                onCanIssueQtChange(null);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">สามารถออกใบเสนอราคาได้</SelectItem>
              <SelectItem value="no">ไม่สามารถออกใบเสนอราคาได้</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canIssueQt === false && (
          <div className="space-y-2">
            <Label htmlFor="qtFailReason">เหตุผลที่ไม่สามารถออกใบเสนอราคาได้</Label>
            <Select value={qtFailReason} onValueChange={onQtFailReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเหตุผล" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="รอข้อมูลเพิ่มเติม">รอข้อมูลเพิ่มเติม</SelectItem>
                <SelectItem value="รอการอนุมัติ">รอการอนุมัติ</SelectItem>
                <SelectItem value="ลูกค้ายังไม่ตัดสินใจ">ลูกค้ายังไม่ตัดสินใจ</SelectItem>
                <SelectItem value="ราคาไม่เหมาะสม">ราคาไม่เหมาะสม</SelectItem>
                <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {canIssueQt === true && (
          <div className="space-y-4">
            {/* แสดง QT, Invoice และ ดาวน์/ฟรีดาวน์ แบ่งซ้ายขวา */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* ฝั่งซ้าย - มีใบเสนอราคา (QT) */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasQt"
                  checked={hasQt}
                  onCheckedChange={onHasQtChange}
                />
                <Label htmlFor="hasQt">มีใบเสนอราคา (QT)</Label>
              </div>

              {/* กลาง - ดาวน์/ฟรีดาวน์ */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_zero_down_payment"
                  checked={isZeroDownPayment}
                  onCheckedChange={(checked) => onIsZeroDownPaymentChange(checked === true)}
                />
                <Label htmlFor="is_zero_down_payment" className="cursor-pointer">ดาวน์/ฟรีดาวน์</Label>
              </div>

              {/* ฝั่งขวา - มีใบแจ้งหนี้ (Invoice) */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasInv"
                  checked={hasInv}
                  onCheckedChange={onHasInvChange}
                />
                <Label htmlFor="hasInv">มีใบแจ้งหนี้ (Invoice)</Label>
              </div>
            </div>

            {/* แสดง QT และ Invoice แบ่งครึ่งกันซ้ายขวา */}
            {(hasQt || hasInv) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ฝั่งซ้าย - หมายเลข Quotation */}
                {hasQt && (
                  <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <Label className="text-sm font-medium text-blue-900">หมายเลขใบเสนอราคา</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addQuotationDocument}
                        className="h-7 px-2 ml-auto"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        เพิ่ม
                      </Button>
                    </div>
                    {quotationDocuments.length === 0 && (
                      <div className="text-sm text-gray-500 bg-blue-100 p-2 rounded">ยังไม่มีหมายเลขใบเสนอราคา</div>
                    )}
                    <div className="space-y-3">
                      {quotationDocuments.map((document, index) => {
                        const isValid = validateQuotationDocument(document);
                        const hasNumber = document.document_number.trim() !== '';
                        const showError = hasNumber && !isValid;
                        
                        return (
                          <div key={index} className="p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-2">
                              {/* แถวแรก: หมายเลขเอกสาร */}
                              <Input
                                placeholder="หมายเลขใบเสนอราคา..."
                                value={document.document_number}
                                onChange={(e) => updateQuotationDocument(index, 'document_number', e.target.value)}
                                className="w-full text-sm"
                              />
                              
                              {/* แถวที่สอง: ยอดเงิน, ค่าจัดส่ง (wholesale), และค่าเงินดาวน์ (ถ้าเป็นดาวน์/ฟรีดาวน์) */}
                              <div className="flex gap-2">
                                {/* ยอดเงิน */}
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-600 mb-1">ยอดเงิน (สินค้า)</Label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      value={document.amount || ''}
                                      onChange={(e) => updateQuotationDocument(index, 'amount', e.target.value ? parseFloat(e.target.value) : null)}
                                      className={`text-sm ${showError ? 'border-red-500 focus:border-red-500' : ''}`}
                                    />
                                    <span className="text-xs text-gray-500">฿</span>
                                  </div>
                                </div>
                                
                                {/* ค่าจัดส่ง - แสดงเฉพาะ Wholesale */}
                                {isWholesale && (
                                  <div className="flex-1">
                                    <Label className="text-xs text-gray-600 mb-1">ค่าจัดส่ง</Label>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={document.delivery_fee || ''}
                                        onChange={(e) => updateQuotationDocument(index, 'delivery_fee', e.target.value ? parseFloat(e.target.value) : null)}
                                        className="text-sm"
                                      />
                                      <span className="text-xs text-gray-500">฿</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* ค่าเงินดาวน์ - แสดงเมื่อติ๊กดาวน์/ฟรีดาวน์ และเป็น QT แรก */}
                                {isZeroDownPayment && index === 0 && (
                                  <div className="flex-1">
                                    <Label className="text-xs text-gray-600 mb-1">ค่าเงินดาวน์</Label>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={downPaymentAmount || ''}
                                        onChange={(e) => onDownPaymentAmountChange(e.target.value ? parseFloat(e.target.value) : null)}
                                        className="text-sm"
                                      />
                                      <span className="text-xs text-gray-500">฿</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* ปุ่มลบ */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeQuotationDocument(index)}
                                  className="h-auto w-9 p-0 self-end"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Error message */}
                              {showError && (
                                <div className="text-xs text-red-600 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>กรุณากรอกยอดเงินเมื่อมีหมายเลขเอกสาร</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ฝั่งขวา - หมายเลข Invoice */}
                {hasInv && (
                  <div className="space-y-3 bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Receipt className="h-5 w-5 text-purple-600" />
                      <Label className="text-sm font-medium text-purple-900">หมายเลข Invoice</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addInvoiceDocument}
                        className="h-7 px-2 ml-auto"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        เพิ่ม
                      </Button>
                    </div>
                    {invoiceDocuments.length === 0 && (
                      <div className="text-sm text-gray-500 bg-purple-100 p-2 rounded">ยังไม่มีหมายเลข Invoice</div>
                    )}
                    <div className="space-y-3">
                      {invoiceDocuments.map((document, index) => {
                        const isValid = validateInvoiceDocument(document);
                        const hasNumber = document.document_number.trim() !== '';
                        const showError = hasNumber && !isValid;
                        
                        return (
                          <div key={index} className="p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-2">
                              {/* แถวแรก: หมายเลขเอกสาร */}
                              <Input
                                placeholder="หมายเลข Invoice..."
                                value={document.document_number}
                                onChange={(e) => updateInvoiceDocument(index, 'document_number', e.target.value)}
                                className="w-full text-sm"
                              />
                              
                              {/* แถวที่สอง: ยอดเงิน และ ค่าจัดส่ง (ถ้าเป็น wholesale) */}
                              <div className="flex gap-2">
                                {/* ยอดเงิน */}
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-600 mb-1">ยอดเงิน (สินค้า)</Label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      value={document.amount || ''}
                                      onChange={(e) => updateInvoiceDocument(index, 'amount', e.target.value ? parseFloat(e.target.value) : null)}
                                      className={`text-sm ${showError ? 'border-red-500 focus:border-red-500' : ''}`}
                                    />
                                    <span className="text-xs text-gray-500">฿</span>
                                  </div>
                                </div>
                                
                                {/* ค่าจัดส่ง - แสดงเฉพาะ Wholesale */}
                                {isWholesale && (
                                  <div className="flex-1">
                                    <Label className="text-xs text-gray-600 mb-1">ค่าจัดส่ง</Label>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={document.delivery_fee || ''}
                                        onChange={(e) => updateInvoiceDocument(index, 'delivery_fee', e.target.value ? parseFloat(e.target.value) : null)}
                                        className="text-sm"
                                      />
                                      <span className="text-xs text-gray-500">฿</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* ปุ่มลบ */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeInvoiceDocument(index)}
                                  className="h-auto w-9 p-0 self-end"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Error message */}
                              {showError && (
                                <div className="text-xs text-red-600 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>กรุณากรอกยอดเงินเมื่อมีหมายเลขเอกสาร</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationIssuingSection;