-- Migration: Remove max_leads from sales_team
ALTER TABLE public.sales_team DROP COLUMN IF EXISTS max_leads;
