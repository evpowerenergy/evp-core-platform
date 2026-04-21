import type { EvMemberEnrichedLead } from "@/services/evMemberReportService";

export type EvMemberCustomerSortKey = "amount" | "events";
export type EvMemberSortOrder = "asc" | "desc";

export interface EvMemberCustomerRow {
  leadId: number;
  rank: number;
  displayName: string;
  fullName: string;
  category: string;
  platform: string;
  tel: string;
  lineId: string;
  region: string;
  leadNotes: string | null;
  /** จำนวนครั้งที่ปิดการขายสำเร็จ (จำนวน productivity log ที่มี QT) */
  purchaseEventCount: number;
  totalQuotationAmount: number;
  totalQuotationCountSum: number;
  lastActivityDate: string | null;
}

function compareCustomers(
  a: EvMemberCustomerRow,
  b: EvMemberCustomerRow,
  sortKey: EvMemberCustomerSortKey,
  order: EvMemberSortOrder
): number {
  const mul = order === "desc" ? -1 : 1;

  if (sortKey === "amount") {
    const diff = (a.totalQuotationAmount - b.totalQuotationAmount) * mul;
    if (diff !== 0) return diff;
    const tie = (b.purchaseEventCount - a.purchaseEventCount);
    if (tie !== 0) return tie;
  } else {
    const diff = (a.purchaseEventCount - b.purchaseEventCount) * mul;
    if (diff !== 0) return diff;
    const tie = (b.totalQuotationAmount - a.totalQuotationAmount);
    if (tie !== 0) return tie;
  }

  const nameCmp = (a.displayName || "").localeCompare(b.displayName || "", "th");
  if (nameCmp !== 0) return nameCmp;
  return a.leadId - b.leadId;
}

/**
 * รวมแถวระดับ log เป็นหนึ่งแถวต่อ lead_id แล้วเรียงลำดับและใส่อันดับ 1..n
 */
export function aggregateEvMemberCustomers(
  rows: EvMemberEnrichedLead[],
  sortKey: EvMemberCustomerSortKey,
  order: EvMemberSortOrder
): EvMemberCustomerRow[] {
  const byLead = new Map<number, EvMemberCustomerRow>();

  for (const r of rows) {
    const lid = r.leadId;
    const activity = r.created_at_thai || "";
    const existing = byLead.get(lid);

    if (!existing) {
      byLead.set(lid, {
        leadId: lid,
        rank: 0,
        displayName: r.display_name,
        fullName: r.full_name,
        category: r.category || "ไม่ระบุ",
        platform: r.platform || "ไม่ระบุ",
        tel: r.tel,
        lineId: r.line_id,
        region: r.region,
        leadNotes: r.lead_notes,
        purchaseEventCount: 1,
        totalQuotationAmount: r.totalQuotationAmount || 0,
        totalQuotationCountSum: r.totalQuotationCount || 0,
        lastActivityDate: activity || null,
      });
    } else {
      existing.purchaseEventCount += 1;
      existing.totalQuotationAmount += r.totalQuotationAmount || 0;
      existing.totalQuotationCountSum += r.totalQuotationCount || 0;
      if (activity && (!existing.lastActivityDate || activity > existing.lastActivityDate)) {
        existing.lastActivityDate = activity;
      }
    }
  }

  const list = Array.from(byLead.values());
  list.sort((a, b) => compareCustomers(a, b, sortKey, order));

  return list.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
