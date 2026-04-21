import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

export interface ChatBotPerformanceData {
  /** ISO date key (YYYY-MM-DD) for stable sorting and joins */
  date: string;
  /** Thai short date for chart label */
  displayDate: string;
  totalUsers: number;
  leadsWithContact: number;
  conversionRate: number;
}

// UUID ของ chatbot (created_by)
const CHATBOT_CREATOR_ID = '61d93b4f-6536-4e30-b51b-0732591bac12';

export const useChatBotPerformance = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['chat-bot-performance', dateRange],
    queryFn: async () => {
      // ตั้งค่า default date range ถ้าไม่มีการส่งมา
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const fromDate = dateRange?.from || sevenDaysAgo;
      const toDate = dateRange?.to || today;

      // Query ข้อมูล leads จาก chatbot
      // กรองเหมือน SQL Query: มี user_id_platform และ created_by = chatbot
      let query = supabase
        .from('leads')
        .select('created_at_thai, user_id_platform, tel, line_id, created_by, has_contact_info')
        .eq('created_by', CHATBOT_CREATOR_ID)
        .not('user_id_platform', 'is', null);

      // เพิ่ม date range filter (ใช้ Intl.DateTimeFormat กับ timezone ไทยเพื่อความถูกต้อง)
      let fromDateStr = '';
      let toDateStr = '';
      
      if (fromDate && toDate) {
        // ใช้ Intl.DateTimeFormat กับ Thailand timezone เหมือน AllLeadsReport
        const formatter = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        // Format start date - Start from 00:00:00 Thai time
        const startDateString = formatter.format(fromDate);
        const startString = startDateString + 'T00:00:00.000';
        fromDateStr = startString;
        
        // Format end date - End at 23:59:59 Thai time
        const endDateString = formatter.format(toDate);
        const endString = endDateString + 'T23:59:59.999';
        toDateStr = endString;
        
        query = query
          .gte('created_at_thai', startString)
          .lte('created_at_thai', endString);
      }

      const { data: leadsData, error } = await query;


      if (error) throw error;
      if (!leadsData || leadsData.length === 0) {
        // ถ้าไม่มีข้อมูล ส่งกลับ array ว่างสำหรับทุกวันในช่วงที่เลือก
        return generateEmptyData(fromDate, toDate);
      }

      // จัดกลุ่มข้อมูลตามวัน
      const dailyData = new Map<string, ChatBotPerformanceData>();

      // สร้างวันทั้งหมดในช่วงที่เลือก
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const dateKey = formatDateKey(currentDate);
        const displayDate = formatDisplayDate(currentDate);
        dailyData.set(dateKey, {
          date: dateKey,
          displayDate,
          totalUsers: 0,
          leadsWithContact: 0,
          conversionRate: 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // นับข้อมูลจริง
      leadsData.forEach(lead => {
        // ✅ ใช้ created_at_thai โดยตรงโดยไม่แปลง timezone
        // เพราะ created_at_thai เป็นเวลาไทยอยู่แล้ว
        const dateKey = lead.created_at_thai!.split('T')[0]; // เอาแค่วันที่ YYYY-MM-DD
        
        const dayData = dailyData.get(dateKey);
        if (dayData) {
          // ✅ นับผู้ใช้ทั้งหมด (query กรอง user_id_platform IS NOT NULL แล้ว)
          dayData.totalUsers++;
          
          // ✅ นับลีดที่มีข้อมูลติดต่อ (ใช้ has_contact_info computed column จาก database)
          // Logic: (tel IS NOT NULL AND tel != '') OR (line_id IS NOT NULL AND line_id != '')
          if (lead.has_contact_info === true) {
            dayData.leadsWithContact++;
          }
        }
      });

      // คำนวณ conversion rate
      dailyData.forEach(dayData => {
        if (dayData.totalUsers > 0) {
          dayData.conversionRate = Math.round((dayData.leadsWithContact / dayData.totalUsers) * 100);
        }
      });

      // แปลง Map เป็น Array และเรียงตามวันที่จริง (YYYY-MM-DD)
      const result = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));

      return result;
    },
    refetchInterval: 60000, // Refetch ทุก 1 นาที
    staleTime: 0, // ไม่ใช้ cache เลย
    gcTime: 0, // ไม่เก็บ cache (React Query v5)
  });
};

// Helper functions
function formatDateKey(date: Date): string {
  // ใช้ Intl.DateTimeFormat กับ Thailand timezone เพื่อความถูกต้อง
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

function formatDateForQuery(date: Date): string {
  // ใช้ Intl.DateTimeFormat กับ Thailand timezone เพื่อความถูกต้อง
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

function formatDisplayDate(date: Date): string {
  // รูปแบบ: "15 ต.ค." หรือ "1 ม.ค."
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${date.getDate()} ${thaiMonths[date.getMonth()]}`;
}

function generateEmptyData(fromDate: Date, toDate: Date): ChatBotPerformanceData[] {
  const result: ChatBotPerformanceData[] = [];
  const currentDate = new Date(fromDate);
  
  while (currentDate <= toDate) {
    result.push({
      date: formatDateKey(currentDate),
      displayDate: formatDisplayDate(currentDate),
      totalUsers: 0,
      leadsWithContact: 0,
      conversionRate: 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

