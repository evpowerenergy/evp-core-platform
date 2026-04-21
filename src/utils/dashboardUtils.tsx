
import { Facebook, MessageCircle, Phone, Smartphone, Globe, Music, Instagram, Youtube, ShoppingBag, ShoppingCart, Users, Headphones } from "lucide-react";
import { LEAD_STATUS_OPTIONS, getLeadStatusColor, getOperationStatusColor } from "./leadStatusUtils";
import { Clock, CheckCircle, AlertCircle, UserCheck } from "lucide-react";
import SimplePlatformIcon from "@/components/SimplePlatformIcon";
import { normalizePhoneNumber } from "./leadValidation";

export const PLATFORM_OPTIONS = [
  'Facebook',
  'Line', 
  'Huawei',
  'Huawei (C&I)',
  'Website',
  'TikTok',
  'IG',
  'YouTube',
  'Shopee',
  'Lazada',
  'แนะนำ',
  'Outbound',
  'โทร',
  'ATMOCE',
  'Solar Edge',
  'Sigenergy',
  'solvana',
  'terawatt',
  'ลูกค้าเก่า service ครบ'
];

export const getPlatformIcon = (platform: string) => {
  return <SimplePlatformIcon platform={platform} size="md" />;
};

export const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'รอรับ':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'กำลังติดตาม':
      return <UserCheck className="h-4 w-4 text-blue-500" />;
    case 'ปิดการขาย':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'ยังปิดการขายไม่สำเร็จ':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

export const getStatusColor = getLeadStatusColor;

export const formatDate = (dateString: string) => {
  // แสดงวันที่จาก *_thai โดยอ่านจากสตริงโดยตรง เพื่อหลีกเลี่ยง timezone shift ของ JS Date
  try {
    const datePart = (dateString || '').split('T')[0] || (dateString || '').split(' ')[0];
    const [yearStr, monthStr, dayStr] = (datePart || '').split('-');
    if (!yearStr || !monthStr || !dayStr) return 'ไม่ระบุ';
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${day} ${monthNames[month - 1]} ${year}`;
  } catch {
    return 'ไม่ระบุ';
  }
};

// รูปแบบเวลา HH:mm จาก *_thai โดยไม่ให้ JS แปลง timezone เพิ่ม
export const formatTime = (dateString: string) => {
  try {
    const timePart = (dateString || '').split('T')[1] || (dateString || '').split(' ')[1];
    if (!timePart) return '';
    const [hh, mm] = timePart.split(':');
    if (!hh || !mm) return '';
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
  } catch {
    return '';
  }
};

// รูปแบบวันที่และเวลารวมกัน สำหรับคอลัมน์ "อัพเดทล่าสุด"
export const formatDateTime = (dateString: string) => {
  try {
    const datePart = (dateString || '').split('T')[0] || (dateString || '').split(' ')[0];
    const timePart = (dateString || '').split('T')[1] || (dateString || '').split(' ')[1];
    
    if (!datePart) return 'ไม่ระบุ';
    
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    if (!yearStr || !monthStr || !dayStr) return 'ไม่ระบุ';
    
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const dateStr = `${day} ${monthNames[month - 1]} ${year}`;
    
    if (timePart) {
      const [hh, mm] = timePart.split(':');
      if (hh && mm) {
        return `${dateStr} ${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
      }
    }
    
    return dateStr;
  } catch {
    return 'ไม่ระบุ';
  }
};

export const filterLeads = (leads: any[], statusFilter: string, platformFilter: string, searchTerm: string) => {
  // Normalize search term if it's a phone number (starts with digit)
  const isPhoneSearch = /^\d/.test(searchTerm);
  const normalizedSearchTerm = isPhoneSearch 
    ? normalizePhoneNumber(searchTerm) 
    : searchTerm.toLowerCase();

  return leads.filter(lead => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || lead.platform === platformFilter;
    
    // For phone searches, normalize both the search term and the phone number in the database
    const phoneMatches = lead.tel && isPhoneSearch
      ? normalizePhoneNumber(lead.tel).includes(normalizedSearchTerm)
      : lead.tel?.includes(searchTerm);
    
    const matchesSearch = searchTerm === "" || 
      lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phoneMatches ||
      lead.line_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.region?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPlatform && matchesSearch;
  });
};

export const calculateStats = (leads: any[]) => {
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'รอรับ').length;
  const followingLeads = leads.filter(lead => lead.status === 'กำลังติดตาม').length;
  const closedLeads = leads.filter(lead => lead.status === 'ปิดการขาย').length;
  const unsuccessfulLeads = leads.filter(lead => lead.status === 'ยังปิดการขายไม่สำเร็จ').length;

  // Platform stats - updated to include all new platforms
  const platformStats = PLATFORM_OPTIONS.reduce((acc, platform) => {
    const count = leads.filter(lead => lead.platform === platform).length;
    const key = platform.toLowerCase() + 'Leads';
    acc[key] = count;
    return acc;
  }, {} as Record<string, number>);

  // Starred leads: มีชื่อจริงหรือ display_name และมีข้อมูลติดต่อ (เบอร์โทรหรือ Line ID)
  const starredLeads = leads.filter(lead =>
    ((lead.full_name && lead.full_name.trim() !== '') || (lead.display_name && lead.display_name.trim() !== '')) &&
    ((lead.tel && lead.tel.trim() !== '') || (lead.line_id && lead.line_id.trim() !== ''))
  ).length;

  return {
    totalLeads,
    newLeads,
    followingLeads,
    closedLeads,
    unsuccessfulLeads,
    starredLeads,
    ...platformStats
  };
};

export const prepareChartData = (leads: any[]) => {
  const statusCounts = LEAD_STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = leads.filter(lead => lead.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  const platformCounts = PLATFORM_OPTIONS.reduce((acc, platform) => {
    acc[platform] = leads.filter(lead => lead.platform === platform).length;
    return acc;
  }, {} as Record<string, number>);

  const platformData = Object.entries(platformCounts).map(([name, value]) => ({
    name,
    value
  }));

  return { statusData, platformData };
};
