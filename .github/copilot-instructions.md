# Copilot Project Instructions

## Product Requirements Document (PRD): EV Power Energy CRM

### 1. ภาพรวมระบบ
ระบบ CRM สำหรับจัดการ lead ฝ่ายขาย (B2C/Package และ B2B/Wholesale) สำหรับธุรกิจพลังงานสะอาด (EV/พลังงานหมุนเวียน)

---

### 2. ฟีเจอร์หลัก (Main Features)

#### 2.1 Authentication & Authorization
- ระบบล็อกอิน, session, role-based access (sale/admin/manager), "จดจำข้อมูลการเข้าสู่ระบบ"
- User Flow:
  1. ผู้ใช้เข้าหน้า Login
  2. กรอก username/password
  3. เลือก "จดจำข้อมูลการเข้าสู่ระบบ" (optional)
  4. ระบบตรวจสอบสิทธิ์และ redirect ตาม role
- Acceptance Criteria:
  - ล็อกอินสำเร็จ/ล้มเหลวมี feedback ชัดเจน
  - Session หมดอายุอัตโนมัติ
  - Role ถูกต้องตาม user
- UI/UX:
  - ฟอร์ม login สะอาด, ปุ่มเด่น, error message ชัดเจน

---

#### 2.2 Leads Management
- เพิ่ม/ดู/แก้ไข lead, assign sales, follow-up, สรุปสถานะ lead, filter/search, export/report
- User Flow:
  1. เพิ่ม lead: กรอกฟอร์ม, กดบันทึก, redirect ไปหน้า dashboard
  2. ดู/แก้ไข lead: คลิก lead, แก้ไขข้อมูล, กดบันทึก
  3. Assign sales: เลือก sales, กด assign
  4. Follow-up: เพิ่ม log, อัปเดตสถานะ
- Acceptance Criteria:
  - เพิ่ม/แก้ไข lead ได้ครบทุก field
  - Assign sales ได้, มี notification
  - Filter/search ได้ตาม status, operation status, platform, category, วันที่, คำค้นหา
- UI/UX:
  - Table lead, filter bar, action button ชัดเจน, modal ฟอร์มใช้งานง่าย

---

#### 2.3 Sales Team Management
- ดูข้อมูลทีม, สถิติ, performance chart, leaderboard, จัดการสมาชิกทีม
- User Flow:
  1. เข้าหน้า Sales Team
  2. ดูรายชื่อ, performance, กราฟ
  3. เพิ่ม/แก้ไข/ลบสมาชิก (admin)
- Acceptance Criteria:
  - ดูข้อมูลทีมได้, กราฟแสดงผลถูกต้อง
  - เพิ่ม/ลบ/แก้ไขสมาชิกได้ (เฉพาะ admin)
- UI/UX:
  - Card/ตารางสมาชิก, กราฟ performance, ปุ่ม action เด่น

---

#### 2.4 Productivity Log
- ฟอร์มบันทึกกิจกรรม, สร้าง appointment, quotation, follow-up, timeline
- User Flow:
  1. เลือก lead > เพิ่ม productivity log
  2. กรอกข้อมูลกิจกรรม, เลือกประเภท (appointment/quotation/follow-up)
  3. บันทึก log, แสดงใน timeline
- Acceptance Criteria:
  - เพิ่ม log ได้, ข้อมูลครบถ้วน
  - Timeline เรียงตามเวลา, ดูย้อนหลังได้
- UI/UX:
  - ฟอร์ม log, timeline UI, ปุ่มเพิ่ม log เด่น

---

#### 2.5 Appointment Management
- ตารางนัดหมาย, เพิ่ม/แก้ไข/ลบ appointment, รายละเอียดนัดหมาย, สรุปนัด
- User Flow:
  1. เข้าหน้า My Appointments
  2. ดูตารางนัด, คลิกดูรายละเอียด
  3. เพิ่ม/แก้ไข/ลบ appointment
- Acceptance Criteria:
  - ตารางนัดแสดงข้อมูลถูกต้อง
  - เพิ่ม/แก้ไข/ลบได้, มี feedback
- UI/UX:
  - Calendar view, modal รายละเอียด, ปุ่ม action ชัดเจน

---

#### 2.6 Dashboard & Analytics
- Dashboard สถิติ lead, สถานะ, กราฟ, activity feed, แยกตามประเภท (Package/Wholesale)
- User Flow:
  1. เข้าหน้า Dashboard
  2. ดูสถิติ, กราฟ, activity feed
- Acceptance Criteria:
  - ข้อมูลอัปเดตเรียลไทม์
  - กราฟ/สถิติถูกต้อง
- UI/UX:
  - Card summary, กราฟ, activity feed, responsive

---

#### 2.7 Pipeline Management
- แสดง pipeline การขาย, ติดตามความคืบหน้า lead
- User Flow:
  1. เข้าหน้า Pipeline
  2. ดู lead ในแต่ละ stage
- Acceptance Criteria:
  - Pipeline แสดง lead ถูกต้อง
  - อัปเดต stage ได้
- UI/UX:
  - Kanban/stepper view, drag & drop (optional)

---

#### 2.8 Product Management (Wholesale)
- จัดการอุปกรณ์ (เพิ่ม/แก้ไข/ลบ/ดู), ข้อมูลสินค้า: ชื่อ, หมวดหมู่, ราคาขาย, ราคาทุน, รายละเอียด
- User Flow:
  1. เข้าหน้า Product Management (เฉพาะ Wholesale)
  2. ดู/เพิ่ม/แก้ไข/ลบอุปกรณ์
- Acceptance Criteria:
  - เพิ่ม/แก้ไข/ลบอุปกรณ์ได้, ข้อมูลครบถ้วน
- UI/UX:
  - Table สินค้า, modal ฟอร์ม, ปุ่ม action เด่น

---

#### 2.9 Reporting
- รายงานลีดทั้งหมด, สรุป lead แยกตามประเภท, dashboard รายงาน (Package/Wholesale)
- User Flow:
  1. เข้าหน้ารายงาน
  2. Filter/Export ข้อมูล
- Acceptance Criteria:
  - รายงานแสดงข้อมูลถูกต้อง
  - Export ได้ (CSV/Excel)
- UI/UX:
  - Table รายงาน, filter bar, ปุ่ม export

---

#### 2.10 Notification & Toast
- แจ้งเตือนสถานะต่าง ๆ (บันทึกสำเร็จ, ลบสำเร็จ, error)
- User Flow:
  1. ทำ action (เพิ่ม/ลบ/แก้ไข)
  2. ระบบแสดง toast แจ้งเตือน
- Acceptance Criteria:
  - Toast แสดงถูกต้อง, ปิดเองอัตโนมัติ
- UI/UX:
  - Toast UI, สี/ไอคอนตามสถานะ

---

### 3. ฟีเจอร์ย่อย/รายละเอียดเพิ่มเติม

#### 3.1 Lead Status & Operation Status
- สถานะ lead: ใหม่, กำลังติดตาม, ปิดการขายแล้ว, ปิดการขายไม่สำเร็จ ฯลฯ
- Operation status: อยู่ระหว่างการติดต่อ, อยู่ระหว่างการสำรวจ, อยู่ระหว่างยืนยันใบเสนอราคา, ยังปิดการดำเนินงานไม่ได้, ปิดการขายแล้ว, ปิดการขายไม่สำเร็จ

#### 3.2 Tag Management
- เพิ่ม/ลบ tag ให้ lead, suggestion tag

#### 3.3 Filter & Search
- Filter lead ตาม status, operation status, platform, category, วันที่, คำค้นหา

#### 3.4 Activity Feed
- แสดงกิจกรรมล่าสุดใน dashboard

#### 3.5 Platform Integration
- รองรับหลาย platform (LINE, Facebook, Shopee, Lazada, TikTok, Website ฯลฯ)

---

### 4. Security & Coding Standard
- หลีกเลี่ยง hardcode secret
- ตรวจสอบ input validation ทุกจุด
- ใช้ Supabase RLS และฟังก์ชัน SQL สำหรับ role-based access
- TypeScript, TailwindCSS, PascalCase, async/await, react-query

---

### 5. UI/UX Guideline (โดยรวม)
- Responsive design ทุกหน้าจอ
- ปุ่ม action เด่น, error/success feedback ชัดเจน
- Modal ใช้งานง่าย, กราฟิก/ไอคอนสื่อความหมาย
- Table/Filter ใช้งานง่าย, export ได้

---

*เอกสารนี้สามารถใช้เป็นแนวทางสำหรับ AI Copilot, refactor, generate test, update doc, และ onboard ทีมใหม่ได้ทันที*
