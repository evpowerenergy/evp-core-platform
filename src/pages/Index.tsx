import { AppLayout } from "@/components/AppLayout";
// import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, FileText, Star, TrendingUp, Target, Calendar, MapPin, Zap, UserCheck, UserX, DollarSign, Activity } from "lucide-react";
// import { Link } from "react-router-dom";
// import CompanyLogo from "@/components/CompanyLogo";
import ThailandMap from "@/components/dashboard/ThailandMap";
import { useAppData } from "@/hooks/useAppDataAPI";
import { useMemo, useState } from "react";
import { PLATFORM_OPTIONS, getPlatformIcon } from "@/utils/dashboardUtils";
import { 
  calculateTotalLeads, 
  calculateAssignedLeads, 
  calculateUnassignedLeads, 
  calculateAssignmentRate,
  calculateLeadsByStatus,
  calculateLeadsByPlatform,
  calculateTotalLeadsWithContact,
  calculateAssignedLeadsWithContact,
  calculateUnassignedLeadsWithContact,
  calculateAssignmentRateWithContact,
  calculateLeadsByStatusWithContact,
  calculateLeadsByPlatformWithContact
} from "@/utils/leadValidation";
import { ReactECharts } from '@/utils/echartsLoader.tsx';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSalesDataInPeriod, getQuotationDataFromView } from "@/utils/salesUtils";
import { PageLoading } from "@/components/ui/loading";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { isInDateRange } from '@/utils/dateFilterUtils';

const featureHighlights = [
  {
    icon: <Users className="h-8 w-8 text-green-600" />, title: "จัดการทีมขายง่าย", desc: "เพิ่ม แก้ไข และติดตามผลงานทีมขายได้อย่างมีประสิทธิภาพ"
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-emerald-600" />, title: "วิเคราะห์ข้อมูลเชิงลึก", desc: "ดูสถิติยอดขายและประสิทธิภาพแบบ real-time"
  },
  {
    icon: <FileText className="h-8 w-8 text-blue-600" />, title: "รายงานครบถ้วน", desc: "สร้างและดาวน์โหลดรายงานได้หลากหลายรูปแบบ"
  },
  {
    icon: <Star className="h-8 w-8 text-yellow-500" />, title: "ใช้งานง่าย มืออาชีพ", desc: "UI ทันสมัย รองรับทุกอุปกรณ์ และใช้งานง่ายสำหรับทุกคน"
  },
];

// สีสำหรับแต่ละแพลตฟอร์ม
const platformColors = {
  'Facebook': 'border-blue-200 text-blue-600',
  'Line': 'border-green-200 text-green-600', 
  'Huawei': 'border-red-200 text-red-600',
  'Huawei (C&I)': 'border-red-300 text-red-700',
  'Website': 'border-purple-200 text-purple-600',
  'TikTok': 'border-gray-200 text-gray-900',
  'IG': 'border-pink-200 text-pink-600',
  'YouTube': 'border-red-200 text-red-600',
  'Shopee': 'border-orange-200 text-orange-600',
  'Lazada': 'border-blue-200 text-blue-600',
  'แนะนำ': 'border-green-200 text-green-600',
  'Outbound': 'border-indigo-200 text-indigo-600',
  'โทร': 'border-gray-200 text-gray-600',
  'ATMOCE': 'border-cyan-200 text-cyan-600'
};

// ฟังก์ชันคำนวณวันที่เริ่มต้นและสิ้นสุดจาก DateRange (เหมือนหน้าอื่นๆ)
const getDateRange = (dateRange: DateRange | undefined) => {
  if (!dateRange || !dateRange.from) {
    // Default to today if no date range selected
    const now = new Date();
    return {
      startDate: now,
      endDate: now
    };
  }
  
  return {
    startDate: dateRange.from,
    endDate: dateRange.to || dateRange.from
  };
};

// ฟังก์ชันแปลง DateRange เป็น string format (เหมือนหน้าอื่นๆ)
const getDateRangeStrings = (dateRange: DateRange | undefined) => {
  let startDate: string, endDate: string;
  
  if (dateRange && dateRange.from) {
    const fromDate = dateRange.from;
    const toDate = dateRange.to || dateRange.from;
    
    // ใช้ timezone ที่ถูกต้อง
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const fromString = formatter.format(fromDate);
    const toString = formatter.format(toDate);
    
    startDate = fromString + 'T00:00:00.000';
    endDate = toString + 'T23:59:59.999';
  } else {
    // Default to today
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const todayString = formatter.format(now);
    startDate = todayString + 'T00:00:00.000';
    endDate = todayString + 'T23:59:59.999';
  }
  
  return { startDate, endDate };
};

const Index = () => {
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // วันที่ 1 ของเดือนนี้
    to: new Date() // วันนี้
  });

  
  // ✅ ดึงข้อมูล leads ทั้งหมดสำหรับการคำนวณสถิติ (filter ตาม date range)
  // ✅ Changed from Supabase direct call to API call
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['all-leads-for-index', dateRangeFilter],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Apply date range filter if provided
      if (dateRangeFilter && dateRangeFilter.from) {
        const fromDate = dateRangeFilter.from;
        const toDate = dateRangeFilter.to || dateRangeFilter.from;
        
        // Use Intl.DateTimeFormat with Thailand timezone to get correct dates
        const formatter = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        // Format start date - Start from 00:00:00 Thai time
        const startDateString = formatter.format(fromDate);
        const startString = startDateString + 'T00:00:00.000';
        
        // Format end date - End at 23:59:59 Thai time
        const endDateString = formatter.format(toDate);
        const endString = endDateString + 'T23:59:59.999';
        
        params.append('from', startString);
        params.append('to', endString);
        // ✅ ไม่ส่ง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
      } else {
        // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
        params.append('limit', '5000');
      }

      // Get JWT token from Supabase session for Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Call Supabase Edge Function instead of local API endpoint
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-leads-for-dashboard?${params.toString()}`;
      
      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads for dashboard');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leads for dashboard');
      }

      // ✅ Backend กรอง has_contact_info แล้ว ไม่ต้องกรองใน frontend อีก
      // ใช้ข้อมูลจาก Edge Function โดยตรง
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ⚠️ เอาการกรอง EV + Partner platforms ออกเพื่อดูผลลัพธ์
  // ดึงข้อมูลลีดใหม่สำหรับ chart (ใช้ created_at_thai)
  const { data: newLeadsForChart, isLoading: newLeadsLoading } = useQuery({
    queryKey: ['new-leads-for-chart', dateRangeFilter],
    queryFn: async () => {
      if (!dateRangeFilter) return [];
      
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      let query = supabase
        .from('leads')
        .select('id, created_at_thai, status, platform')
        .eq('has_contact_info', true); // ✅ กรอง has_contact_info เท่านั้น (ไม่กรอง platform)

      // ใช้ created_at_thai สำหรับลีดใหม่
      query = query
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching new leads:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!dateRangeFilter, // เพิ่มเงื่อนไขให้ query รันเมื่อมี dateRangeFilter
  });

  // ดึงข้อมูลลีดที่ปิดการขายสำหรับ chart (ใช้ productivity_logs)
  const { data: closedLeadsForChart, isLoading: closedLeadsLoading } = useQuery({
    queryKey: ['closed-leads-for-chart', dateRangeFilter],
    queryFn: async () => {
      if (!dateRangeFilter) return [];
      
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      // ดึงข้อมูลจาก productivity_logs ที่มี status 'ปิดการขายแล้ว'
      let query = supabase
        .from('lead_productivity_logs')
        .select('id, lead_id, created_at_thai, status')
        .eq('status', 'ปิดการขายแล้ว');

      // ใช้ created_at_thai สำหรับวันที่ปิดการขาย
      query = query
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching closed leads:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!dateRangeFilter, // เพิ่มเงื่อนไขให้ query รันเมื่อมี dateRangeFilter
  });

  // ฟังก์ชันแปลงชื่อจังหวัดให้ตรงกับแผนที่ (ใช้ชื่อภาษาอังกฤษตาม GeoJSON)
  const normalizeRegionName = (region: string): string => {
    if (!region) return 'ไม่ระบุ';
    
    const regionLower = region.toLowerCase().trim();
    
    // แปลงชื่อจังหวัดให้ตรงกับชื่อในแผนที่ GeoJSON
    const regionMap: { [key: string]: string } = {
      // กรุงเทพฯ
      'bangkok': 'Bangkok Metropolis',
      'bkk': 'Bangkok Metropolis',
      'กรุงเทพ': 'Bangkok Metropolis',
      'กรุงเทพฯ': 'Bangkok Metropolis',
      'กรุงเทพมหานคร': 'Bangkok Metropolis',
      
      // ภาคเหนือ
      'chiang mai': 'Chiang Mai',
      'chiangmai': 'Chiang Mai',
      'เชียงใหม่': 'Chiang Mai',
      'chiang rai': 'Chiang Rai',
      'chiangrai': 'Chiang Rai',
      'เชียงราย': 'Chiang Rai',
      'lampang': 'Lampang',
      'ลำปาง': 'Lampang',
      'lamphun': 'Lamphun',
      'ลำพูน': 'Lamphun',
      'nan': 'Nan',
      'น่าน': 'Nan',
      'phayao': 'Phayao',
      'พะเยา': 'Phayao',
      'phrae': 'Phrae',
      'แพร่': 'Phrae',
      'phitsanulok': 'Phitsanulok',
      'พิษณุโลก': 'Phitsanulok',
      'sukhothai': 'Sukhothai',
      'สุโขทัย': 'Sukhothai',
      'uttaradit': 'Uttaradit',
      'อุตรดิตถ์': 'Uttaradit',
      'kanchanaburi': 'Kanchanaburi',
      'กาญจนบุรี': 'Kanchanaburi',
      'kamphaeng phet': 'Kamphaeng Phet',
      'kamphaengphet': 'Kamphaeng Phet',
      'กำแพงเพชร': 'Kamphaeng Phet',
      'phichit': 'Phichit',
      'พิจิตร': 'Phichit',
      'phetchabun': 'Phetchabun',
      'เพชรบูรณ์': 'Phetchabun',
      'suphan buri': 'Suphan Buri',
      'suphanburi': 'Suphan Buri',
      'สุพรรณบุรี': 'Suphan Buri',
      'tak': 'Tak',
      'ตาก': 'Tak',
      'uthai thani': 'Uthai Thani',
      'uthaithani': 'Uthai Thani',
      'อุทัยธานี': 'Uthai Thani',
      'ang thong': 'Ang Thong',
      'angthong': 'Ang Thong',
      'อ่างทอง': 'Ang Thong',
      'chai nat': 'Chai Nat',
      'chainat': 'Chai Nat',
      'ชัยนาท': 'Chai Nat',
      'lop buri': 'Lop Buri',
      'lopburi': 'Lop Buri',
      'ลพบุรี': 'Lop Buri',
      'nakhon nayok': 'Nakhon Nayok',
      'nakhonnayok': 'Nakhon Nayok',
      'นครนายก': 'Nakhon Nayok',
      'prachin buri': 'Prachin Buri',
      'prachinburi': 'Prachin Buri',
      'ปราจีนบุรี': 'Prachin Buri',
      'nakhon sawan': 'Nakhon Sawan',
      'nakhonsawan': 'Nakhon Sawan',
      'นครสวรรค์': 'Nakhon Sawan',
      'phra nakhon si ayutthaya': 'Phra Nakhon Si Ayutthaya',
      'ayutthaya': 'Phra Nakhon Si Ayutthaya',
      'พระนครศรีอยุธยา': 'Phra Nakhon Si Ayutthaya',
      'pathum thani': 'Pathum Thani',
      'pathumthani': 'Pathum Thani',
      'ปทุมธานี': 'Pathum Thani',
      'sing buri': 'Sing Buri',
      'singburi': 'Sing Buri',
      'สิงห์บุรี': 'Sing Buri',
      'saraburi': 'Saraburi',
      'สระบุรี': 'Saraburi',
      'nonthaburi': 'Nonthaburi',
      'นนทบุรี': 'Nonthaburi',
      'nakhon pathom': 'Nakhon Pathom',
      'nakhonpathom': 'Nakhon Pathom',
      'นครปฐม': 'Nakhon Pathom',
      'phetchaburi': 'Phetchaburi',
      'เพชรบุรี': 'Phetchaburi',
      'prachuap khiri khan': 'Prachuap Khiri Khan',
      'prachuapkhirikhan': 'Prachuap Khiri Khan',
      'ประจวบคีรีขันธ์': 'Prachuap Khiri Khan',
      'ratchaburi': 'Ratchaburi',
      'ราชบุรี': 'Ratchaburi',
      'samut prakan': 'Samut Prakan',
      'samutprakan': 'Samut Prakan',
      'สมุทรปราการ': 'Samut Prakan',
      'samut sakhon': 'Samut Sakhon',
      'samutsakhon': 'Samut Sakhon',
      'สมุทรสาคร': 'Samut Sakhon',
      'samut songkhram': 'Samut Songkhram',
      'samutsongkhram': 'Samut Songkhram',
      'สมุทรสงคราม': 'Samut Songkhram',
      'chon buri': 'Chon Buri',
      'chonburi': 'Chon Buri',
      'ชลบุรี': 'Chon Buri',
      'chachoengsao': 'Chachoengsao',
      'ฉะเชิงเทรา': 'Chachoengsao',
      'chanthaburi': 'Chanthaburi',
      'จันทบุรี': 'Chanthaburi',
      'trat': 'Trat',
      'ตราด': 'Trat',
      'rayong': 'Rayong',
      'ระยอง': 'Rayong',
      'sa kaeo': 'Sa Kaeo',
      'sakaeo': 'Sa Kaeo',
      'สระแก้ว': 'Sa Kaeo',
      
      // ภาคอีสาน
      'nakhon ratchasima': 'Nakhon Ratchasima',
      'nakhonratchasima': 'Nakhon Ratchasima',
      'นครราชสีมา': 'Nakhon Ratchasima',
      'buri ram': 'Buri Ram',
      'buriram': 'Buri Ram',
      'บุรีรัมย์': 'Buri Ram',
      'chaiyaphum': 'Chaiyaphum',
      'ชัยภูมิ': 'Chaiyaphum',
      'khon kaen': 'Khon Kaen',
      'khonkaen': 'Khon Kaen',
      'ขอนแก่น': 'Khon Kaen',
      'kalasin': 'Kalasin',
      'กาฬสินธุ์': 'Kalasin',
      'maha sarakham': 'Maha Sarakham',
      'mahasarakham': 'Maha Sarakham',
      'มหาสารคาม': 'Maha Sarakham',
      'roi et': 'Roi Et',
      'roiet': 'Roi Et',
      'ร้อยเอ็ด': 'Roi Et',
      'surin': 'Surin',
      'สุรินทร์': 'Surin',
      'si sa ket': 'Si Sa Ket',
      'sisaket': 'Si Sa Ket',
      'ศรีสะเกษ': 'Si Sa Ket',
      'ubon ratchathani': 'Ubon Ratchathani',
      'ubonratchathani': 'Ubon Ratchathani',
      'อุบลราชธานี': 'Ubon Ratchathani',
      'amnat charoen': 'Amnat Charoen',
      'amnatcharoen': 'Amnat Charoen',
      'อำนาจเจริญ': 'Amnat Charoen',
      'yasothon': 'Yasothon',
      'ยโสธร': 'Yasothon',
      'mukdahan': 'Mukdahan',
      'มุกดาหาร': 'Mukdahan',
      'nakhon phanom': 'Nakhon Phanom',
      'nakhonphanom': 'Nakhon Phanom',
      'นครพนม': 'Nakhon Phanom',
      'sakon nakhon': 'Sakon Nakhon',
      'sakonnakhon': 'Sakon Nakhon',
      'สกลนคร': 'Sakon Nakhon',
      'nong khai': 'Nong Khai',
      'nongkhai': 'Nong Khai',
      'หนองคาย': 'Nong Khai',
      'bueng kan': 'Bueng Kan',
      'buengkan': 'Bueng Kan',
      'บึงกาฬ': 'Bueng Kan',
      'loei': 'Loei',
      'เลย': 'Loei',
      'nong bua lam phu': 'Nong Bua Lam Phu',
      'nongbualamphu': 'Nong Bua Lam Phu',
      'หนองบัวลำภู': 'Nong Bua Lam Phu',
      'udon thani': 'Udon Thani',
      'udonthani': 'Udon Thani',
      'อุดรธานี': 'Udon Thani',
      
      // ภาคใต้
      'nakhon si thammarat': 'Nakhon Si Thammarat',
      'nakhonsithammarat': 'Nakhon Si Thammarat',
      'นครศรีธรรมราช': 'Nakhon Si Thammarat',
      'songkhla': 'Songkhla',
      'สงขลา': 'Songkhla',
      'pattani': 'Pattani',
      'ปัตตานี': 'Pattani',
      'yala': 'Yala',
      'ยะลา': 'Yala',
      'narathiwat': 'Narathiwat',
      'นราธิวาส': 'Narathiwat',
      'satun': 'Satun',
      'สตูล': 'Satun',
      'trang': 'Trang',
      'ตรัง': 'Trang',
      'phang nga': 'Phangnga',
      'phangnga': 'Phangnga',
      'พังงา': 'Phangnga',
      'phuket': 'Phuket',
      'ภูเก็ต': 'Phuket',
      'krabi': 'Krabi',
      'กระบี่': 'Krabi',
      'ranong': 'Ranong',
      'ระนอง': 'Ranong',
      'chumphon': 'Chumphon',
      'ชุมพร': 'Chumphon',
      'surat thani': 'Surat Thani',
      'suratthani': 'Surat Thani',
      'สุราษฎร์ธานี': 'Surat Thani',
      'phatthalung': 'Phatthalung',
      'พัทลุง': 'Phatthalung',
      'mae hong son': 'Mae Hong Son',
      'maehongson': 'Mae Hong Son',
      'แม่ฮ่องสอน': 'Mae Hong Son',
    };
    
    // ตรวจสอบใน map ก่อน
    if (regionMap[regionLower]) {
      return regionMap[regionLower];
    }
    
    // ถ้าไม่เจอ ให้ลองตรวจสอบแบบ partial match
    for (const [key, value] of Object.entries(regionMap)) {
      if (regionLower.includes(key) || key.includes(regionLower)) {
        return value;
      }
    }
    
    // ถ้าไม่เจอเลย ให้คืนค่าดั้งเดิม
    return region;
  };

  // คำนวณสถิติภาพรวม
  const stats = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        totalLeads: 0,
        assignedLeads: 0,
        unassignedLeads: 0,
        assignmentRate: 0,
        thisMonthLeads: 0,
        thisWeekLeads: 0,
        todayLeads: 0,
        platformStats: [],
        statusStats: {
          'ใหม่': 0,
          'ติดต่อแล้ว': 0,
          'นัดหมาย': 0,
          'ปิดการขาย': 0,
          'ไม่สนใจ': 0
        },
        dailyLeads: [],
        dailyPresentations: [],
        dailyWins: [],
        dailyClosedLeads: []
      };
    }

    // ข้อมูล leads ที่ได้จาก query ถูก filter ตาม dateRangeFilter ที่ database แล้ว
    // ไม่ต้อง filter ซ้ำใน frontend อีก
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ⚠️ เอาการกรอง EV + Partner platforms ออกเพื่อดูผลลัพธ์
    // ✅ Backend กรอง has_contact_info แล้ว ไม่ต้องกรองใน frontend อีก
    // ใช้ requireContact = false เพื่อไม่ให้กรองซ้ำ
    // ใช้ leads โดยตรง (ไม่กรอง platform)
    const totalLeads = calculateTotalLeadsWithContact(leads, false);
    const assignedLeads = calculateAssignedLeadsWithContact(leads, false);
    const unassignedLeads = calculateUnassignedLeadsWithContact(leads, false);
    const assignmentRate = calculateAssignmentRateWithContact(leads, false);

    // คำนวณลีดตามช่วงเวลา (backend กรอง has_contact_info แล้ว) - ใช้ created_at_thai เหมือน chart
    const thisMonthLeads = calculateTotalLeadsWithContact(
      leads.filter(lead => new Date(lead.created_at_thai) >= thisMonth), 
      false
    );
    const thisWeekLeads = calculateTotalLeadsWithContact(
      leads.filter(lead => new Date(lead.created_at_thai) >= thisWeek), 
      false
    );
    const todayLeads = calculateTotalLeadsWithContact(
      leads.filter(lead => new Date(lead.created_at_thai) >= today), 
      false
    );

    // ✅ คำนวณสถิติแพลตฟอร์มตาม PLATFORM_OPTIONS (ใช้ leads โดยตรง)
    const platformStats = PLATFORM_OPTIONS.map(platform => {
      const count = calculateLeadsByPlatformWithContact(leads, platform, false);
      const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      return {
        name: platform,
        count,
        percentage
      };
    });

    // ✅ คำนวณสถิติสถานะ (ใช้ leads โดยตรง)
    const statusStats = {
      'ใหม่': calculateLeadsByStatusWithContact(leads, 'ใหม่', false),
      'ติดต่อแล้ว': calculateLeadsByStatusWithContact(leads, 'ติดต่อแล้ว', false),
      'นัดหมาย': calculateLeadsByStatusWithContact(leads, 'นัดหมาย', false),
      'ปิดการขาย': calculateLeadsByStatusWithContact(leads, 'ปิดการขาย', false),
      'ไม่สนใจ': calculateLeadsByStatusWithContact(leads, 'ไม่สนใจ', false)
    };

    // คำนวณจำนวนลีดตามวัน (ใช้ข้อมูลแยกกัน)
    const dailyLeads = [];
    const dailyNewLeads = [];
    const dailyClosedLeads = [];
    
    // สร้างข้อมูลรายวันตามช่วงเวลาที่เลือก
    const { startDate, endDate } = getDateRange(dateRangeFilter);
    const chartStartDate = startDate;
    
    for (let d = new Date(chartStartDate); d <= endDate; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const dateStr = d.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      // ใช้ timezone ที่ถูกต้องสำหรับการเปรียบเทียบ
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const dayString = formatter.format(d); // YYYY-MM-DD
      
      // นับลีดใหม่ (ใช้ created_at_thai) - ใช้การเปรียบเทียบวันที่แบบ string
      const newLeadsCount = newLeadsForChart?.filter(lead => {
        const leadDate = new Date(lead.created_at_thai);
        const leadDateString = leadDate.toISOString().split('T')[0]; // YYYY-MM-DD
        return leadDateString === dayString;
      }).length || 0;
      
      // นับลีดที่ปิดการขาย (ใช้ created_at_thai จาก productivity_logs) - ใช้การเปรียบเทียบวันที่แบบ string
      const closedLeadsCount = closedLeadsForChart?.filter(log => {
        const logDate = new Date(log.created_at_thai);
        const logDateString = logDate.toISOString().split('T')[0]; // YYYY-MM-DD
        return logDateString === dayString;
      }).length || 0;
      
      dailyLeads.push({ date: dateStr, count: newLeadsCount });
      dailyNewLeads.push({ date: dateStr, count: newLeadsCount });
      dailyClosedLeads.push({ date: dateStr, count: closedLeadsCount });
    }


    return {
      totalLeads,
      assignedLeads,
      unassignedLeads,
      assignmentRate,
      thisMonthLeads,
      thisWeekLeads,
      todayLeads,
      platformStats,
      statusStats,
      dailyLeads,
      dailyNewLeads,
      dailyClosedLeads
    };
  }, [leads, newLeadsForChart, closedLeadsForChart, dateRangeFilter]);

  // ดึงข้อมูลจริงจาก database สำหรับ charts
  const { data: productivityLogs } = useQuery({
    queryKey: ['productivity-logs-for-charts', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      const { data, error } = await supabase
        .from('lead_productivity_logs')
        .select(`
          id,
          created_at_thai,
          customer_category,
          lead_group,
          lead_id,
          leads (
            id,
            status
          )
        `)
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate)
        .order('created_at_thai', { ascending: false });

      if (error) {
        console.error('Error fetching productivity logs:', error);
        return [];
      }
      
      // ดึงข้อมูล quotations แยกกัน
      if (data && data.length > 0) {
        const logIds = data.map(log => log.id);
        
        const { data: quotationsData, error: quotationsError } = await supabase
          .from('quotations')
          .select('id, productivity_log_id, total_amount, has_qt, has_inv')
          .in('productivity_log_id', logIds);
        
        if (quotationsError) {
          console.error('Error fetching quotations:', quotationsError);
        }
        
        // รวมข้อมูล quotations เข้ากับ logs
        const enrichedData = data.map(log => ({
          ...log,
          quotations: quotationsData?.filter(q => q.productivity_log_id === log.id) || []
        }));
        
        return enrichedData;
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ✅ ใช้ utility function สำหรับดึงข้อมูลยอดขายที่ถูกต้อง
  const { data: salesData } = useQuery({
    queryKey: ['sales-data-for-charts', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      return await getSalesDataInPeriod(
        startDate,
        endDate
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ดึงข้อมูล QT ทั้งหมด (ไม่ซ้ำ) สำหรับคำนวณ Win Rate
  // ใช้วิธีเดียวกับ getSalesDataInPeriod เพื่อให้ช่วงเวลาและ logic ตรงกัน
  const { data: allQuotationData } = useQuery({
    queryKey: ['all-quotation-data-for-winrate-index', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      try {
        // ดึง productivity logs ที่มี QT (ไม่ว่าจะปิดหรือยังไม่ปิด) ในช่วงเวลาที่เลือก
        // ใช้ logic เดียวกับ getSalesDataInPeriod แต่ไม่ filter status
        let logsQuery = supabase
          .from('lead_productivity_logs')
          .select(`
            id, 
            lead_id, 
            created_at_thai,
            leads!inner(
              id,
              category
            )
          `);

        // Filter ตามช่วงเวลา (ใช้ created_at_thai ของ log เหมือน getSalesDataInPeriod)
        if (startDate && endDate) {
          logsQuery = logsQuery
            .gte('created_at_thai', startDate)
            .lte('created_at_thai', endDate);
        }

        const { data: logs, error: logsError } = await logsQuery;

        if (logsError) {
          console.error('Error fetching productivity logs:', logsError);
          throw logsError;
        }

        // ดึง quotation_documents จาก logs เหล่านั้น
        const logIds = logs?.map(log => log.id) || [];
        let quotations: any[] = [];
        
        if (logIds.length > 0) {
          const { data: quotationsData, error: quotationsError } = await supabase
            .from('quotation_documents')
            .select(`
              amount, 
              productivity_log_id, 
              document_number,
              created_at_thai
            `)
            .in('productivity_log_id', logIds)
            .eq('document_type', 'quotation');

          if (quotationsError) {
            console.error('Error fetching quotation_documents:', quotationsError);
            throw quotationsError;
          }

          quotations = quotationsData || [];
        }

        // นับ QT ทั้งหมด (ไม่ซ้ำ) โดยใช้ document_number
        const uniqueQuotations = new Set(
          quotations.map(q => q.document_number?.toLowerCase().replace(/\s+/g, '') || '').filter(Boolean)
        );
        const totalQuotations = uniqueQuotations.size;

        // คำนวณจำนวน QT ตาม category
        const quotationByCategory = new Map<string, number>();
        const categoryQuotationMap = new Map<string, Set<string>>();

        logs?.forEach(log => {
          const category = log.leads?.category || 'ไม่ระบุ';
          const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
          
          if (!categoryQuotationMap.has(category)) {
            categoryQuotationMap.set(category, new Set());
          }
          
          logQuotations.forEach(q => {
            const normalizedDoc = q.document_number?.toLowerCase().replace(/\s+/g, '') || '';
            if (normalizedDoc) {
              categoryQuotationMap.get(category)!.add(normalizedDoc);
            }
          });
        });

        categoryQuotationMap.forEach((quotationSet, category) => {
          quotationByCategory.set(category, quotationSet.size);
        });
        
        return {
          totalQuotations,
          quotationByCategory,
          quotationLeads: []
        };
      } catch (error) {
        console.error('Error fetching all quotation data:', error);
        return {
          totalQuotations: 0,
          quotationByCategory: new Map(),
          quotationLeads: []
        };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // คำนวณข้อมูลจริงสำหรับ charts เพิ่มเติม
  const chartData = useMemo(() => {
    if (!productivityLogs || productivityLogs.length === 0) {
      return {
        dailyPresentations: [],
        dailyWins: [],
        dailyClosedLeads: []
      };
    }

    const { startDate, endDate } = getDateRange(dateRangeFilter);
    
    // สร้างข้อมูลรายวันตามช่วงเวลาที่เลือก
    const dailyData = [];
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const dateStr = d.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      // ใช้ timezone ที่ถูกต้องสำหรับการเปรียบเทียบ
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const dayString = formatter.format(d); // YYYY-MM-DD
      const dayStart = new Date(dayString + 'T00:00:00.000');
      const dayEnd = new Date(dayString + 'T23:59:59.999');
      
      // นับการนำเสนอ (มี lead_group) - ใช้การเปรียบเทียบวันที่แบบ string
      const presentations = productivityLogs.filter(log => {
        const logDate = new Date(log.created_at_thai);
        const logDateString = logDate.toISOString().split('T')[0]; // YYYY-MM-DD
        return logDateString === dayString && log.lead_group;
      });
      
      // แยกลูกค้าใหม่และลูกค้าเดิมจาก lead_group
      const newCustomers = presentations.filter(log => log.lead_group === 'ลูกค้าใหม่').length;
      const existingCustomers = presentations.filter(log => log.lead_group === 'ลูกค้าเดิม').length;
      
      // ✅ ใช้ข้อมูลจาก salesData แทนการคำนวณจาก productivityLogs
      // เพื่อให้ได้ยอดขายที่ถูกต้องจาก productivity logs ที่มี status 'ปิดการขายแล้ว'
      let totalSales = 0;
      let closedLeads = 0;
      
      if (salesData && salesData.salesLogs) {
        // คำนวณยอดขายรายวันจาก salesData - ใช้การเปรียบเทียบวันที่แบบ string
        const daySalesLogs = salesData.salesLogs.filter(log => {
          const logDate = new Date(log.created_at_thai);
          const logDateString = logDate.toISOString().split('T')[0]; // YYYY-MM-DD
          return logDateString === dayString;
        });
        
        // คำนวณยอดขายจาก quotations ของ logs ในวันนั้น
        const dayQuotations = salesData.quotations.filter(quotation => 
          daySalesLogs.some(log => log.id === quotation.productivity_log_id)
        );
        
        totalSales = dayQuotations.reduce((sum, qt) => sum + (qt.amount || 0), 0);
        
        // นับจำนวนลีดที่ปิดการขาย (ไม่ซ้ำ)
        const uniqueLeadIds = new Set(daySalesLogs.map(log => log.lead_id));
        closedLeads = uniqueLeadIds.size;
      }
      
      dailyData.push({
        date: dateStr,
        newCustomers,
        existingCustomers,
        totalSales,
        closedLeads
      });
    }

    const result = {
      dailyPresentations: dailyData.map(item => ({
        date: item.date,
        newCustomers: item.newCustomers,
        existingCustomers: item.existingCustomers
      })),
      dailyWins: dailyData.map(item => ({
        date: item.date,
        totalSales: item.totalSales
      })),
      dailyClosedLeads: dailyData.map(item => ({
        date: item.date,
        closedLeads: item.closedLeads
      }))
    };


    return result;
  }, [productivityLogs, salesData, dateRangeFilter]);

  const salesSummary = useMemo(() => {
    const totalSalesCount = salesData?.salesCount || 0;
    const totalSalesValue = salesData?.totalSalesValue || 0;
    const totalQuotations = allQuotationData?.totalQuotations || 0;

    const categoryMap = new Map<
      string,
      { salesCount: number; totalSalesValue: number; totalQuotations: number }
    >();

    // นับ QT ทั้งหมดตาม category
    allQuotationData?.quotationByCategory?.forEach((count, category) => {
      const summary = categoryMap.get(category) || {
        salesCount: 0,
        totalSalesValue: 0,
        totalQuotations: 0,
      };
      summary.totalQuotations = count;
      categoryMap.set(category, summary);
    });

    // นับ QT ที่ปิดการขายตาม category
    (salesData?.salesLeads || []).forEach((lead: any) => {
      const category = lead.category || 'ไม่ระบุ';
      const summary = categoryMap.get(category) || {
        salesCount: 0,
        totalSalesValue: 0,
        totalQuotations: 0,
      };
      summary.salesCount += lead.totalQuotationCount || 0;
      summary.totalSalesValue += lead.totalQuotationAmount || 0;
      categoryMap.set(category, summary);
    });

    // นับจำนวนลีดที่ปิดการขาย (ไม่ซ้ำ) ตาม category
    const closedLeadsByCategory = new Map<string, Set<number>>();
    (salesData?.salesLeads || []).forEach((lead: any) => {
      const category = lead.category || 'ไม่ระบุ';
      if (!closedLeadsByCategory.has(category)) {
        closedLeadsByCategory.set(category, new Set());
      }
      closedLeadsByCategory.get(category)!.add(lead.leadId);
    });

    // นับจำนวนลีดทั้งหมดตาม category
    const totalLeadsByCategory = new Map<string, number>();
    (leads || []).forEach((lead: any) => {
      const category = lead.category || 'ไม่ระบุ';
      const current = totalLeadsByCategory.get(category) || 0;
      totalLeadsByCategory.set(category, current + 1);
    });

    const categorySummary = Array.from(categoryMap.entries())
      .map(([category, summary]) => {
        const closedLeadsCount = closedLeadsByCategory.get(category)?.size || 0;
        const totalLeadsCount = totalLeadsByCategory.get(category) || 0;
        
        return {
        category,
        salesCount: summary.salesCount,
        totalSalesValue: summary.totalSalesValue,
          totalQuotations: summary.totalQuotations,
        winRate:
            summary.totalQuotations > 0
              ? (summary.salesCount / summary.totalQuotations) * 100
              : 0,
          closedLeadsCount,
          totalLeadsCount,
          conversionRate:
            totalLeadsCount > 0
              ? (closedLeadsCount / totalLeadsCount) * 100
            : 0,
        };
      })
      .filter((item) => item.category !== 'ไม่ระบุ');

    // คำนวณ Win Rate รวม: QT ที่ปิดการขาย / QT ทั้งหมด
    const overallWinRate =
      totalQuotations > 0 ? (totalSalesCount / totalQuotations) * 100 : 0;

    // คำนวณ Conversion Rate รวม: ลีดที่ปิดการขาย / ลีดทั้งหมด
    const uniqueClosedLeadIds = new Set(
      (salesData?.salesLeads || []).map((lead: any) => lead.leadId)
    );
    const closedLeadsCount = uniqueClosedLeadIds.size;
    const totalLeads = leads?.length || 0;
    const overallConversionRate =
      totalLeads > 0 ? (closedLeadsCount / totalLeads) * 100 : 0;

    return {
      totalSalesCount,
      totalSalesValue,
      totalQuotations,
      overallWinRate,
      closedLeadsCount,
      totalLeads,
      overallConversionRate,
      categorySummary,
    };
  }, [salesData, allQuotationData, leads]);

  // สร้างข้อมูลสำหรับแผนที่จากข้อมูลลีดจริง
  const mapData = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {};
    }

    const { startDate, endDate } = getDateRange(dateRangeFilter);
    const filteredLeads = leads.filter(lead => {
      return isInDateRange(lead.created_at_thai, { from: startDate, to: endDate });
    });

    // แสดงข้อมูล region ที่มีในฐานข้อมูล
    const uniqueRegions = [...new Set(filteredLeads.map(lead => lead.region).filter(Boolean))];

    // นับจำนวนลีดตามจังหวัด
    const regionCounts = filteredLeads.reduce((acc, lead) => {
      const originalRegion = lead.region || 'ไม่ระบุ';
      const normalizedRegion = normalizeRegionName(originalRegion);
      
      acc[normalizedRegion] = (acc[normalizedRegion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return regionCounts;
  }, [leads, dateRangeFilter]);

  return (
    <AppLayout>
      <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4 overflow-x-hidden">
        <div className="w-full">
          {/* Welcome Section */}
          {/* <div className="bg-white/90 rounded-3xl shadow-xl px-8 py-16 flex flex-col items-center text-center mb-16 border border-green-100">
            <CompanyLogo size="xl" showText={false} /> */}
            {/* <h1 className="mt-6 text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm">
              EV Power Energy CRM
            </h1> */}
            {/* <div className="mt-2 text-emerald-700 text-lg font-medium tracking-wide">ระบบบริหารจัดการลีดและทีมขายสำหรับธุรกิจพลังงานสะอาด</div>
            <p className="mt-4 text-xl md:text-2xl text-gray-600 max-w-4xl">
              ออกแบบมาเพื่อเซลส์ แอดมิน และผู้บริหารโดยเฉพาะ <br />
              ใช้งานง่าย ครบทุกฟีเจอร์สำคัญ พร้อมรายงานและการวิเคราะห์เชิงลึก
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {new Date().toLocaleDateString('th-TH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <div className="flex flex-wrap gap-6 mt-12 justify-center">
              <Link to="/lead-management">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 shadow-md px-10 py-6 text-lg transition-transform hover:-translate-y-1">
                  จัดการลีด Package
                </Button>
              </Link>
              <Link to="/wholesale/lead-management">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-md px-10 py-6 text-lg transition-transform hover:-translate-y-1">
                  จัดการลีด Wholesales
                </Button>
              </Link>
              <Link to="/leads/new">
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-10 py-6 text-lg transition-transform hover:-translate-y-1">
                  เพิ่มลีดใหม่
                </Button>
              </Link>
              <Link to="/reports/all-leads">
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-10 py-6 text-lg transition-transform hover:-translate-y-1">
                  ดูรายงาน
                </Button>
              </Link>
            </div>
          </div> */}

          {/* CRM Overview Stats */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
                <span className="mx-4 text-gray-400 font-medium text-lg">ภาพรวมระบบ CRM</span>
                <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-medium">ช่วงเวลา:</span>
                </div>
                <DateRangePicker
                  value={dateRangeFilter}
                  onChange={setDateRangeFilter}
                  placeholder="เลือกช่วงเวลา"
                  presets={true}
                  className="w-auto"
                />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {/* Total Leads Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">ลีดทั้งหมด</p>
                        <p className="text-3xl font-bold text-blue-900">{stats.totalLeads}</p>
                        <p className="text-xs text-blue-500 mt-1">เฉพาะที่มีเบอร์โทรหรือ Line ID</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Leads Card */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">ลีดที่ได้รับ</p>
                        <p className="text-3xl font-bold text-green-900">{stats.assignedLeads}</p>
                        <p className="text-xs text-green-500 mt-1">อัตราการรับ: {stats.assignmentRate}%</p>
                      </div>
                      <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Unassigned Leads Card */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-1">ลีดที่ยังไม่ได้รับ</p>
                        <p className="text-3xl font-bold text-orange-900">{stats.unassignedLeads}</p>
                        <p className="text-xs text-orange-500 mt-1">รอการรับงาน</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                        <UserX className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Leads Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 mb-1">ลีดวันนี้</p>
                        <p className="text-3xl font-bold text-purple-900">{stats.todayLeads}</p>
                        <p className="text-xs text-purple-500 mt-1">ลีดใหม่วันนี้</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Charts Section - Combined Charts */}
            <div className="mb-4">
              {/* Row 1: Combined Leads & Sales Chart */}
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mb-4">
                <Card className="bg-white/90 shadow-xl border-green-100 h-full flex flex-col">
                  <CardHeader className="pb-2 xl:pb-0 flex-none">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      แนวโน้มลีดและยอดขายรายวัน
                    </CardTitle>
                    {/* <p className="text-sm text-gray-600 mt-1">
                      <span className="text-green-600 font-medium">จำนวนลีดใหม่</span> (ใช้ created_at_thai จาก leads) 
                      และ <span className="text-amber-600 font-medium">ลีดปิดการขาย</span> (ใช้ created_at_thai จาก productivity_logs)
                    </p> */}
                  </CardHeader>
                  <CardContent className="px-4 pb-4 flex-1 flex">
                    <div className="h-full w-full">
                      <ReactECharts
                        option={{
                          tooltip: {
                            trigger: 'axis',
                            axisPointer: {
                              type: 'cross'
                            },
                            formatter: function(params: any) {
                              return `
                              <div style="padding: 8px;">
                                <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params[0].name}</div>
                                ${params.map((param: any) => `
                                  <div style="color: ${param.color}; font-size: 14px; margin-bottom: 2px;">
                                    ${param.seriesName}: ${param.value}
                                  </div>
                                `).join('')}
                              </div>
                            `;
                          }
                        },
                        legend: {
                          data: ['จำนวนลีดใหม่', 'ลีดปิดการขาย'],
                          bottom: 0,
                          textStyle: {
                            fontSize: 12,
                            fontWeight: 'bold'
                          }
                        },
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '15%',
                          containLabel: true
                        },
                        xAxis: {
                          type: 'category',
                          data: stats.dailyNewLeads?.map(item => item.date) || [],
                          axisLabel: {
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#374151',
                            interval: Math.floor((stats.dailyNewLeads?.length || 1) / 10),
                            rotate: 45
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          }
                        },
                        yAxis: {
                          type: 'value',
                          name: 'จำนวนลีด',
                          nameTextStyle: {
                            color: '#374151',
                            fontSize: 12,
                            fontWeight: 'bold'
                          },
                          axisLabel: {
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#374151',
                            formatter: '{value}'
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#F3F4F6'
                            }
                          }
                        },
                        series: [
                          {
                            name: 'จำนวนลีดใหม่',
                            type: 'bar',
                            stack: 'leads',  // ใช้ stack เดียวกัน
                            data: stats.dailyNewLeads?.map(item => item.count) || [],
                            itemStyle: {
                              color: '#10B981',
                              borderRadius: [0, 0, 0, 0]  // ไม่มีมุมโค้งด้านล่าง
                            },
                            emphasis: {
                              itemStyle: {
                                color: '#059669',
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(16, 185, 129, 0.3)'
                              }
                            }
                          },
                          {
                            name: 'ลีดปิดการขาย',
                            type: 'bar',
                            stack: 'leads',  // ใช้ stack เดียวกัน
                            data: stats.dailyClosedLeads?.map(item => item.count) || [],
                            itemStyle: {
                              color: '#F59E0B',
                              borderRadius: [4, 4, 0, 0]  // มุมโค้งด้านบน
                            },
                            emphasis: {
                              itemStyle: {
                                color: '#D97706',
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(245, 158, 11, 0.3)'
                              }
                            }
                          }
                        ],
                        animation: true,
                          animationDuration: 1000,
                          animationEasing: 'cubicOut'
                        }}
                        style={{ height: '100%', minHeight: '280px', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-100 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-semibold text-green-700">รายการปิดการขาย</p>
                            <p className="text-sm text-green-600">
                              จำนวน QT ที่ปิด{salesSummary.totalQuotations > 0 ? ' / QT ทั้งหมด' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-4xl font-bold text-green-600 ml-auto">
                          {salesSummary.totalSalesCount.toLocaleString()}
                          {salesSummary.totalQuotations > 0 && (
                            <span className="text-2xl text-green-500 font-normal">/{salesSummary.totalQuotations.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      {salesSummary.categorySummary.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="bg-emerald-100/70 rounded-lg p-3">
                            <div className="text-sm font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                              Conversion Rate (Lead) รวม
                            </div>
                            <div className="text-2xl font-bold text-emerald-700">
                              {salesSummary.overallConversionRate.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                              })}
                              %
                            </div>
                            <div className="text-xs text-emerald-600 mt-1">
                              {salesSummary.closedLeadsCount.toLocaleString()}/{salesSummary.totalLeads.toLocaleString()} ลีด
                            </div>
                          </div>
                          <div className="bg-green-100/70 rounded-lg p-3">
                            <div className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-1">
                              Win Rate (QT) รวม
                            </div>
                            <div className="text-2xl font-bold text-green-700">
                              {salesSummary.overallWinRate.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                              })}
                              %
                            </div>
                          </div>
                          <div className="space-y-2">
                            {salesSummary.categorySummary.map((item) => (
                              <div
                                key={item.category}
                                className="bg-white/70 border border-green-100 rounded-lg p-3 shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-green-700">
                                    {item.category}
                                  </span>
                                  <span className="text-base font-bold text-green-800">
                                    {item.salesCount.toLocaleString()}
                                    {item.totalQuotations > 0 && (
                                      <span className="text-sm text-green-600 font-normal">/{item.totalQuotations.toLocaleString()}</span>
                                    )} QT
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-green-600 space-y-0.5">
                                  <div className="text-emerald-600">
                                    Conversion Rate (Lead): {item.conversionRate.toLocaleString(undefined, {
                                      maximumFractionDigits: 1
                                    })}
                                    % ({item.closedLeadsCount}/{item.totalLeadsCount})
                                  </div>
                                  <div>
                                    Win Rate (QT): {item.winRate.toLocaleString(undefined, {
                                    maximumFractionDigits: 1
                                  })}
                                  %
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-semibold text-blue-700">มูลค่าปิดการขาย</p>
                            <p className="text-sm text-blue-600">ยอดขายรวมทั้งหมด</p>
                          </div>
                        </div>
                        <div className="text-4xl font-bold text-blue-600 ml-auto">
                          ฿{salesSummary.totalSalesValue.toLocaleString('th-TH')}
                        </div>
                      </div>
                      {salesSummary.categorySummary.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {salesSummary.categorySummary.map((item) => (
                            <div
                              key={item.category}
                              className="bg-white/70 border border-blue-100 rounded-lg p-3 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-blue-700">
                                  {item.category}
                                </span>
                                <span className="text-base font-bold text-blue-800">
                                  ฿{item.totalSalesValue.toLocaleString('th-TH')}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-blue-600 space-y-0.5">
                                <div className="text-indigo-600">
                                  Conversion Rate (Lead): {item.conversionRate.toLocaleString(undefined, {
                                  maximumFractionDigits: 1
                                })}
                                  % ({item.closedLeadsCount}/{item.totalLeadsCount})
                                </div>
                                <div>
                                  Win Rate (QT): {item.winRate.toLocaleString(undefined, {
                                    maximumFractionDigits: 1
                                  })}
                                  % | จำนวน QT: {item.salesCount.toLocaleString()}
                                  {item.totalQuotations > 0 && (
                                    <span>/{item.totalQuotations.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Row 2: Separate Charts - 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Column 1: การนำเสนอ - ลูกค้าใหม่ vs ลูกค้าเดิม */}
                <Card className="bg-white/90 shadow-xl border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      การนำเสนอรายวัน
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">เปรียบเทียบการนำเสนอลูกค้าใหม่กับลูกค้าเดิม</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: 'axis',
                          axisPointer: {
                            type: 'cross'
                          },
                          formatter: function(params: any) {
                            return `
                              <div style="padding: 8px;">
                                <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params[0].name}</div>
                                ${params.map((param: any) => `
                                  <div style="color: ${param.color}; font-size: 14px; margin-bottom: 2px;">
                                    ${param.seriesName}: ${param.value}
                                  </div>
                                `).join('')}
                              </div>
                            `;
                          }
                        },
                        legend: {
                          data: ['ลูกค้าใหม่', 'ลูกค้าเดิม'],
                          bottom: 0,
                          textStyle: {
                            fontSize: 12,
                            fontWeight: 'bold'
                          }
                        },
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '15%',
                          containLabel: true
                        },
                        xAxis: {
                          type: 'category',
                          data: chartData.dailyPresentations.map(item => item.date),
                          axisLabel: {
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#374151',
                            interval: Math.floor(chartData.dailyPresentations.length / 8),
                            rotate: 45
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          }
                        },
                        yAxis: {
                          type: 'value',
                          name: 'จำนวนการนำเสนอ',
                          nameTextStyle: {
                            color: '#374151',
                            fontSize: 12,
                            fontWeight: 'bold'
                          },
                          axisLabel: {
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#374151'
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#F3F4F6'
                            }
                          }
                        },
                        series: [
                          {
                            name: 'ลูกค้าใหม่',
                            type: 'line',
                            data: chartData.dailyPresentations.map(item => item.newCustomers),
                            smooth: true,
                            lineStyle: {
                              color: '#3B82F6',
                              width: 3
                            },
                            itemStyle: {
                              color: '#3B82F6',
                              borderColor: '#3B82F6',
                              borderWidth: 2
                            },
                            areaStyle: {
                              color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                  { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                                  { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                                ]
                              }
                            },
                            emphasis: {
                              itemStyle: {
                                color: '#2563EB',
                                borderColor: '#2563EB',
                                borderWidth: 3,
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(59, 130, 246, 0.3)'
                              }
                            }
                          },
                          {
                            name: 'ลูกค้าเดิม',
                            type: 'line',
                            data: chartData.dailyPresentations.map(item => item.existingCustomers),
                            smooth: true,
                            lineStyle: {
                              color: '#8B5CF6',
                              width: 3
                            },
                            itemStyle: {
                              color: '#8B5CF6',
                              borderColor: '#8B5CF6',
                              borderWidth: 2
                            },
                            areaStyle: {
                              color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                  { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                                  { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
                                ]
                              }
                            },
                            emphasis: {
                              itemStyle: {
                                color: '#7C3AED',
                                borderColor: '#7C3AED',
                                borderWidth: 3,
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(139, 92, 246, 0.3)'
                              }
                            }
                          }
                        ],
                        animation: true,
                        animationDuration: 1000,
                        animationEasing: 'cubicOut'
                      }}
                      style={{ height: '300px', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </CardContent>
                </Card>

                {/* Column 2: Win (ยอดขายปิดได้) */}
                <Card className="bg-white/90 shadow-xl border-green-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Win (ยอดขายปิดได้)
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">ยอดขายที่ปิดได้ในแต่ละวัน</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: 'axis',
                          axisPointer: {
                            type: 'cross'
                          },
                          formatter: function(params: any) {
                            return `
                              <div style="padding: 8px;">
                                <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params[0].name}</div>
                                <div style="color: #10B981; font-size: 14px;">ยอดขาย: ${params[0].value.toLocaleString()} บาท</div>
                              </div>
                            `;
                          }
                        },
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '3%',
                          containLabel: true
                        },
                        xAxis: {
                          type: 'category',
                          data: chartData.dailyWins.map(item => item.date),
                          axisLabel: {
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#374151',
                            interval: Math.floor(chartData.dailyWins.length / 8),
                            rotate: 45
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          }
                        },
                        yAxis: {
                          type: 'value',
                          name: 'ยอดขาย (บาท)',
                          nameTextStyle: {
                            color: '#374151',
                            fontSize: 12,
                            fontWeight: 'bold'
                          },
                          axisLabel: {
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#374151',
                            formatter: function(value: number) {
                              return (value / 1000).toFixed(0) + 'K';
                            }
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#F3F4F6'
                            }
                          }
                        },
                        series: [
                          {
                            name: 'ยอดขาย',
                            type: 'bar',
                            data: chartData.dailyWins.map(item => item.totalSales),
                            itemStyle: {
                              color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                  { offset: 0, color: '#10B981' },
                                  { offset: 1, color: '#059669' }
                                ]
                              },
                              borderRadius: [4, 4, 0, 0]
                            },
                            emphasis: {
                              itemStyle: {
                                color: '#047857',
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(16, 185, 129, 0.3)'
                              }
                            }
                          }
                        ],
                        animation: true,
                        animationDuration: 1000,
                        animationEasing: 'cubicOut'
                      }}
                      style={{ height: '300px', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </CardContent>
                </Card>
              </div>


            </div>


          </div>

          {/* Platform Stats and Thailand Map Row */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* แหล่งที่มาของลีด - ด้านซ้าย */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
                  <span className="mx-4 text-gray-400 font-medium text-lg">
                    แหล่งที่มาของลีด
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {stats.platformStats.map((platform, index) => {
                    const colorClass = platformColors[platform.name as keyof typeof platformColors] || 'border-gray-200 text-gray-600';
                    const [borderClass, textClass] = colorClass.split(' ');
                    
                    return (
                      <Card key={index} className={`hover:shadow-lg transition-all duration-300 ${borderClass} border-2`}>
                        <CardContent className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <div className="flex-shrink-0">
                              {getPlatformIcon(platform.name)}
                            </div>
                            <div className={`text-2xl font-bold ${textClass}`}>{platform.count}</div>
                            <div className="text-sm font-medium text-gray-900 truncate">{platform.name}</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* ภาพรวมข้อมูลตามจังหวัด - ด้านขวา */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
                  <span className="mx-4 text-gray-400 font-medium text-lg">
                    ภาพรวมข้อมูลตามจังหวัด
                    {leadsLoading && <span className="ml-2 text-sm text-gray-500">(กำลังโหลดข้อมูล...)</span>}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
                </div>
                {Object.keys(mapData).length > 0 ? (
                  <ThailandMap 
                    regionData={mapData}
                    onRegionClick={(region) => {
              
                      // สามารถเพิ่มการนำทางไปยังหน้าจัดการลีดตามจังหวัดได้ที่นี่
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-gray-500 text-lg mb-2">
                        {leadsLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่มีข้อมูลลีด'}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {leadsLoading ? 'กรุณารอสักครู่' : 'ข้อมูลลีดจะแสดงบนแผนที่เมื่อมีการเพิ่มลีดใหม่'}
                      </div>
                    </div>
                  </div>
                )}
                

              </div>
            </div>
          </div>

          {/* Feature Highlights Section */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
              <span className="mx-4 text-gray-400 font-medium text-lg">จุดเด่นของระบบ</span>
              <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureHighlights.map((f, i) => (
                <Card key={i} className="w-full shadow-sm hover:shadow-lg transition-all border-green-100 hover:border-green-200 group bg-white/95 rounded-2xl">
                  <CardHeader className="flex flex-col items-center text-center gap-4 py-12">
                    <div className="rounded-full bg-green-50 group-hover:bg-green-100 p-5 mb-2 shadow-sm">
                      {f.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">{f.title}</CardTitle>
                    <CardDescription className="text-gray-600 text-lg">{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export const QuotationPage = () => (
  <div className="w-full flex flex-col items-center justify-center py-8 px-2">
    <div className="w-full max-w-4xl rounded-2xl shadow-lg overflow-hidden border border-green-100 bg-white">
      <iframe
        src="https://auth.flowaccount.com/th?_gl=1*1mdbqjb*_ga*MjkxOTIyMTE2LjE3NTIwMzYwMjU.*_up*MQ"
        title="Quotation FlowAccount"
        className="w-full h-[80vh] border-0"
        style={{ borderRadius: '1rem' }}
        allowFullScreen
      />
    </div>
  </div>
);

export default Index;
