// Safe date filtering with Thailand timezone fields
export function safeIsInDateRange(
  createdAtThai: string, 
  dateRangeFilter: string, 
  customDateRange?: { start: string; end: string }
): boolean {
  
  // ตรวจสอบ input validation ก่อน
  if (!createdAtThai || typeof createdAtThai !== 'string') {
    console.warn('safeIsInDateRange: Invalid createdAtThai value:', createdAtThai);
    return false;
  }

  // ตรวจสอบว่าสามารถแปลงเป็น Date ได้หรือไม่
  const testDate = new Date(createdAtThai);
  if (isNaN(testDate.getTime())) {
    console.warn('safeIsInDateRange: Invalid date format:', createdAtThai);
    return false;
  }

  // Helper function to get Thailand date string safely
  function getThailandDateString(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '';
      }
      
      // ใช้เวลาที่ถูกต้องแล้วจาก created_at_thai
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return '';
    }
  }
  
  // Helper function to get current Thailand date string
  function getCurrentThailandDateString(): string {
    try {
      const now = new Date();
      // ไม่ต้องบวก +7 ชั่วโมง เพราะ created_at_thai เก็บเวลาไทยแล้ว
      return now.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error getting current date:', error);
      return '';
    }
  }
  
  if (dateRangeFilter === "today") {
    const createdString = getThailandDateString(createdAtThai);
    const todayString = getCurrentThailandDateString();
    
    // Validation
    if (!createdString || !todayString) {
      console.error('Invalid date strings:', { createdString, todayString });
      return false;
    }
    
    return createdString === todayString;
  }
  
  if (dateRangeFilter === "this_week") {
    try {
      const now = new Date();
      // ไม่ต้องบวก +7 ชั่วโมง เพราะ created_at_thai เก็บเวลาไทยแล้ว
      
      // Get start of week (Monday)
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Get end of week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const createdDate = new Date(createdAtThai);
      
      return createdDate >= startOfWeek && createdDate <= endOfWeek;
    } catch (error) {
      console.error('Error in this_week filter:', error);
      return false;
    }
  }
  
  if (dateRangeFilter === "this_month") {
    try {
      const now = new Date();
      // ไม่ต้องบวก +7 ชั่วโมง เพราะ created_at_thai เก็บเวลาไทยแล้ว
      
      const createdDate = new Date(createdAtThai);
      
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear();
    } catch (error) {
      console.error('Error in custom filter:', error);
      return false;
    }
  }
  
  if (dateRangeFilter === "custom" && customDateRange) {
    try {
      const { start, end } = customDateRange;
      const createdDate = new Date(createdAtThai);
      
      return createdDate >= new Date(start) && createdDate <= new Date(end);
    } catch (error) {
      console.error('Error in custom filter:', error);
      return false;
    }
  }
  
  return true; // Show all if no filter or invalid filter
}

// Test function for the safe version
export function testSafeDateFilter() {

  
  // Test with various edge cases
  const testCases = [
    {
      name: 'Normal case',
      date: '2025-07-21T04:27:47.893101+00:00',
      expected: true
    },
    {
      name: 'Near midnight UTC',
      date: '2025-07-21T23:30:00.000Z',
      expected: true
    },
    {
      name: 'Invalid date',
      date: 'invalid-date',
      expected: false
    },
    {
      name: 'Null date',
      date: null,
      expected: false
    }
  ];
  
  testCases.forEach(testCase => {
    try {
      const result = safeIsInDateRange(testCase.date, 'today');
  
    } catch (error) {
      
    }
  });
}

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).safeIsInDateRange = safeIsInDateRange;
  (window as any).testSafeDateFilter = testSafeDateFilter;
} 