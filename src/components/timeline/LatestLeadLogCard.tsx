import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/utils/dashboardUtils";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Hash, MessageSquare, FileText, CreditCard, Zap, Receipt } from "lucide-react";
import { getActivityIcon, getActivityTitle } from "@/utils/leadTimelineUtils";
import { useNavigate } from 'react-router-dom';

interface LatestLeadLogCardProps {
  latestLog: any;
  leadId: number;
  leadName: string;
  leadStatus?: string;
  operationStatus?: string;
  salesOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LatestLeadLogCard = ({ 
  latestLog, 
  leadId, 
  leadName, 
  leadStatus, 
  operationStatus, 
  salesOwnerName, 
  createdAt, 
  updatedAt 
}: LatestLeadLogCardProps) => {
  const navigate = useNavigate();

  if (!latestLog) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">สถานะและการติดตาม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* No Follow-up Section */}
            <div className="text-center py-4 border-b border-gray-100">
              <MessageSquare className="h-8 w-8 mx-auto text-gray-400 mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">ยังไม่มีประวัติการติดตาม</h3>
              <p className="text-xs text-gray-600">เริ่มต้นบันทึกการติดตามลีดรายนี้</p>
            </div>

            {/* Status Summary */}
            <div className="space-y-2">
              {leadStatus && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700">สถานะลูกค้า</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {leadStatus}
                  </Badge>
                </div>
              )}
              {operationStatus && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700">สถานะการดำเนินการ</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {operationStatus}
                  </Badge>
                </div>
              )}
              {salesOwnerName && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700">ผู้ดูแลการขาย</span>
                  <span className="text-xs text-gray-900">{salesOwnerName}</span>
                </div>
              )}
              {createdAt && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700">วันที่สร้าง</span>
                  <span className="text-xs text-gray-900">
                    {(() => {
                      const date = new Date(createdAt);
                      const year = date.getFullYear();
                      const month = date.getMonth() + 1;
                      const day = date.getDate();
                      
                      // แสดงผลแบบไทย
                      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                      return `${day} ${monthNames[month - 1]} ${year}`;
                    })()}
                  </span>
                </div>
              )}
              {updatedAt && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-700">อัปเดตล่าสุด</span>
                  <span className="text-xs text-gray-900">
                    {(() => {
                      const date = new Date(updatedAt);
                      const year = date.getFullYear();
                      const month = date.getMonth() + 1;
                      const day = date.getDate();
                      
                      // แสดงผลแบบไทย
                      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                      return `${day} ${monthNames[month - 1]} ${year}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = getActivityIcon(latestLog);
  const activityTitle = getActivityTitle(latestLog);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">สถานะและการติดตาม</CardTitle>
          <Button 
            onClick={() => navigate(`/lead-timeline/${leadId}`)}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            ดูทั้งหมด
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Latest Follow-up Section */}
          <div className="border-b border-gray-100 pb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <IconComponent className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">
                    {activityTitle}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Hash className="h-3 w-3" />
                    <span>การติดตามล่าสุด</span>
                  </div>
                </div>
              </div>
              
              {latestLog.status && (
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium px-2 py-1 border bg-white"
                >
                  {latestLog.status}
                </Badge>
              )}
            </div>

            {/* Date and Time */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                <Calendar className="h-3 w-3" />
                <span>{(() => {
                  return formatDate(latestLog.created_at_thai);
                })()}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                <Clock className="h-3 w-3" />
                <span>{(() => {
                  return formatTime(latestLog.created_at_thai);
                })()}</span>
              </div>
            </div>

            {/* Content Summary */}
            <div className="space-y-3">

              {/* Contact Status */}
              {latestLog.contact_status && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs font-medium text-blue-800">สถานะการติดต่อ</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {latestLog.contact_status}
                  </Badge>
                </div>
              )}

              {/* Next Follow Up */}
              {(latestLog.next_follow_up_thai || latestLog.next_follow_up) && (
                <div className="p-2 bg-green-50 rounded-lg">
                  <div className="text-xs font-medium text-green-800 mb-1">การติดตามครั้งต่อไป</div>
                  <div className="text-xs text-green-700">
                    {formatDate(latestLog.next_follow_up_thai || latestLog.next_follow_up)} {formatTime(latestLog.next_follow_up_thai || latestLog.next_follow_up)}
                  </div>
                  {latestLog.next_follow_up_details && (
                    <div className="text-xs text-green-600 mt-1">{latestLog.next_follow_up_details}</div>
                  )}
                </div>
              )}

              {/* Notes */}
              {latestLog.note && (
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-800 mb-1">รายละเอียดการติดตาม</div>
                  <div className="text-xs text-gray-700 line-clamp-3">{latestLog.note}</div>
                </div>
              )}

              {/* Special Sections */}
              {latestLog.appointments && latestLog.appointments.length > 0 && (
                <div className="p-2 bg-purple-50 rounded-lg">
                  <div className="text-xs font-medium text-purple-800 mb-1">การนัดหมาย</div>
                  <div className="text-xs text-purple-700">
                    มีการนัดหมาย {latestLog.appointments.length} ครั้ง
                  </div>
                </div>
              )}

              {/* Quotation Information */}
              {(latestLog.quotations && latestLog.quotations.length > 0) || 
               (latestLog.quotation_documents && latestLog.quotation_documents.length > 0) ||
               (latestLog.can_issue_qt !== null || latestLog.qt_fail_reason) ? (
                <div className="p-2 bg-yellow-50 rounded-lg border">
                  <div className="flex items-center gap-1 mb-2">
                    <FileText className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-800">ข้อมูลเสนอราคา</span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* สถานะการออกใบเสนอราคา */}
                    {(latestLog.can_issue_qt !== null || latestLog.qt_fail_reason) && (
                      <div className="flex items-center gap-2 bg-white p-2 rounded border">
                        <span className="text-xs text-gray-600">สามารถออกใบเสนอราคา:</span>
                        <Badge variant={latestLog.can_issue_qt ? 'default' : 'destructive'} className="text-xs px-1 py-0">
                          {latestLog.can_issue_qt ? 'ได้' : 'ไม่ได้'}
                        </Badge>
                        {latestLog.qt_fail_reason && (
                          <span className="text-red-600 text-xs">({latestLog.qt_fail_reason})</span>
                        )}
                      </div>
                    )}
                    
                    {/* แสดงข้อมูลจาก quotations table */}
                    {latestLog.quotations && latestLog.quotations.map((qt: any, index: number) => {
                      // Filter เอกสารตาม productivity_log_id ของ log นั้นๆ
                      const quotationDocs = latestLog.quotation_documents?.filter((doc: any) => 
                        doc.document_type === 'quotation' && 
                        doc.productivity_log_id === latestLog.id
                      ) || [];
                      
                      const invoiceDocs = latestLog.quotation_documents?.filter((doc: any) => 
                        doc.document_type === 'invoice' && 
                        doc.productivity_log_id === latestLog.id
                      ) || [];
                      
                      return (
                        <div key={index} className="bg-white p-2 rounded border">
                          <div className="grid grid-cols-2 gap-2">
                            {/* ข้อมูล QT */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-blue-600" />
                                <span className="text-xs font-medium text-blue-900">QT</span>
                                <Badge variant={qt.has_qt ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                                  {qt.has_qt ? 'มี' : 'ไม่มี'}
                                </Badge>
                              </div>
                              
                              {/* แสดงหมายเลขเอกสาร QT จาก quotation_documents เป็นหลัก */}
                              {quotationDocs.length > 0 ? (
                                <div className="space-y-0.5">
                                  {quotationDocs.map((doc: any, docIndex: number) => (
                                    <div key={docIndex} className="text-xs bg-blue-100 px-2 py-1.5 rounded space-y-1">
                                      <div className="text-blue-700 font-mono font-semibold">
                                        {doc.document_number}
                                      </div>
                                      {(doc.amount || doc.delivery_fee) && (
                                        <div className="flex flex-wrap gap-1.5 text-xs">
                                          {doc.amount && (
                                            <span className="text-green-700 font-medium">
                                              ฿{Number(doc.amount).toLocaleString()}
                                            </span>
                                          )}
                                          {doc.delivery_fee && Number(doc.delivery_fee) > 0 && (
                                            <span className="text-orange-600 font-medium">
                                              +ค่าส่ง ฿{Number(doc.delivery_fee).toLocaleString()}
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
                                <span className="text-xs font-medium text-purple-900">INV</span>
                                <Badge variant={qt.has_inv ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                                  {qt.has_inv ? 'มี' : 'ไม่ได้'}
                                </Badge>
                              </div>
                              
                              {/* แสดงหมายเลขเอกสาร INV จาก quotation_documents เป็นหลัก */}
                              {invoiceDocs.length > 0 ? (
                                <div className="space-y-0.5">
                                  {invoiceDocs.map((doc: any, docIndex: number) => (
                                    <div key={docIndex} className="text-xs bg-purple-100 px-2 py-1.5 rounded space-y-1">
                                      <div className="text-purple-700 font-mono font-semibold">
                                        {doc.document_number}
                                      </div>
                                      {(doc.amount || doc.delivery_fee) && (
                                        <div className="flex flex-wrap gap-1.5 text-xs">
                                          {doc.amount && (
                                            <span className="text-green-700 font-medium">
                                              ฿{Number(doc.amount).toLocaleString()}
                                            </span>
                                          )}
                                          {doc.delivery_fee && Number(doc.delivery_fee) > 0 && (
                                            <span className="text-orange-600 font-medium">
                                              +ค่าส่ง ฿{Number(doc.delivery_fee).toLocaleString()}
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
                          
                          {/* ข้อมูลทางการเงิน */}
                          {(qt.total_amount || qt.payment_method) && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-3">
                              {qt.total_amount && (
                                <div className="flex items-center gap-1">
                                  {/* <Zap className="h-3 w-3 text-green-600" /> */}
                                  <span className="text-xs text-gray-600">ยอด:</span>
                                  <span className="text-xs font-medium text-green-600">
                                    {Number(qt.total_amount).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {qt.payment_method && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">ชำระ:</span>
                                  <span className="text-xs font-medium">{qt.payment_method}</span>
                                </div>
                              )}
                              {(qt.installment_percent || qt.installment_periods) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">ผ่อน:</span>
                                  <span className="text-xs font-medium">
                                    {qt.installment_percent ? `${qt.installment_percent}%` : ''}
                                    {qt.installment_periods ? ` ${qt.installment_periods}งวด` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* วันที่คาดการณ์ชำระ */}
                          {qt.estimate_payment_date && (
                            <div className="mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-600">คาดการณ์:</span>
                              <span className="text-xs font-medium">{qt.estimate_payment_date}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {latestLog.lead_products && latestLog.lead_products.length > 0 && (
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <div className="text-xs font-medium text-indigo-800 mb-1">ผลิตภัณฑ์ที่เสนอ</div>
                  <div className="text-xs text-indigo-700">
                    {latestLog.lead_products.length} รายการ
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="space-y-2">
            {leadStatus && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-700">สถานะลูกค้า</span>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {leadStatus}
                </Badge>
              </div>
            )}
            {operationStatus && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-700">สถานะการดำเนินการ</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {operationStatus}
                </Badge>
              </div>
            )}
            {salesOwnerName && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-700">ผู้ดูแลการขาย</span>
                <span className="text-xs text-gray-900">{salesOwnerName}</span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-700">วันที่สร้าง</span>
                <span className="text-xs text-gray-900">
                  {(() => {
                    const date = new Date(createdAt);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    
                    // แสดงผลแบบไทย
                    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                    return `${day} ${monthNames[month - 1]} ${year}`;
                  })()}
                </span>
              </div>
            )}
            {updatedAt && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-700">อัปเดตล่าสุด</span>
                <span className="text-xs text-gray-900">
                  {(() => {
                    const date = new Date(updatedAt);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    
                    // แสดงผลแบบไทย
                    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                    return `${day} ${monthNames[month - 1]} ${year}`;
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestLeadLogCard; 