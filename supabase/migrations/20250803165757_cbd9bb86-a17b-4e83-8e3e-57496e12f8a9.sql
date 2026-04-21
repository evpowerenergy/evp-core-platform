-- อัพเดทข้อมูลเดิมให้มี Thai time values
UPDATE appointments SET date = date WHERE date IS NOT NULL;
UPDATE bookings SET created_at = created_at WHERE created_at IS NOT NULL;
UPDATE conversations SET created_at = created_at WHERE created_at IS NOT NULL;
UPDATE office_equipment SET created_at = created_at WHERE created_at IS NOT NULL;
UPDATE platforms SET created_at = created_at WHERE created_at IS NOT NULL;
UPDATE products SET created_at = created_at WHERE created_at IS NOT NULL;
UPDATE quotations SET estimate_payment_date = estimate_payment_date WHERE estimate_payment_date IS NOT NULL;
UPDATE resources SET created_at = created_at WHERE created_at IS NOT NULL;
UPDATE sales_team_with_user_info SET created_at = created_at WHERE created_at IS NOT NULL;