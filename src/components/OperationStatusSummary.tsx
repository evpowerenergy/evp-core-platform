
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getOperationStatusColor, OPERATION_STATUS_OPTIONS } from "@/utils/leadStatusUtils";
import { 
  Phone, 
  Search, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle 
} from "lucide-react";

interface OperationStatusSummaryProps {
  leads: any[];
  onStatusFilter?: (status: string) => void;
  isWholesale?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'อยู่ระหว่างการติดต่อ':
      return <Phone className="h-4 w-4" />;
    case 'อยู่ระหว่างการสำรวจ':
      return <Search className="h-4 w-4" />;
    case 'อยู่ระหว่างยืนยันใบเสนอราคา':
      return <FileText className="h-4 w-4" />;
    case 'ยังปิดการดำเนินการไม่ได้':
      return <AlertCircle className="h-4 w-4" />;
    case 'ปิดการขายแล้ว':
      return <CheckCircle className="h-4 w-4" />;
    case 'ปิดการขายไม่สำเร็จ':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Phone className="h-4 w-4" />;
  }
};

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'อยู่ระหว่างการติดต่อ':
      return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:from-orange-100 hover:to-amber-100';
    case 'อยู่ระหว่างการสำรวจ':
      return 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:from-purple-100 hover:to-violet-100';
    case 'อยู่ระหว่างยืนยันใบเสนอราคา':
      return 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:from-indigo-100 hover:to-blue-100';
    case 'ยังปิดการดำเนินการไม่ได้':
      return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100';
    case 'ปิดการขายแล้ว':
      return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100';
    case 'ปิดการขายไม่สำเร็จ':
      return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:from-gray-100 hover:to-slate-100';
    default:
      return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:from-gray-100 hover:to-slate-100';
  }
};

const getStatusIconBg = (status: string) => {
  switch (status) {
    case 'อยู่ระหว่างการติดต่อ':
      return 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-200';
    case 'อยู่ระหว่างการสำรวจ':
      return 'bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-200';
    case 'อยู่ระหว่างยืนยันใบเสนอราคา':
      return 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-200';
    case 'ยังปิดการดำเนินงานไม่ได้':
      return 'bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-200';
    case 'ปิดการขายแล้ว':
      return 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-200';
    case 'ปิดการขายไม่สำเร็จ':
      return 'bg-gradient-to-br from-gray-500 to-slate-500 shadow-lg shadow-gray-200';
    default:
      return 'bg-gradient-to-br from-gray-500 to-slate-500 shadow-lg shadow-gray-200';
  }
};

const OperationStatusSummary = ({ leads, onStatusFilter, isWholesale }: OperationStatusSummaryProps) => {
  // Filter operation status options for wholesale
  const statusOptions = isWholesale 
    ? OPERATION_STATUS_OPTIONS.filter(status => status !== 'อยู่ระหว่างการสำรวจ')
    : OPERATION_STATUS_OPTIONS;

  // Count leads by operation status - Fixed typing issue
  const statusCounts: Record<string, number> = {};
  statusOptions.forEach(status => {
    statusCounts[status] = leads.filter(lead => lead.operation_status === status).length;
  });

  const totalLeads = leads.length;

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50/30 border-2 border-gray-200/60 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
          สถานะการดำเนินงาน - Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress Line - ซ่อนเส้น progress เนื่องจากใช้ flex layout */}
          {/* <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full z-0"></div> */}
          
          {/* Pipeline Steps */}
          <div className="relative z-10 flex flex-wrap gap-4 justify-center">
            {statusOptions.map((status, index) => {
              const count = statusCounts[status] || 0;
              const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              
              return (
                <div
                  key={status}
                  className={`relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 group min-w-[140px] max-w-[160px] ${
                    getStatusBgColor(status)
                  } ${onStatusFilter ? 'hover:scale-105 hover:shadow-xl' : ''} hover:-translate-y-1`}
                  onClick={() => onStatusFilter?.(status)}
                >
                  {/* Step Number Circle */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 shadow-md flex items-center justify-center text-xs font-bold text-gray-700 group-hover:border-gray-400 transition-colors">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`mb-2 p-1.5 rounded-full ${getStatusIconBg(status)} text-white transform group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-4 h-4 flex items-center justify-center">
                      {getStatusIcon(status)}
                    </div>
                  </div>
                  
                  {/* Status Name */}
                  <div className="text-xs font-semibold text-center mb-2 leading-tight text-gray-800 min-h-[2rem] flex items-center">
                    {status}
                  </div>
                  
                  {/* Large Count Number */}
                  <div className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                    {count}
                  </div>
                  
                  {/* Count Label */}
                  <div className="text-xs text-gray-500 mb-2 font-medium">รายการ</div>
                  
                  {/* Percentage */}
                  <div className="text-lg font-semibold text-gray-700 mb-2">{percentage}%</div>
                  
                  {/* Mini Progress Bar */}
                  {totalLeads > 0 && (
                    <div className="w-full">
                      <Progress 
                        value={percentage} 
                        className="h-1.5 bg-gray-200"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationStatusSummary;
