// Utility functions for date filtering with Thailand timezone fields

/**
 * Get current date in Thailand timezone (UTC+7)
 * ไม่ต้องบวก +7 ชั่วโมง เพราะ created_at_thai เก็บเวลาไทยแล้ว
 */
export function getThailandDate(): Date {
  const now = new Date();
  // ไม่ต้องบวก +7 ชั่วโมง เพราะ created_at_thai เก็บเวลาไทยแล้ว
  return now;
}

/**
 * Get start of week (Monday) for a given date
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1, Sunday = 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if a date is within the specified date range (using created_at_thai)
 * Now supports both string filters and DateRange objects from DateRangePicker
 */
export function isInDateRange(
  createdAtThai: string, 
  dateRangeFilter: string | { from?: Date; to?: Date } | undefined
): boolean {
  // ตรวจสอบ input validation ก่อน
  if (!createdAtThai || typeof createdAtThai !== 'string') {
    console.warn('Invalid createdAtThai value:', createdAtThai);
    return false;
  }

  // ตรวจสอบว่าสามารถแปลงเป็น Date ได้หรือไม่
  const testDate = new Date(createdAtThai);
  if (isNaN(testDate.getTime())) {
    console.warn('Invalid date format:', createdAtThai);
    return false;
  }

  const thailandNow = getThailandDate();
  
  // Handle DateRange object from DateRangePicker
  if (dateRangeFilter && typeof dateRangeFilter === 'object' && 'from' in dateRangeFilter) {
    try {
      const { from, to } = dateRangeFilter;
      if (!from) return true; // No start date means show all
      
      const createdDate = new Date(testDate);
      const fromDate = new Date(from);
      
      // เปรียบเทียบเฉพาะวันที่ ไม่รวมเวลา
      const createdDateString = createdDate.toISOString().split('T')[0];
      const fromDateString = fromDate.toISOString().split('T')[0];
      
      // If no end date, just check from date
      if (!to) {
        return createdDateString >= fromDateString;
      }
      
      const toDate = new Date(to);
      const toDateString = toDate.toISOString().split('T')[0];
      
      return createdDateString >= fromDateString && createdDateString <= toDateString;
    } catch (error) {
      console.error('Error in DateRange filter:', error, { dateRangeFilter, createdAtThai });
      return false;
    }
  }
  
  // Handle string filters (legacy support)
  if (typeof dateRangeFilter !== 'string') {
    return true; // Show all if invalid filter type
  }
  
  if (dateRangeFilter === "today") {
    try {
      // ใช้เวลาที่ถูกต้องแล้วจาก created_at_thai
      const todayString = thailandNow.toISOString().split('T')[0]; // YYYY-MM-DD
      const createdString = testDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Compare date strings
      return createdString === todayString;
    } catch (error) {
      console.error('Error in today filter:', error, { createdAtThai });
      return false;
    }
  }
  
  if (dateRangeFilter === "this_week") {
    try {
      // คำนวณ start และ end ของสัปดาห์
      const startOfWeek = getStartOfWeek(thailandNow);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      // แปลงเป็น string format
      const startString = startOfWeek.toISOString().split('T')[0];
      const endString = endOfWeek.toISOString().split('T')[0];
      const createdString = testDate.toISOString().split('T')[0];
      
      // เปรียบเทียบ string
      return createdString >= startString && createdString <= endString;
    } catch (error) {
      console.error('Error in this_week filter:', error, { createdAtThai });
      return false;
    }
  }
  
  if (dateRangeFilter === "this_month") {
    try {
      return testDate.getFullYear() === thailandNow.getFullYear() && 
             testDate.getMonth() === thailandNow.getMonth();
    } catch (error) {
      console.error('Error in this_month filter:', error, { createdAtThai });
      return false;
    }
  }
  
  return true; // Show all if no filter or invalid filter
}

/**
 * Get UTC date range for query, using Thailand timezone (UTC+7)
 * @param dateRangeFilter string ('today', '7', '30', ...)
 * @returns { start: string, end: string }
 */
export function getThailandDateRangeForQuery(dateRangeFilter: string): { start: string, end: string } {
  if (dateRangeFilter === 'all') {
    // สำหรับ 'all' ไม่ต้องกรองวันที่
    return { start: '', end: '' };
  }
  
  if (dateRangeFilter === 'today') {
    // สำหรับ 'today' ใช้เวลาปัจจุบันของไทย
    // ใช้ Intl API เพื่อให้ได้วันที่ที่ถูกต้องใน Thailand timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const todayString = formatter.format(now); // Format: YYYY-MM-DD
    
    // สร้าง start และ end time โดยไม่ใช้ timezone offset
    // ใช้ UTC time ที่ตรงกับ Thailand timezone
    const startString = todayString + 'T00:00:00.000Z';  // UTC 00:00 = Thailand 07:00
    const endString = todayString + 'T23:59:59.999Z';    // UTC 23:59 = Thailand 06:59
    
    return { 
      start: startString, 
      end: endString 
    };
  }
  
  // สำหรับวันที่อื่นๆ (7, 30, etc.)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // คำนวณวันสิ้นสุด (วันนี้)
  const endDateString = formatter.format(now);
  
  // คำนวณวันเริ่มต้น (ย้อนหลัง N วัน)
  const startDate = new Date(now.getTime() - (parseInt(dateRangeFilter) * 24 * 60 * 60 * 1000));
  const startDateString = formatter.format(startDate);

  // สร้าง start และ end time โดยไม่ใช้ timezone offset
  const startString = startDateString + 'T00:00:00.000Z';
  const endString = endDateString + 'T23:59:59.999Z';

  return { 
    start: startString, 
    end: endString 
  };
}

/**
 * Get date range display text
 */
export function getDateRangeDisplayText(dateRangeFilter: string): string {
  switch (dateRangeFilter) {
    case "today":
      return "วันนี้";
    case "this_week":
      return "สัปดาห์นี้";
    case "this_month":
      return "เดือนนี้";
    case "all":
      return "ทั้งหมด";
    default:
      return "ทั้งหมด";
  }
} 