import { useMemo } from 'react';
import { useAppointmentsAPI } from './useAppointmentsAPI';

export interface AppointmentNotification {
  id: number;
  date: string;
  date_thai?: string; // ✅ เพิ่ม date_thai สำหรับใช้ในการคำนวณ
  type: 'follow-up' | 'engineer' | 'payment';
  lead: {
    id: number;
    full_name?: string;
    tel?: string;
    region?: string;
    platform?: string;
  };
  details?: string;
  location?: string;
  status?: string;
  note?: string;
  total_amount?: number;
  payment_method?: string;
}

/**
 * Hook สำหรับจัดการข้อมูลการแจ้งเตือนการนัดหมาย
 * - ดึงข้อมูล appointments
 * - กรองนัดหมายวันนี้
 * - คำนวณเวลาที่เหลือก่อนนัดหมาย
 */
export const useAppointmentNotifications = () => {
  const { data: appointmentsData, isLoading, error } = useAppointmentsAPI();

  // รวม appointments ทั้งหมด
  const allAppointments = useMemo(() => {
    if (!appointmentsData) return [];
    
    return [
      ...(appointmentsData.followUp || []),
      ...(appointmentsData.engineer || []),
      ...(appointmentsData.payment || [])
    ] as AppointmentNotification[];
  }, [appointmentsData]);

  // กรองนัดหมายวันนี้ - ใช้ date_thai เพื่อหลีกเลี่ยงปัญหา timezone
  const todayAppointments = useMemo(() => {
    // ✅ ใช้ Intl API เพื่อให้ได้วันที่ที่ถูกต้องใน Thailand timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayString = formatter.format(now); // Format: YYYY-MM-DD

    const filtered = allAppointments.filter(apt => {
      // ✅ ใช้ date_thai แทน date เพื่อหลีกเลี่ยงปัญหา timezone
      const appointmentDate = apt.date_thai || apt.date;
      if (!appointmentDate) return false;
      
      // ✅ ถ้าใช้ date_thai ต้องลบ 7 ชั่วโมงออกก่อน (เพราะมันถูกบวกมาแล้วใน database)
      let aptDate: Date;
      if (apt.date_thai) {
        const tempDate = new Date(appointmentDate);
        aptDate = new Date(tempDate.getTime() - (7 * 60 * 60 * 1000)); // ลบ 7 ชั่วโมง
      } else {
        aptDate = new Date(appointmentDate);
      }
      
      // ✅ ใช้ formatter เพื่อให้ได้วันที่ใน Thailand timezone
      const aptDateString = formatter.format(aptDate);
      
      // ✅ เปรียบเทียบแค่ส่วนวันที่ (YYYY-MM-DD) เพื่อหลีกเลี่ยงปัญหา timezone
      return aptDateString === todayString;
    }).sort((a, b) => {
      // เรียงตามเวลา - ใช้ date_thai ถ้ามี และลบ 7 ชั่วโมงออกก่อน
      let timeA: number;
      let timeB: number;
      
      if (a.date_thai) {
        const tempDateA = new Date(a.date_thai);
        timeA = new Date(tempDateA.getTime() - (7 * 60 * 60 * 1000)).getTime();
      } else {
        timeA = new Date(a.date).getTime();
      }
      
      if (b.date_thai) {
        const tempDateB = new Date(b.date_thai);
        timeB = new Date(tempDateB.getTime() - (7 * 60 * 60 * 1000)).getTime();
      } else {
        timeB = new Date(b.date).getTime();
      }
      
      return timeA - timeB;
    });

    return filtered;
  }, [allAppointments]);

  // นัดหมายที่ใกล้ถึงเวลา (สำหรับ Toast notification)
  // ⚠️ หมายเหตุ: upcomingAppointments นี้ใช้สำหรับ NotificationBell เท่านั้น
  // สำหรับ Toast notification จะคำนวณแบบ real-time ใน AppointmentToastNotifier
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    
    const filtered = allAppointments
      .filter(apt => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);
        const timeUntil = aptDate.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeUntil / (1000 * 60));
        
        // แจ้งเตือนเมื่อเหลือ 14-15 นาที (ช่วงนี้)
        return minutesUntil <= 15 && minutesUntil >= 14;
      })
      .map(apt => {
        const aptDate = new Date(apt.date);
        const now = new Date();
        const timeUntil = aptDate.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeUntil / (1000 * 60));
        
        return {
          ...apt,
          minutesUntil
        };
      });
    
    return filtered;
  }, [allAppointments]);

  return {
    allAppointments,
    todayAppointments,
    upcomingAppointments,
    todayCount: todayAppointments.length,
    isLoading,
    error
  };
};

