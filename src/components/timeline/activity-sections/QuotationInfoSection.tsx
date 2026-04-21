
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, DollarSign, Calendar } from "lucide-react";

interface QuotationInfoSectionProps {
  quotations: any[] | null;
  documents: any[] | null;
  canIssueQt: boolean | null;
  qtFailReason: string | null;
  productivityLogId?: number;
  isZeroDownPayment?: boolean | null;
  downPaymentAmount?: number | null;
}

const QuotationInfoSection = ({ quotations, documents, canIssueQt, qtFailReason, productivityLogId, isZeroDownPayment, downPaymentAmount }: QuotationInfoSectionProps) => {
  const hasQuotation = quotations && quotations.length > 0;
  const hasDocuments = documents && documents.length > 0;
  const hasQtInfo = canIssueQt !== null || qtFailReason;
  
  // Filter เอกสารตาม productivity_log_id ของ log นั้นๆ
  const quotationDocs = documents?.filter(doc => 
    doc.document_type === 'quotation' && 
    doc.productivity_log_id === productivityLogId
  ) || [];
  
  const invoiceDocs = documents?.filter(doc => 
    doc.document_type === 'invoice' && 
    doc.productivity_log_id === productivityLogId
  ) || [];
  
  if (!hasQuotation && !hasQtInfo && !hasDocuments) return null;
  
  return (
    <div className="bg-yellow-50 p-2 rounded border">
      <div className="flex items-center gap-1 mb-2">
        <FileText className="h-3 w-3 text-yellow-600" />
        <span className="font-medium text-yellow-900 text-sm">ข้อมูลเสนอราคา</span>
      </div>
      
      <div className="space-y-2 text-xs">
        {/* สถานะการออกใบเสนอราคา */}
        {hasQtInfo && (
          <div className="flex items-center gap-2 bg-white p-2 rounded border">
            <span className="text-gray-600">สามารถออกใบเสนอราคา:</span>
            <Badge variant={canIssueQt ? 'default' : 'destructive'} className="text-xs px-1 py-0">
              {canIssueQt ? 'ได้' : 'ไม่ได้'}
            </Badge>
            {qtFailReason && (
              <span className="text-red-600 text-xs">({qtFailReason})</span>
            )}
          </div>
        )}
        
        {/* แสดงข้อมูลจาก quotations table */}
        {hasQuotation && quotations?.map((qt, index) => (
          <div key={index} className="bg-white p-2 rounded border">
            <div className="grid grid-cols-2 gap-3">
              {/* ข้อมูล QT */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-600" />
                  <span className="font-medium text-blue-900">QT</span>
                  <Badge variant={qt.has_qt ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                    {qt.has_qt ? 'มี' : 'ไม่มี'}
                  </Badge>
                </div>
                
                {/* แสดงหมายเลขเอกสาร QT จาก quotation_documents เป็นหลัก */}
                {quotationDocs.length > 0 ? (
                  <div className="space-y-0.5">
                    {quotationDocs.map((doc, docIndex) => (
                      <div key={docIndex} className="text-xs bg-blue-100 px-2 py-1.5 rounded space-y-1">
                        <div className="text-blue-700 font-mono font-semibold">
                          {doc.document_number}
                        </div>
                        {(doc.amount || doc.delivery_fee) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {doc.amount && (
                              <span className="text-green-700 font-medium">
                                สินค้า: ฿{Number(doc.amount).toLocaleString()}
                              </span>
                            )}
                            {doc.delivery_fee && Number(doc.delivery_fee) > 0 && (
                              <span className="text-orange-600 font-medium">
                                ค่าส่ง: ฿{Number(doc.delivery_fee).toLocaleString()}
                              </span>
                            )}
                            {doc.amount && doc.delivery_fee && Number(doc.delivery_fee) > 0 && (
                              <span className="text-blue-800 font-semibold border-l border-blue-300 pl-2">
                                รวม: ฿{(Number(doc.amount) + Number(doc.delivery_fee)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ไม่มีเอกสาร QT */
                  <div className="text-xs text-gray-500 italic">ไม่มีเอกสาร QT</div>
                )}
              </div>
              
              {/* ข้อมูล INV */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Receipt className="h-3 w-3 text-purple-600" />
                  <span className="font-medium text-purple-900">INV</span>
                  <Badge variant={qt.has_inv ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                    {qt.has_inv ? 'มี' : 'ไม่มี'}
                  </Badge>
                </div>
                
                {/* แสดงหมายเลขเอกสาร INV จาก quotation_documents เป็นหลัก */}
                {invoiceDocs.length > 0 ? (
                  <div className="space-y-0.5">
                    {invoiceDocs.map((doc, docIndex) => (
                      <div key={docIndex} className="text-xs bg-purple-100 px-2 py-1.5 rounded space-y-1">
                        <div className="text-purple-700 font-mono font-semibold">
                          {doc.document_number}
                        </div>
                        {(doc.amount || doc.delivery_fee) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {doc.amount && (
                              <span className="text-green-700 font-medium">
                                สินค้า: ฿{Number(doc.amount).toLocaleString()}
                              </span>
                            )}
                            {doc.delivery_fee && Number(doc.delivery_fee) > 0 && (
                              <span className="text-orange-600 font-medium">
                                ค่าส่ง: ฿{Number(doc.delivery_fee).toLocaleString()}
                              </span>
                            )}
                            {doc.amount && doc.delivery_fee && Number(doc.delivery_fee) > 0 && (
                              <span className="text-purple-800 font-semibold border-l border-purple-300 pl-2">
                                รวม: ฿{(Number(doc.amount) + Number(doc.delivery_fee)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ไม่มีเอกสาร INV */
                  <div className="text-xs text-gray-500 italic">ไม่มีเอกสาร INV</div>
                )}
              </div>
            </div>
            
            {/* ข้อมูลทางการเงิน - แสดงในบรรทัดเดียว */}
            {(qt.total_amount || qt.payment_method) && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-4">
                {qt.total_amount && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-gray-600">จำนวน:</span>
                    <span className="font-medium text-green-600">
                      {Number(qt.total_amount).toLocaleString()}
                    </span>
                  </div>
                )}
                {qt.payment_method && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">ชำระ:</span>
                    <span className="font-medium">{qt.payment_method}</span>
                  </div>
                )}
                {isZeroDownPayment && (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                      ดาวน์/ฟรีดาวน์
                    </Badge>
                    {downPaymentAmount && (
                      <span className="text-xs text-blue-700 font-medium">
                        ({downPaymentAmount.toLocaleString()} บาท)
                      </span>
                    )}
                  </div>
                )}
                {/* ข้อมูลผ่อนชำระแบบย่อ */}
                {(qt.installment_percent || qt.installment_periods) && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">ผ่อน:</span>
                    <span className="font-medium">
                      {qt.installment_percent ? `${qt.installment_percent}%` : ''}
                      {qt.installment_periods ? ` ${qt.installment_periods}งวด` : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* วันที่คาดการณ์ชำระ */}
            {qt.estimate_payment_date && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">คาดการณ์:</span>
                <span className="font-medium">{qt.estimate_payment_date}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuotationInfoSection;
