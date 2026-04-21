
import React from 'react';
import { formatDate, formatTime } from "@/utils/dashboardUtils";
import { MapPin } from "lucide-react";

interface SiteVisitInfoSectionProps {
  appointments: any[] | null;
  buildingInfo: string | null;
  installationNotes: string | null;
}

const SiteVisitInfoSection = ({ appointments, buildingInfo, installationNotes }: SiteVisitInfoSectionProps) => {
  // กรองเฉพาะ engineer appointments (นัดหมายวิศวกร) โดยดูจาก note
  const engineerAppointments = appointments?.filter(apt => 
    apt.note && apt.note.includes('การนัดหมายวิศวกร')
  ) || [];
  
  const hasAppointment = engineerAppointments.length > 0;
  const hasSiteInfo = buildingInfo || installationNotes;
  
  if (!hasAppointment && !hasSiteInfo) return null;
  
  return (
    <div className="bg-purple-50 p-3 rounded-lg mb-3">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-purple-600" />
        <span className="font-medium text-purple-900">การลงพื้นที่</span>
      </div>
      <div className="space-y-2 text-sm">
        {hasAppointment && engineerAppointments?.map((apt, index) => (
          <div key={index} className="border-l-2 border-purple-200 pl-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-gray-600">วันที่: </span>
                <span>{apt.date_thai ? (() => {
                  const dateStr = `${formatDate(apt.date_thai)} ${formatTime(apt.date_thai)}`.trim();
                  return dateStr || 'ไม่ระบุ';
                })() : 'ไม่ระบุ'}</span>
              </div>
              <div>
                <span className="text-gray-600">สถานที่: </span>
                <span>{apt.location || 'ไม่ระบุ'}</span>
              </div>
            </div>
            {apt.note && <div className="mt-1 text-gray-700">{apt.note}</div>}
          </div>
        ))}
        {buildingInfo && (
          <div>
            <span className="text-gray-600">ข้อมูลอาคาร: </span>
            <div className="mt-1 text-gray-700 bg-white p-2 rounded border">
              {buildingInfo}
            </div>
          </div>
        )}
        {installationNotes && (
          <div>
            <span className="text-gray-600">หมายเหตุการติดตั้ง: </span>
            <div className="mt-1 text-gray-700 bg-white p-2 rounded border">
              {installationNotes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteVisitInfoSection;
