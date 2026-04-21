
-- Drop the existing view
DROP VIEW IF EXISTS public.sales_team_with_user_info;

-- Create the actual table
CREATE TABLE public.sales_team_with_user_info (
  id integer PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  department text,
  position text,
  current_leads integer DEFAULT 0,
  status character varying DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_team_with_user_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all operations
CREATE POLICY "Allow all CRUD operations for authenticated users"
ON public.sales_team_with_user_info
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_sales_team_with_user_info_user_id ON public.sales_team_with_user_info(user_id);
CREATE INDEX idx_sales_team_with_user_info_status ON public.sales_team_with_user_info(status);

-- Function to sync data from sales_team and users
CREATE OR REPLACE FUNCTION public.sync_sales_team_with_user_info()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing data
  DELETE FROM public.sales_team_with_user_info;
  
  -- Insert synced data
  INSERT INTO public.sales_team_with_user_info (
    id, user_id, name, email, phone, department, position, current_leads, status
  )
  SELECT
    st.id,
    st.user_id,
    CASE
      WHEN (u.first_name IS NOT NULL AND u.last_name IS NOT NULL)
        THEN (u.first_name || ' ' || u.last_name)
      ELSE 'Unknown User'
    END AS name,
    u.email,
    u.phone,
    u.department,
    u.position,
    st.current_leads,
    st.status
  FROM public.sales_team st
  LEFT JOIN public.users u ON st.user_id = u.id
  WHERE u.role = 'sale' OR u.role IS NULL;
END;
$$;

-- Function to handle sales_team changes
CREATE OR REPLACE FUNCTION public.handle_sales_team_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.sales_team_with_user_info WHERE id = OLD.id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update the record with user info
    UPDATE public.sales_team_with_user_info 
    SET 
      user_id = NEW.user_id,
      current_leads = NEW.current_leads,
      status = NEW.status,
      updated_at = now()
    WHERE id = NEW.id;
    
    -- Update name and other user fields if user_id changed
    IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
      UPDATE public.sales_team_with_user_info stui
      SET 
        name = CASE
          WHEN (u.first_name IS NOT NULL AND u.last_name IS NOT NULL)
            THEN (u.first_name || ' ' || u.last_name)
          ELSE 'Unknown User'
        END,
        email = u.email,
        phone = u.phone,
        department = u.department,
        position = u.position,
        updated_at = now()
      FROM public.users u
      WHERE stui.id = NEW.id AND u.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    -- Insert new record with user info
    INSERT INTO public.sales_team_with_user_info (
      id, user_id, name, email, phone, department, position, current_leads, status
    )
    SELECT
      NEW.id,
      NEW.user_id,
      CASE
        WHEN (u.first_name IS NOT NULL AND u.last_name IS NOT NULL)
          THEN (u.first_name || ' ' || u.last_name)
        ELSE 'Unknown User'
      END,
      u.email,
      u.phone,
      u.department,
      u.position,
      NEW.current_leads,
      NEW.status
    FROM public.users u
    WHERE u.id = NEW.user_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function to handle users table changes
CREATE OR REPLACE FUNCTION public.handle_users_change_for_sales_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Update records that reference this user
    UPDATE public.sales_team_with_user_info 
    SET 
      name = 'Unknown User',
      email = NULL,
      phone = NULL,
      department = NULL,
      position = NULL,
      updated_at = now()
    WHERE user_id = OLD.id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update user info in sales_team_with_user_info
    UPDATE public.sales_team_with_user_info 
    SET 
      name = CASE
        WHEN (NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL)
          THEN (NEW.first_name || ' ' || NEW.last_name)
        ELSE 'Unknown User'
      END,
      email = NEW.email,
      phone = NEW.phone,
      department = NEW.department,
      position = NEW.position,
      updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_sync_sales_team_with_user_info
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_team
  FOR EACH ROW EXECUTE FUNCTION public.handle_sales_team_change();

CREATE TRIGGER trigger_sync_users_for_sales_team
  AFTER UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_users_change_for_sales_team();

-- Initial sync of existing data
SELECT public.sync_sales_team_with_user_info();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_team_with_user_info TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
