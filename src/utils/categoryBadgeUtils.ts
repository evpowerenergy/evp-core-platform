/**
 * Utility functions for category badge styling
 * ใช้สำหรับกำหนดสี Badge "กลุ่มลูกค้า" ให้สอดคล้องกันทั่วทั้งระบบ
 */

/**
 * กำหนด className สำหรับ Badge category
 * Package → สีเขียว
 * Wholesales/Wholesale → สีเหลือง
 * อื่นๆ → สีเทา
 */
export function getCategoryBadgeClassName(category: string | null | undefined): string {
  if (!category) {
    return 'text-xs bg-gray-100 text-gray-800 border-gray-200';
  }
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('package')) {
    // Package → สีเขียว
    return 'text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
  } else if (categoryLower.includes('wholesale')) {
    // Wholesales/Wholesale → สีเหลือง
    return 'text-xs bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
  } else {
    // อื่นๆ → สีเทา (default)
    return 'text-xs bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * กำหนด className สำหรับ Badge category (แบบ inline style)
 * ใช้เมื่อต้องการ custom className เพิ่มเติม
 */
export function getCategoryBadgeClassNameWithCustom(
  category: string | null | undefined,
  customClassName: string = ''
): string {
  const baseClassName = getCategoryBadgeClassName(category);
  return `${baseClassName} ${customClassName}`.trim();
}





