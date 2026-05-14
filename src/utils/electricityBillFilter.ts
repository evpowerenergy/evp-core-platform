export type ElectricityBillFilterBucket =
  | 'all'
  | 'unknown'
  | 'lt_2000'
  | '2000_5000'
  | '5000_10000'
  | 'gte_10000';

/** Parse `avg_electricity_bill` (stored as text; may include commas) to a non-negative number, or null if missing/invalid. */
export function parseAvgElectricityBill(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const cleaned = String(value).replace(/,/g, '').replace(/\s/g, '').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function matchesElectricityBillFilter(
  avg: string | number | null | undefined,
  filter: ElectricityBillFilterBucket
): boolean {
  const n = parseAvgElectricityBill(avg);
  switch (filter) {
    case 'all':
      return true;
    case 'unknown':
      return n === null;
    case 'lt_2000':
      return n !== null && n < 2000;
    case '2000_5000':
      return n !== null && n >= 2000 && n < 5000;
    case '5000_10000':
      return n !== null && n >= 5000 && n < 10000;
    case 'gte_10000':
      return n !== null && n >= 10000;
    default:
      return true;
  }
}
