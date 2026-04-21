// Lead Status options - now controlled by database trigger
export const LEAD_STATUS_OPTIONS = [
  'รอรับ',
  'กำลังติดตาม', 
  'ปิดการขาย',
  'ยังปิดการขายไม่สำเร็จ'
] as const;

// Operation Status options - these control the lead status automatically
export const OPERATION_STATUS_OPTIONS = [
  'อยู่ระหว่างการติดต่อ',
  'อยู่ระหว่างการสำรวจ',
  'อยู่ระหว่างยืนยันใบเสนอราคา',
  'ยังปิดการดำเนินงานไม่ได้',
  'ปิดการขายแล้ว',
  'ปิดการขายไม่สำเร็จ',
  'ติดตามหลังการขาย'
] as const;

export type LeadStatus = typeof LEAD_STATUS_OPTIONS[number];
export type OperationStatus = typeof OPERATION_STATUS_OPTIONS[number];

// Get status colors for Lead Status
export const getLeadStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'รอรับ':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'กำลังติดตาม':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ปิดการขาย':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ยังปิดการขายไม่สำเร็จ':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Get status colors for Operation Status
export const getOperationStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'อยู่ระหว่างการติดต่อ':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'อยู่ระหว่างการสำรวจ':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'อยู่ระหว่างยืนยันใบเสนอราคา':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'ยังปิดการดำเนินงานไม่ได้':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'ปิดการขายแล้ว':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ปิดการขายไม่สำเร็จ':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'ติดตามหลังการขาย':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Helper function to explain status mapping
export const getStatusMappingExplanation = (operationStatus: string, saleOwnerId: number | null) => {
  if (!saleOwnerId) {
    return 'สถานะ Lead: รอรับ (ยังไม่มี Sale รับ)';
  }
  
  switch (operationStatus) {
    case 'ปิดการขายแล้ว':
      return 'สถานะ Lead: ปิดการขาย (ดำเนินการเสร็จสิ้น)';
    case 'ปิดการขายไม่สำเร็จ':
      return 'สถานะ Lead: ยังปิดการขายไม่สำเร็จ (ไม่สำเร็จ)';
    case 'ติดตามหลังการขาย':
      return 'สถานะ Lead: ปิดการขาย (กำลังติดตามหลังการขาย)';
    default:
      return 'สถานะ Lead: กำลังติดตาม (มี Sale รับและกำลังดำเนินการ)';
  }
};
