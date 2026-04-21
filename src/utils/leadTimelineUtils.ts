import { Calendar, FileText, CreditCard, Zap, MessageSquare } from "lucide-react";

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'รอรับ':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'กำลังติดตาม':
    case 'ติดตาม':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ปิด':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ยกเลิก':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getActivityIcon = (activity: any) => {
  if (activity.appointments?.length > 0) return Calendar;
  if (activity.quotations?.length > 0) return FileText;
  if (activity.credit_evaluation?.length > 0) return CreditCard;
  if (activity.lead_products?.length > 0) return Zap;
  return MessageSquare;
};

export const getActivityTitle = (activity: any) => {
  if (activity.appointments?.length > 0) return 'การนัดหมาย';
  if (activity.quotations?.length > 0) return 'การเสนอราคา';
  if (activity.credit_evaluation?.length > 0) return 'การประเมินสินเชื่อ';
  if (activity.lead_products?.length > 0) return 'ข้อมูลผลิตภัณฑ์';
  return 'บันทึกการติดตาม';
};

/**
 * Get the latest productivity log for each lead from a list of logs
 * @param logs Array of productivity logs
 * @returns Map of lead_id to latest log
 */
export const getLatestLogsByLead = (logs: any[]): Map<number, any> => {
  const latestLogsByLead = new Map();
  
  logs?.forEach(log => {
    if (log.lead_id && !latestLogsByLead.has(log.lead_id)) {
      latestLogsByLead.set(log.lead_id, log);
    }
  });
  
  return latestLogsByLead;
};

/**
 * Get unique leads from productivity logs (using latest log for each lead)
 * @param logs Array of productivity logs
 * @returns Array of unique leads with their latest log data
 */
export const getUniqueLeadsFromLogs = (logs: any[]): any[] => {
  const latestLogsByLead = getLatestLogsByLead(logs);
  return Array.from(latestLogsByLead.values());
};
