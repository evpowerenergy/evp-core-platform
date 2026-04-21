-- Migrate existing completed customer_services to leads
DO $$
DECLARE
  v_record RECORD;
  v_lead_id INTEGER;
  v_count INTEGER := 0;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
BEGIN
  -- Loop through all completed customer_services
  FOR v_record IN 
    SELECT id, customer_group 
    FROM public.customer_services 
    WHERE sale_follow_up_status = 'completed'
    ORDER BY id
  LOOP
    BEGIN
      -- Call the function to create/update lead
      v_lead_id := public.create_lead_from_customer_service(v_record.id);
      
      v_count := v_count + 1;
      
      IF v_lead_id IS NOT NULL THEN
        v_success_count := v_success_count + 1;
        RAISE NOTICE 'Created/Updated lead % for customer_service % (%)', 
          v_lead_id, v_record.id, v_record.customer_group;
      ELSE
        v_error_count := v_error_count + 1;
        RAISE NOTICE 'Failed to create lead for customer_service % (%)', 
          v_record.id, v_record.customer_group;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        RAISE NOTICE 'Error processing customer_service %: %', 
          v_record.id, SQLERRM;
    END;
  END LOOP;
  
  -- Summary
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Total processed: %', v_count;
  RAISE NOTICE 'Success: %', v_success_count;
  RAISE NOTICE 'Errors: %', v_error_count;
  RAISE NOTICE '========================================';
END $$;