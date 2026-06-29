/**
 * One-off bulk migration: fix legacy appointment timestamps
 * Run: node scripts/run-timezone-migration.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error('SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(url, key);
const BATCH = 100;

function shiftUtc(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
}

async function fetchAllLogs() {
  const all = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('lead_productivity_logs')
      .select('id, next_follow_up, next_follow_up_thai')
      .not('next_follow_up', 'is', null)
      .is('next_follow_up_thai', null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function migrateLog(log) {
  const oldNfu = log.next_follow_up;
  const newNfu = shiftUtc(oldNfu, -7);
  const newNfuThai = shiftUtc(newNfu, 7);

  const { data: apts } = await supabase
    .from('appointments')
    .select('id, date')
    .eq('productivity_log_id', log.id)
    .in('appointment_type', ['follow-up', 'engineer', 'payment']);

  for (const apt of apts || []) {
    if (apt.date && new Date(apt.date).getTime() === new Date(oldNfu).getTime()) {
      const newDate = shiftUtc(apt.date, -7);
      const newDateThai = shiftUtc(newDate, 7);
      await supabase
        .from('appointments')
        .update({ date: newDate, date_thai: newDateThai })
        .eq('id', apt.id);
    }
  }

  const { error } = await supabase
    .from('lead_productivity_logs')
    .update({ next_follow_up: newNfu, next_follow_up_thai: newNfuThai })
    .eq('id', log.id);

  if (error) throw error;
}

async function main() {
  console.log('Fetching logs to migrate...');
  const logs = await fetchAllLogs();
  console.log(`Found ${logs.length} logs`);

  for (let i = 0; i < logs.length; i += BATCH) {
    const chunk = logs.slice(i, i + BATCH);
    await Promise.all(chunk.map((log) => migrateLog(log)));
    console.log(`Migrated ${Math.min(i + BATCH, logs.length)} / ${logs.length}`);
  }

  const { data: lead } = await supabase.from('leads').select('id').eq('tel', '0898332902').single();
  if (lead) {
    const { data: vlogs } = await supabase
      .from('lead_productivity_logs')
      .select('id, next_follow_up, next_follow_up_thai')
      .eq('lead_id', lead.id)
      .order('created_at');
    const logIds = vlogs?.map((l) => l.id) || [];
    const { data: vapts } = await supabase
      .from('appointments')
      .select('id, date, date_thai, productivity_log_id')
      .in('productivity_log_id', logIds);
    console.log('\n=== VERIFY 0898332902 ===');
    console.log(JSON.stringify({ logs: vlogs, appointments: vapts }, null, 2));
  }

  const { count } = await supabase
    .from('lead_productivity_logs')
    .select('*', { count: 'exact', head: true })
    .not('next_follow_up', 'is', null)
    .is('next_follow_up_thai', null);
  console.log(`\nRemaining unmigrated: ${count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
