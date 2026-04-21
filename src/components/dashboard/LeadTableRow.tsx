import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Calendar, UserCheck, FlameKindling, Eye, Clock, Edit, Trash2, ArrowRightLeft } from "lucide-react";
import { getStatusIcon, getStatusColor, getPlatformIcon, formatDate, formatDateTime } from "@/utils/dashboardUtils";
import LeadActionsCell from "./LeadActionsCell";
import { getLeadStatusColor, getOperationStatusColor } from "@/utils/leadStatusUtils";
import { useNavigate } from "react-router-dom";

interface LeadTableRowProps {
  lead: any;
  currentSalesMember: any;
  getSalesMemberName: (salesOwnerId: number) => string;
  onAcceptLead: (leadId: number) => void;
  onTransferLead?: (leadId: number, newCategory: string) => void; // เพิ่ม prop สำหรับโอนลีด
  onEditLead?: (leadId: number) => void; // เพิ่ม prop สำหรับแก้ไขลีด
  onDeleteLead?: (leadId: number) => void; // เพิ่ม prop สำหรับลบลีด
  isAcceptingLead: boolean;
  isTransferringLead?: boolean; // เพิ่ม prop สำหรับ loading state
  hideActions?: boolean;
  showRegion?: boolean;
  isMyLeads?: boolean; // เพิ่ม prop สำหรับหน้า MyLeads
  showAcceptLeadColumn?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดงคอลัมน์รับ Lead
  showAssignColumn?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดงคอลัมน์มอบหมายให้
  showActionsColumn?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดงคอลัมน์จัดการ
  creatorNames?: { [key: string]: string }; // เพิ่ม prop สำหรับชื่อผู้ที่เพิ่มลีด
}

const LeadTableRow = ({
  lead,
  currentSalesMember,
  getSalesMemberName,
  onAcceptLead,
  onTransferLead,
  onEditLead,
  onDeleteLead,
  isAcceptingLead,
  isTransferringLead = false,
  hideActions = false,
  showRegion = false,
  isMyLeads = false,
  showAcceptLeadColumn = true,
  showAssignColumn = true,
  showActionsColumn = true,
  creatorNames
}: LeadTableRowProps) => {
  const navigate = useNavigate();
  const statusIcon = getStatusIcon(lead.status || '');

  const handleViewDetails = () => {
    if (lead.category === 'Wholesales' || lead.category === 'Wholesale') {
      navigate(`/wholesale/leads/${lead.id}`);
    } else {
      navigate(`/leads/${lead.id}`);
    }
  };

  const handleViewTimeline = () => {
    if (lead.category === 'Wholesales' || lead.category === 'Wholesale') {
      navigate(`/wholesale/leads/${lead.id}/timeline`);
    } else {
      navigate(`/leads/${lead.id}/timeline`);
    }
  };

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="w-20 min-w-20 max-w-20">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{lead.platform || 'ไม่ระบุ'}</span>
          {lead.is_from_ppa_project && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
              PPA
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="w-40 min-w-40">
        <div className="space-y-1">
          <div className="font-medium text-gray-900">
            {lead.full_name || 'ไม่ระบุชื่อ'}
          </div>
          {lead.display_name && (
            <div className="text-sm text-gray-500">
              ({lead.display_name})
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="w-32 min-w-32">
        <span className="text-sm">{lead.category || 'ไม่ระบุ'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {lead.avg_electricity_bill ? `${lead.avg_electricity_bill} บาท` : 'ไม่ระบุ'}
        </span>
      </TableCell>
      <TableCell className="font-mono">
        <div className="space-y-1">
          {lead.tel && (
            <div className="text-sm text-blue-600">📞 {lead.tel}</div>
          )}
          {lead.line_id && (
            <div className="text-sm text-green-600">💬 Line: {lead.line_id}</div>
          )}
          {!lead.tel && !lead.line_id && (
            <div className="text-sm text-gray-500">ไม่มีข้อมูลติดต่อ</div>
          )}
        </div>
      </TableCell>
      {showRegion && (
        <TableCell>
          <span className="text-sm">{lead.region || 'ไม่ระบุ'}</span>
        </TableCell>
      )}
      <TableCell>
        <div className="max-w-xs">
          {lead.notes ? (
            <span className="text-sm text-gray-700 leading-relaxed">
              {lead.notes.length > 100 
                ? `${lead.notes.substring(0, 100)}...` 
                : lead.notes
              }
            </span>
          ) : (
            <span className="text-sm text-gray-400 italic">ไม่มีข้อมูล</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          {lead.latest_productivity_log?.note ? (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">
                {(() => {
                  const dateStr = lead.latest_productivity_log.created_at_thai;
                  if (!dateStr) return '';
                  
                  // แปลงจาก 2025-09-17T11:34:08.370852+00:00 เป็น 17/09/2025 , 11:34
                  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
                  if (match) {
                    const [, year, month, day, hours, minutes] = match;
                    return `${day}/${month}/${year} , ${hours}:${minutes}`;
                  }
                  
                  return dateStr; // fallback ถ้าไม่ match
                })()}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {lead.latest_productivity_log.note.length > 80 
                  ? `${lead.latest_productivity_log.note.substring(0, 80)}...` 
                  : lead.latest_productivity_log.note
                }
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">ยังไม่มีการติดตาม</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge className={`${getLeadStatusColor(lead.status || '')} flex items-center gap-1 w-fit`}>
            {statusIcon}
            {lead.status || 'ไม่ระบุ'}
          </Badge>
          {lead.operation_status && (
            <Badge variant="outline" className={`${getOperationStatusColor(lead.operation_status)} flex items-center gap-1 w-fit text-xs`}>
              {lead.operation_status}
            </Badge>
          )}
        </div>
      </TableCell>
      {isMyLeads && (
        <TableCell>
          <Badge variant="outline" className={`flex items-center gap-1 w-fit text-xs ${
            lead.latest_productivity_log 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {lead.latest_productivity_log ? 'โทรแล้ว' : 'ยังไม่เคยโทร'}
          </Badge>
        </TableCell>
      )}
      <TableCell>
        <div className="text-sm text-blue-600">
          {lead.creator_name ? (
            <span className="font-medium text-blue-700">{lead.creator_name}</span>
          ) : lead.created_by && creatorNames ? (
            <span className="font-medium text-blue-700">{creatorNames[lead.created_by] || lead.created_by}</span>
          ) : lead.created_by ? (
            <span className="font-medium text-blue-700">{lead.created_by}</span>
          ) : (
            <span className="text-blue-500">ไม่ระบุ</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          {isMyLeads ? (
            // สำหรับหน้า MyLeads แสดง updated_at_thai (อัพเดทล่าสุด)
            lead.updated_at_thai ? formatDateTime(lead.updated_at_thai) : 
            (lead.created_at_thai ? formatDateTime(lead.created_at_thai) : 'ไม่ระบุ')
          ) : (
            // สำหรับหน้าอื่นๆ แสดง created_at_thai (วันที่บันทึก) พร้อมเวลา
            lead.created_at_thai ? formatDateTime(lead.created_at_thai) : 'ไม่ระบุ'
          )}
        </div>
      </TableCell>
      {/* Action columns */}
      {!hideActions && showAcceptLeadColumn && !isMyLeads && (
        <TableCell>
          {!lead.sale_owner_id ? (
            <Button
              size="sm"
              onClick={() => onAcceptLead(lead.id)}
              disabled={isAcceptingLead}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              {isAcceptingLead ? 'กำลังรับ...' : 'กดรับ'}
            </Button>
          ) : (
          <span className="text-sm text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-md shadow-sm">
            รับแล้ว
          </span>
          )}
        </TableCell>
      )}
      {/* Column มอบหมายให้ - แสดงในหน้าจัดการลีด และแสดงรายละเอียดในหน้าลีดของฉัน */}
      {!hideActions && showAssignColumn && (
        <TableCell>
          {isMyLeads ? (
            <div className="space-y-1">
              <div className="text-sm font-medium text-green-700">
                {getSalesMemberName(lead.sale_owner_id)}
              </div>
              <div className="text-xs text-gray-500">
                รับเมื่อ: {lead.created_at_thai ? formatDate(lead.created_at_thai) : 'ไม่ระบุ'}
              </div>
            </div>
          ) : (
            lead.sale_owner_id ? (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  getSalesMemberName(lead.sale_owner_id) === 'กำลังโหลด...' 
                    ? 'text-gray-400 animate-pulse' 
                    : 'text-green-700'
                }`}>
                  {getSalesMemberName(lead.sale_owner_id)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                ยังไม่มีผู้รับ
              </span>
            )
          )}
        </TableCell>
      )}
      {/* จัดการ/Action cell */}
      {!hideActions && showActionsColumn && (
        <TableCell>
          {isMyLeads ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="h-8 px-2 w-full"
              >
                <Eye className="h-4 w-4 mr-1" />
                ดูรายละเอียด
              </Button>
              <Button
                size="sm"
                onClick={handleViewTimeline}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-2 w-full"
              >
                <Clock className="h-4 w-4 mr-1" />
                การติดตาม
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="h-8 px-2 w-full"
              >
                <Eye className="h-4 w-4 mr-1" />
                ดูรายละเอียด
              </Button>
              {onEditLead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditLead(lead.id)}
                  className="h-8 px-2 w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  แก้ไข
                </Button>
              )}
              {onDeleteLead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteLead(lead.id)}
                  className="h-8 px-2 w-full bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  ลบ
                </Button>
              )}
            </div>
          )}
        </TableCell>
      )}
      {hideActions && <></>}
    </TableRow>
  );
};

export default LeadTableRow;
