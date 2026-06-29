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

/** แปลง user input (datetime หรือ date-only) เป็น UTC ISO */
export function parseUserDateTimeToUTC(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;

  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return bangkokDateOnlyToUTC(trimmed);
  }

  return bangkokDateTimeToUTC(trimmed);
}

/** Mirror DB trigger: *_thai = UTC + 7 hours (stored timestamptz) */
export function utcToThaiStoredOffset(utcIso: string | null | undefined): string | null {
  if (!utcIso) return null;
  const t = new Date(utcIso).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + 7 * 60 * 60 * 1000).toISOString();
}
