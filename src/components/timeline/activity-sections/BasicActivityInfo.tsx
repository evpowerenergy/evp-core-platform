import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, MessageSquare } from "lucide-react";
import { formatDate, formatTime } from "@/utils/dashboardUtils";

interface BasicActivityInfoProps {
  nextFollowUp: string | null;
  nextFollowUpDetails: string | null;
}

const BasicActivityInfo = ({ nextFollowUp, nextFollowUpDetails }: BasicActivityInfoProps) => {
  return (
    <div className="space-y-4">

      {/* Next Follow Up */}
      {nextFollowUp && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">นัดติดตามครั้งถัดไป</span>
                  <div className="font-bold text-green-600 mt-1">
                    {formatDate(nextFollowUp)} {formatTime(nextFollowUp)}
                  </div>
                </div>
                
                {nextFollowUpDetails && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3 w-3 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">รายละเอียดการนัดติดตามครั้งถัดไป</span>
                    </div>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-green-100">
                      {nextFollowUpDetails}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BasicActivityInfo;
