const BANGKOK_TZ = 'Asia/Bangkok';

const HAS_TIMEZONE_SUFFIX = /[Zz]$|[+-]\d{2}:\d{2}$/;

/** แปลง datetime string จาก DateTimePicker (เวลาไทย) → ISO UTC สำหรับบันทึก DB */
export function bangkokDateTimeToUTC(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;

  const normalized = input.trim().includes('T')
    ? input.trim()
    : input.trim().replace(' ', 'T');

  const withTz = HAS_TIMEZONE_SUFFIX.test(normalized)
    ? normalized
    : `${normalized}+07:00`;

  const date = new Date(withTz);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

/** แปลง date-only (YYYY-MM-DD) เป็น midnight Bangkok → UTC */
export function bangkokDateOnlyToUTC(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;

  const datePart = input.trim().split('T')[0].split(' ')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;

  return bangkokDateTimeToUTC(`${datePart}T00:00`);
}

/** แปลง UTC จาก DB → ค่า YYYY-MM-DDTHH:mm สำหรับ DateTimePicker */
export function utcToBangkokInput(utcIso: string | null | undefined): string {
  if (!utcIso?.trim()) return '';

  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

/** ค่าสำหรับแสดงผล — ใช้ *_thai ก่อน แล้ว fallback UTC */
export function getThaiDisplayValue(
  thai?: string | null,
  utc?: string | null
): string {
  return thai || utc || '';
}

/** Mirror DB trigger: *_thai = UTC + 7 hours (stored timestamptz) */
export function utcToThaiStoredOffset(utcIso: string | null | undefined): string | null {
  if (!utcIso) return null;
  const t = new Date(utcIso).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + 7 * 60 * 60 * 1000).toISOString();
}

/** อ่าน *_thai ที่เก็บ clock time ใน Z → input YYYY-MM-DDTHH:mm */
export function thaiStoredToBangkokInput(thaiIso?: string | null): string {
  if (!thaiIso?.trim()) return '';
  const datePart = thaiIso.split('T')[0];
  const timePart = thaiIso.split('T')[1];
  if (!datePart || !timePart) return '';
  const [hh, mm] = timePart.split(':');
  if (!hh || !mm) return '';
  return `${datePart}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
}

/** โหลดค่า datetime field — ใช้ *_thai ก่อน แล้ว fallback UTC */
export function datetimeFieldToBangkokInput(
  thai?: string | null,
  utc?: string | null
): string {
  if (thai) return thaiStoredToBangkokInput(thai);
  if (utc) return utcToBangkokInput(utc);
  return '';
}

/** โหลดค่า date-only field จาก UTC */
export function utcToBangkokDateOnly(utcIso?: string | null): string {
  const input = utcToBangkokInput(utcIso || '');
  return input.split('T')[0] || '';
}

/** แปลง user input (datetime หรือ date-only) เป็น UTC ISO */
export function parseUserDateTimeToUTC(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;

  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return bangkokDateOnlyToUTC(trimmed);
  }

  return bangkokDateTimeToUTC(trimmed);
}
