-- =============================================================================
-- RUN_MIGRATE_APPOINTMENT_TIMEZONE_DATA.sql
-- Migrate legacy appointment timestamps (Bangkok wall-clock stored as UTC → real UTC)
--
-- ORDER OF OPERATIONS:
--   1) Run RUN_FIX_APPOINTMENT_THAI_TIMESTAMPS.sql first (trigger fix)
--   2) Run SECTION 1 (backup)
--   3) Run SECTION 2 (dry-run review)
--   4) Run SECTION 3 (migrate) in a transaction
--   5) Run SECTION 4 (verify)
--   6) If wrong: SECTION 5 (rollback)
-- =============================================================================

-- =============================================================================
-- SECTION 1: BACKUP (run once before migrate)
-- =============================================================================
/*
DROP TABLE IF EXISTS _backup_appointments_timezone;
DROP TABLE IF EXISTS _backup_lead_productivity_logs_timezone;
DROP TABLE IF EXISTS _backup_quotations_timezone;

CREATE TABLE _backup_appointments_timezone AS SELECT * FROM appointments;
CREATE TABLE _backup_lead_productivity_logs_timezone AS
  SELECT id, next_follow_up, next_follow_up_thai FROM lead_productivity_logs;
CREATE TABLE _backup_quotations_timezone AS
  SELECT id, estimate_payment_date, estimate_payment_date_thai, productivity_log_id FROM quotations;

SELECT 'backup done' AS status,
  (SELECT COUNT(*) FROM _backup_appointments_timezone) AS appointments,
  (SELECT COUNT(*) FROM _backup_lead_productivity_logs_timezone) AS logs,
  (SELECT COUNT(*) FROM _backup_quotations_timezone) AS quotations;
*/

-- =============================================================================
-- SECTION 2: DRY-RUN (review before migrate)
-- =============================================================================
/*
-- Count rows to migrate
SELECT 'lead_productivity_logs' AS tbl, COUNT(*) AS cnt
FROM lead_productivity_logs
WHERE next_follow_up IS NOT NULL
  AND next_follow_up_thai IS NULL

UNION ALL

SELECT 'appointments', COUNT(*)
FROM appointments a
JOIN lead_productivity_logs l ON l.id = a.productivity_log_id
WHERE a.date IS NOT NULL
  AND a.appointment_type IN ('follow-up', 'engineer', 'payment')
  AND l.next_follow_up_thai IS NULL
  AND (l.next_follow_up IS NULL OR a.date = l.next_follow_up)

UNION ALL

SELECT 'appointments_mismatch (manual review)', COUNT(*)
FROM appointments a
JOIN lead_productivity_logs l ON l.id = a.productivity_log_id
WHERE a.date IS NOT NULL
  AND a.appointment_type IN ('follow-up', 'engineer', 'payment')
  AND l.next_follow_up IS NOT NULL
  AND a.date IS DISTINCT FROM l.next_follow_up;

-- Sample before/after for logs
SELECT
  l.tel,
  lpl.id,
  lpl.next_follow_up AS before_utc,
  lpl.next_follow_up - INTERVAL '7 hours' AS after_utc,
  lpl.next_follow_up_thai AS before_thai
FROM lead_productivity_logs lpl
LEFT JOIN leads l ON l.id = lpl.lead_id
WHERE lpl.next_follow_up IS NOT NULL
  AND lpl.next_follow_up_thai IS NULL
ORDER BY lpl.created_at DESC
LIMIT 10;

-- Case 0898332902 preview
SELECT
  l.tel,
  lpl.id AS log_id,
  lpl.next_follow_up,
  lpl.next_follow_up - INTERVAL '7 hours' AS migrated_next_follow_up,
  a.id AS apt_id,
  a.date AS apt_date,
  a.date - INTERVAL '7 hours' AS migrated_apt_date,
  a.date_thai
FROM lead_productivity_logs lpl
JOIN leads l ON l.id = lpl.lead_id
LEFT JOIN appointments a ON a.productivity_log_id = lpl.id AND a.appointment_type = 'follow-up'
WHERE l.tel = '0898332902'
ORDER BY lpl.created_at;
*/

-- =============================================================================
-- SECTION 3: MIGRATE (run in transaction)
-- =============================================================================
/*
BEGIN;

-- 3a. Fix appointments.date first (while log.next_follow_up still has legacy value)
UPDATE appointments a
SET date = a.date - INTERVAL '7 hours'
FROM lead_productivity_logs l
WHERE l.id = a.productivity_log_id
  AND a.date IS NOT NULL
  AND a.appointment_type IN ('follow-up', 'engineer', 'payment')
  AND l.next_follow_up IS NOT NULL
  AND a.date = l.next_follow_up
  AND l.next_follow_up_thai IS NULL;

-- 3b. Fix appointments without matching next_follow_up (engineer-only logs)
UPDATE appointments a
SET date = a.date - INTERVAL '7 hours'
FROM lead_productivity_logs l
WHERE l.id = a.productivity_log_id
  AND a.date IS NOT NULL
  AND a.appointment_type IN ('follow-up', 'engineer', 'payment')
  AND l.next_follow_up_thai IS NULL
  AND l.next_follow_up IS NULL
  AND a.date_thai IS NOT NULL
  AND a.date_thai = a.date + INTERVAL '7 hours';

-- 3c. Fix lead_productivity_logs.next_follow_up (trigger sets next_follow_up_thai)
UPDATE lead_productivity_logs
SET next_follow_up = next_follow_up - INTERVAL '7 hours'
WHERE next_follow_up IS NOT NULL
  AND next_follow_up_thai IS NULL;

-- 3d. Fix quotations.estimate_payment_date (datetime with time component)
UPDATE quotations q
SET estimate_payment_date = q.estimate_payment_date - INTERVAL '7 hours'
FROM lead_productivity_logs l
WHERE l.id = q.productivity_log_id
  AND q.estimate_payment_date IS NOT NULL
  AND l.next_follow_up_thai IS NOT NULL
  AND q.estimate_payment_date::text LIKE '%T%'
  AND q.estimate_payment_date::text NOT LIKE '%T00:00%';

COMMIT;
*/

-- =============================================================================
-- SECTION 4: VERIFY
-- =============================================================================
/*
-- Case 0898332902: expect next_follow_up = 04:00Z, next_follow_up_thai = 11:00Z
SELECT
  l.tel,
  lpl.id,
  lpl.next_follow_up,
  lpl.next_follow_up_thai,
  a.date,
  a.date_thai,
  a.note
FROM lead_productivity_logs lpl
JOIN leads l ON l.id = lpl.lead_id
LEFT JOIN appointments a ON a.productivity_log_id = lpl.id AND a.appointment_type = 'follow-up'
WHERE l.tel = '0898332902'
ORDER BY lpl.created_at;

-- Rows still needing manual review
SELECT a.id, a.date, l.next_follow_up, l.tel
FROM appointments a
JOIN lead_productivity_logs l ON l.id = a.productivity_log_id
WHERE a.appointment_type IN ('follow-up', 'engineer', 'payment')
  AND l.next_follow_up IS NOT NULL
  AND a.date IS DISTINCT FROM l.next_follow_up
  AND a.date IS DISTINCT FROM (l.next_follow_up + INTERVAL '7 hours')
LIMIT 20;
*/

-- =============================================================================
-- SECTION 5: ROLLBACK (only if migrate went wrong)
-- =============================================================================
/*
BEGIN;

UPDATE lead_productivity_logs lpl
SET
  next_follow_up = b.next_follow_up,
  next_follow_up_thai = b.next_follow_up_thai
FROM _backup_lead_productivity_logs_timezone b
WHERE lpl.id = b.id;

UPDATE appointments a
SET
  date = b.date,
  date_thai = b.date_thai,
  location = b.location,
  note = b.note,
  status = b.status,
  building_details = b.building_details,
  installation_notes = b.installation_notes,
  appointment_type = b.appointment_type,
  productivity_log_id = b.productivity_log_id
FROM _backup_appointments_timezone b
WHERE a.id = b.id;

UPDATE quotations q
SET
  estimate_payment_date = b.estimate_payment_date,
  estimate_payment_date_thai = b.estimate_payment_date_thai
FROM _backup_quotations_timezone b
WHERE q.id = b.id;

COMMIT;
*/
