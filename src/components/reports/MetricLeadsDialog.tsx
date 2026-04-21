import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCategoryBadgeClassName } from "@/utils/categoryBadgeUtils";

interface Lead {
  id: number;
  full_name: string;
  tel: string;
  platform: string;
  region: string;
  status: string;
  category: string;
  sale_owner_id: number;
  created_at_thai: string;
  // เพิ่มข้อมูลสำหรับ quotation logs
  quotationLogs?: Array<{
    logId: number;
    logDate: string;
    quotationAmount: number;
    quotationCount: number;
  }>;
}

interface MetricLeadsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leads: Lead[];
  metricType: 'quotation' | 'contactable' | 'uncontactable' | 'appointment';
}

const MetricLeadsDialog = ({ isOpen, onClose, title, leads, metricType }: MetricLeadsDialogProps) => {
  const navigate = useNavigate();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ปิดการขาย': return 'bg-green-100 text-green-800';
      case 'รอรับ': return 'bg-yellow-100 text-yellow-800';
      case 'อยู่ระหว่างการติดต่อ': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform?.toLowerCase() || '';
    if (platformLower.includes('phone') || platformLower.includes('tel')) {
      return <Phone className="h-3 w-3" />;
    }
    if (platformLower.includes('line')) {
      return <MessageCircle className="h-3 w-3" />;
    }
    return null;
  };

  const handleViewLead = (leadId: number, category: string) => {
    const categoryPath = category === 'Package' ? 'package' : 'wholesale';
    navigate(`/${categoryPath}/leads/${leadId}/timeline`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{title}</span>
            <Badge variant="outline" className="text-xs">
              {leads.length} รายการ
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {leads.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <div className="text-center">
                <div className="text-lg font-medium">ไม่มีข้อมูล</div>
                <div className="text-sm">ไม่พบลีดที่ตรงกับเงื่อนไขนี้</div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>แพลตฟอร์ม</TableHead>
                  <TableHead>จังหวัด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  {metricType === 'quotation' && <TableHead>รายละเอียด QT</TableHead>}
                  <TableHead className="w-[100px]">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-mono text-xs">
                      #{lead.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.full_name || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getPlatformIcon(lead.platform)}
                        <span className="text-sm">{lead.tel || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.platform || 'ไม่ระบุ'}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.region || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusBadgeColor(lead.status)}`}>
                        {lead.status || 'ไม่ระบุ'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getCategoryBadgeClassName(lead.category)}
                      >
                        {lead.category || 'ไม่ระบุ'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatDate(lead.created_at_thai)}
                    </TableCell>
                    {metricType === 'quotation' && (
                      <TableCell>
                        {lead.quotationLogs && lead.quotationLogs.length > 0 ? (
                          <div className="space-y-1">
                            {lead.quotationLogs.map((log, index) => (
                              <div key={index} className="text-xs bg-blue-50 p-2 rounded border">
                                <div className="font-medium text-blue-800">
                                  ฿{log.quotationAmount.toLocaleString()}
                                </div>
                                <div className="text-blue-600">
                                  {log.quotationCount} QT • {formatDate(log.logDate)}
                                </div>
                                <div className="text-blue-500 text-xs">
                                  Log #{log.logId}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">ไม่มีข้อมูล</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewLead(lead.id, lead.category)}
                        className="h-7 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        ติดตาม
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetricLeadsDialog;