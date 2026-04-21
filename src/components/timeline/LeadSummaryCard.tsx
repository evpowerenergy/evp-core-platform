
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/utils/leadTimelineUtils";

interface Lead {
  id: number;
  full_name: string | null;
  tel: string | null;
  region: string | null;
  avg_electricity_bill: string | null;
  status: string | null;
}

interface LeadSummaryCardProps {
  lead: Lead;
}

const LeadSummaryCard = ({ lead }: LeadSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>ข้อมูลลีด</span>
          <Badge className={getStatusColor(lead.status || '')}>
            {lead.status || 'ไม่ระบุ'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
            <p className="font-medium">{lead.full_name || 'ไม่ระบุ'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">เบอร์โทร</p>
            <p className="font-medium">{lead.tel || 'ไม่ระบุ'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">จังหวัด</p>
            <p className="font-medium">{lead.region || 'ไม่ระบุ'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ค่าไฟเฉลี่ย</p>
            <p className="font-medium">
              {lead.avg_electricity_bill ? `${lead.avg_electricity_bill} บาท` : 'ไม่ระบุ'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadSummaryCard;
