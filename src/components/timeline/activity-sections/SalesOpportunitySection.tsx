
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface SalesOpportunitySectionProps {
  saleChanceStatus: string | null;
  creditApprovalStatus: string | null;
  cxlReason: string | null;
  cxlDetail: string | null;
}

const SalesOpportunitySection = ({ 
  saleChanceStatus, 
  creditApprovalStatus,
  cxlReason, 
  cxlDetail 
}: SalesOpportunitySectionProps) => {
  if (!saleChanceStatus) return null;
  
  return (
    <div className="bg-orange-50 p-3 rounded-lg mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-orange-600" />
        <span className="font-medium text-orange-900">โอกาสการขาย</span>
      </div>
      <div className="space-y-2 text-sm">
        {saleChanceStatus && (
          <div>
            <span className="text-gray-600">สถานะ: </span>
            <Badge variant={saleChanceStatus === 'CXL' ? 'destructive' : 'default'}>
              {saleChanceStatus}
            </Badge>
          </div>
        )}
        {saleChanceStatus === 'win + สินเชื่อ' && creditApprovalStatus && (
          <div>
            <span className="text-gray-600">สถานะการอนุมัติสินเชื่อ: </span>
            <Badge 
              variant={creditApprovalStatus === 'อนุมัติ' ? 'default' : 'destructive'}
              className={creditApprovalStatus === 'อนุมัติ' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            >
              {creditApprovalStatus}
            </Badge>
          </div>
        )}
        {saleChanceStatus === 'CXL' && (
          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
            {cxlReason && (
              <div>
                <span className="text-gray-600">เหตุผล: </span>
                <span className="text-red-600">{cxlReason}</span>
              </div>
            )}
            {cxlDetail && (
              <div>
                <span className="text-gray-600">รายละเอียด: </span>
                <div className="mt-1 text-red-600">{cxlDetail}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesOpportunitySection;
