import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * กรองเฉพาะลีดที่มีข้อมูลติดต่อ (tel หรือ line_id)
 * ใช้ computed column 'has_contact_info' จาก database
 * 
 * Logic: (tel IS NOT NULL AND tel != '') OR (line_id IS NOT NULL AND line_id != '')
 * 
 * @example
 * ```typescript
 * let query = supabase.from('leads').select('*');
 * query = filterLeadsWithContact(query);
 * ```
 */
export function filterLeadsWithContact<T extends Record<string, any>>(
  query: PostgrestFilterBuilder<any, T, any>
): PostgrestFilterBuilder<any, T, any> {
  return query.eq('has_contact_info', true as any);
}
