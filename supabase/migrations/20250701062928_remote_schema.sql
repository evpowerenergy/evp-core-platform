

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'sale',
    'manager'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."equipment_status" AS ENUM (
    'in_use',
    'maintenance',
    'lost',
    'disposed'
);


ALTER TYPE "public"."equipment_status" OWNER TO "postgres";


CREATE TYPE "public"."equipment_type" AS ENUM (
    'it',
    'audio',
    'visual',
    'other'
);


ALTER TYPE "public"."equipment_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role::app_role FROM public.profiles WHERE id = user_id;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'sale'::app_role);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
  );
$$;


ALTER FUNCTION "public"."is_admin_or_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('admin', 'manager')
  );
$$;


ALTER FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_sale_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'sale'
  );
$$;


ALTER FUNCTION "public"."is_sale_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_sales_role"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'sale')
  );
$$;


ALTER FUNCTION "public"."is_sales_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_sales_team"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- ถ้า user มี role = 'sale' ให้เพิ่มเข้า sales_team
  IF NEW.role = 'sale' AND (OLD.role IS NULL OR OLD.role != 'sale') THEN
    INSERT INTO public.sales_team (user_id, status, max_leads, current_leads)
    VALUES (NEW.id, 'active', 50, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- ถ้า user เปลี่ยนจาก 'sale' เป็น role อื่น ให้ปิดการใช้งาน
  IF OLD.role = 'sale' AND NEW.role != 'sale' THEN
    UPDATE public.sales_team 
    SET status = 'inactive'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_sales_team"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lead_status_automatically"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If no sale owner assigned, status should be 'รอรับ'
  IF NEW.sale_owner_id IS NULL THEN
    NEW.status := 'รอรับ';
  -- If operation_status is 'ปิดการขายแล้ว', lead_status should be 'ปิดการขาย'
  ELSIF NEW.operation_status = 'ปิดการขายแล้ว' THEN
    NEW.status := 'ปิดการขาย';
  -- If operation_status is 'ปิดการขายไม่สำเร็จ', lead_status should be 'ยังปิดการขายไม่สำเร็จ'
  ELSIF NEW.operation_status = 'ปิดการขายไม่สำเร็จ' THEN
    NEW.status := 'ยังปิดการขายไม่สำเร็จ';
  -- For all other operation_status values with assigned sale owner, status should be 'กำลังติดตาม'
  ELSIF NEW.sale_owner_id IS NOT NULL THEN
    NEW.status := 'กำลังติดตาม';
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lead_status_automatically"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" integer NOT NULL,
    "productivity_log_id" integer,
    "date" timestamp with time zone,
    "location" "text",
    "note" "text",
    "status" character varying DEFAULT 'scheduled'::character varying,
    "building_details" "text",
    "installation_notes" "text"
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."appointments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."appointments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."appointments_id_seq" OWNED BY "public"."appointments"."id";



CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_id" "uuid",
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "purpose" "text",
    "start_time" timestamp without time zone NOT NULL,
    "end_time" timestamp without time zone NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text",
    "participants" "text"[],
    "note" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'cancelled'::"text"])))
);

ALTER TABLE ONLY "public"."bookings" REPLICA IDENTITY FULL;


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" integer NOT NULL,
    "lead_id" integer,
    "sender_type" character varying(20),
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "conversations_sender_type_check" CHECK ((("sender_type")::"text" = ANY (ARRAY[('user_message'::character varying)::"text", ('ai_message'::character varying)::"text"])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."conversations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."conversations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."conversations_id_seq" OWNED BY "public"."conversations"."id";



CREATE TABLE IF NOT EXISTS "public"."credit_evaluation" (
    "id" integer NOT NULL,
    "productivity_log_id" integer,
    "is_loan_approved" boolean,
    "loan_status" character varying,
    "percent_daytime" numeric
);


ALTER TABLE "public"."credit_evaluation" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."credit_evaluation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."credit_evaluation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."credit_evaluation_id_seq" OWNED BY "public"."credit_evaluation"."id";



CREATE TABLE IF NOT EXISTS "public"."lead_productivity_logs" (
    "id" integer NOT NULL,
    "lead_id" integer,
    "staff_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying,
    "next_follow_up" timestamp with time zone,
    "note" "text",
    "tag" "text"[],
    "hotness" integer,
    "canceled_reason" "text",
    "can_issue_qt" boolean,
    "sale_chance_percent" integer,
    "sale_chance_status" character varying,
    "lead_group" character varying,
    "cxl_detail" "text",
    "cxl_reason" character varying,
    "building_info" "text",
    "installation_notes" "text",
    "contact_status" character varying DEFAULT 'ติดต่อได้'::character varying,
    "contact_fail_reason" "text",
    "customer_category" character varying,
    "qt_fail_reason" "text",
    "cxl_group" character varying,
    "next_follow_up_details" "text",
    CONSTRAINT "check_hotness_range" CHECK ((("hotness" >= 1) AND ("hotness" <= 10))),
    CONSTRAINT "check_sale_chance_percent" CHECK ((("sale_chance_percent" >= 0) AND ("sale_chance_percent" <= 100)))
);


ALTER TABLE "public"."lead_productivity_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."lead_productivity_logs"."next_follow_up_details" IS 'รายละเอียดของการติดตามครั้งถัดไป';



CREATE SEQUENCE IF NOT EXISTS "public"."lead_productivity_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lead_productivity_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lead_productivity_logs_id_seq" OWNED BY "public"."lead_productivity_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."lead_products" (
    "id" integer NOT NULL,
    "productivity_log_id" integer,
    "product_id" integer,
    "electricity_usage" "text",
    "inverter_brand" character varying,
    "panel_count" integer,
    "package_size" character varying,
    "waterproof" boolean,
    "cleaning_coat" boolean,
    "charger_brand" character varying,
    "charger_size" character varying,
    "additional_details" "text"
);


ALTER TABLE "public"."lead_products" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lead_products_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lead_products_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lead_products_id_seq" OWNED BY "public"."lead_products"."id";



CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" integer NOT NULL,
    "user_id_platform" character varying(64),
    "display_name" character varying(100),
    "full_name" character varying(100),
    "tel" character varying(20),
    "region" character varying(100),
    "category" character varying(100),
    "avg_electricity_bill" "text",
    "daytime_percent" "text",
    "status" character varying(50) DEFAULT 'รอรับ'::character varying,
    "notes" "text",
    "sale_owner_id" integer,
    "platform" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_archived" boolean DEFAULT false,
    "operation_status" character varying DEFAULT 'อยู่ระหว่างการติดต่อ'::character varying,
    "line_id" character varying
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


COMMENT ON COLUMN "public"."leads"."line_id" IS 'Line ID สำหรับติดต่อลูกค้า';



CREATE SEQUENCE IF NOT EXISTS "public"."leads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."leads_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."leads_id_seq" OWNED BY "public"."leads"."id";



CREATE TABLE IF NOT EXISTS "public"."n8n_chat_histories" (
    "id" integer NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "message" "jsonb" NOT NULL
);


ALTER TABLE "public"."n8n_chat_histories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."n8n_chat_histories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNED BY "public"."n8n_chat_histories"."id";



CREATE TABLE IF NOT EXISTS "public"."office_equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."equipment_type" NOT NULL,
    "brand" "text",
    "model" "text",
    "serial_number" "text",
    "status" "public"."equipment_status" DEFAULT 'in_use'::"public"."equipment_status" NOT NULL,
    "owner_id" "uuid",
    "department" "text",
    "is_bookable" boolean DEFAULT false NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."office_equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" integer NOT NULL,
    "productivity_log_id" integer,
    "has_qt" boolean,
    "has_inv" boolean,
    "total_amount" numeric,
    "payment_method" character varying,
    "installment_percent" numeric,
    "installment_amount" numeric,
    "estimate_payment_date" timestamp with time zone,
    "installment_periods" integer
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quotations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."quotations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotations_id_seq" OWNED BY "public"."quotations"."id";



CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "capacity" integer,
    "available_from" time without time zone DEFAULT '08:00:00'::time without time zone,
    "available_to" time without time zone DEFAULT '18:00:00'::time without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "equipment_id" "uuid",
    CONSTRAINT "resources_type_check" CHECK (("type" = ANY (ARRAY['room'::"text", 'car'::"text", 'equipment'::"text"])))
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_team" (
    "id" integer NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "max_leads" integer DEFAULT 50,
    "current_leads" integer DEFAULT 0,
    "user_id" "uuid"
);


ALTER TABLE "public"."sales_team" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_team_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_team_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_team_id_seq" OWNED BY "public"."sales_team"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_code" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "nickname" "text",
    "email" "text",
    "department" "text",
    "position" "text",
    "role" "text" DEFAULT 'employee'::"text",
    "manager_id" "uuid",
    "phone" "text",
    "line_id" "text",
    "profile_image_url" "text",
    "birthday" "date",
    "start_date" "date",
    "end_date" "date",
    "status" "text" DEFAULT 'active'::"text",
    "address" "text",
    "personal_id" "text",
    "emergency_contact" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."sales_team_with_user_info" WITH ("security_invoker"='on') AS
 SELECT "st"."id",
    "st"."user_id",
        CASE
            WHEN (("u"."first_name" IS NOT NULL) AND ("u"."last_name" IS NOT NULL)) THEN (("u"."first_name" || ' '::"text") || "u"."last_name")
            ELSE 'Unknown User'::"text"
        END AS "name",
    "u"."email",
    "u"."phone",
    "u"."department",
    "u"."position",
    "st"."current_leads",
    "st"."max_leads",
    "st"."status"
   FROM ("public"."sales_team" "st"
     LEFT JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE (("u"."role" = 'sale'::"text") OR ("u"."role" IS NULL));


ALTER VIEW "public"."sales_team_with_user_info" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."appointments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."conversations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."conversations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."credit_evaluation" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."credit_evaluation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lead_productivity_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lead_productivity_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lead_products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lead_products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."leads" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."leads_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."n8n_chat_histories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."n8n_chat_histories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quotations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quotations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales_team" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_team_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_evaluation"
    ADD CONSTRAINT "credit_evaluation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_productivity_logs"
    ADD CONSTRAINT "lead_productivity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_products"
    ADD CONSTRAINT "lead_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_platform_key" UNIQUE ("user_id_platform");



ALTER TABLE ONLY "public"."n8n_chat_histories"
    ADD CONSTRAINT "n8n_chat_histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_equipment"
    ADD CONSTRAINT "office_equipment_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."office_equipment"
    ADD CONSTRAINT "office_equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_team"
    ADD CONSTRAINT "sales_team_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_team"
    ADD CONSTRAINT "sales_team_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_employee_code_key" UNIQUE ("employee_code");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_appointments_productivity_log_id" ON "public"."appointments" USING "btree" ("productivity_log_id");



CREATE INDEX "idx_conversations_lead_id" ON "public"."conversations" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_logs_lead_id" ON "public"."lead_productivity_logs" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_productivity_logs_created_at" ON "public"."lead_productivity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_lead_productivity_logs_lead_id" ON "public"."lead_productivity_logs" USING "btree" ("lead_id");



CREATE INDEX "idx_leads_sale_owner_id" ON "public"."leads" USING "btree" ("sale_owner_id");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_office_equipment_is_bookable" ON "public"."office_equipment" USING "btree" ("is_bookable");



CREATE INDEX "idx_office_equipment_status" ON "public"."office_equipment" USING "btree" ("status");



CREATE INDEX "idx_office_equipment_type" ON "public"."office_equipment" USING "btree" ("type");



CREATE INDEX "idx_quotations_productivity_log_id" ON "public"."quotations" USING "btree" ("productivity_log_id");



CREATE INDEX "idx_resources_equipment_id" ON "public"."resources" USING "btree" ("equipment_id");



CREATE OR REPLACE TRIGGER "sync_sales_team_trigger" AFTER INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."sync_sales_team"();



CREATE OR REPLACE TRIGGER "trigger_update_lead_status" BEFORE INSERT OR UPDATE OF "operation_status", "sale_owner_id" ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_lead_status_automatically"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_productivity_log_id_fkey" FOREIGN KEY ("productivity_log_id") REFERENCES "public"."lead_productivity_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_evaluation"
    ADD CONSTRAINT "credit_evaluation_productivity_log_id_fkey" FOREIGN KEY ("productivity_log_id") REFERENCES "public"."lead_productivity_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_productivity_logs"
    ADD CONSTRAINT "lead_productivity_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_products"
    ADD CONSTRAINT "lead_products_productivity_log_id_fkey" FOREIGN KEY ("productivity_log_id") REFERENCES "public"."lead_productivity_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_sale_owner_id_fkey" FOREIGN KEY ("sale_owner_id") REFERENCES "public"."sales_team"("id");



ALTER TABLE ONLY "public"."office_equipment"
    ADD CONSTRAINT "office_equipment_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_productivity_log_id_fkey" FOREIGN KEY ("productivity_log_id") REFERENCES "public"."lead_productivity_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."office_equipment"("id");



ALTER TABLE ONLY "public"."sales_team"
    ADD CONSTRAINT "sales_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id");



CREATE POLICY "Admin manager can view all appointments" ON "public"."appointments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admin manager can view all conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admin manager can view all quotations" ON "public"."quotations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admins can manage equipment" ON "public"."office_equipment" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "All authenticated users can view equipment" ON "public"."office_equipment" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow all users" ON "public"."conversations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert resources" ON "public"."resources" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow insert for authenticated" ON "public"."appointments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated" ON "public"."credit_evaluation" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated" ON "public"."lead_productivity_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated" ON "public"."lead_products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated" ON "public"."quotations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated" ON "public"."sales_team" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow select for authenticated" ON "public"."appointments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated" ON "public"."conversations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated" ON "public"."credit_evaluation" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated" ON "public"."lead_productivity_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated" ON "public"."lead_products" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated" ON "public"."quotations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated" ON "public"."sales_team" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow update for authenticated" ON "public"."appointments" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow update for authenticated" ON "public"."conversations" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow update for authenticated" ON "public"."credit_evaluation" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow update for authenticated" ON "public"."lead_productivity_logs" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow update for authenticated" ON "public"."lead_products" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow update for authenticated" ON "public"."quotations" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow update for authenticated" ON "public"."sales_team" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can read resources" ON "public"."resources" FOR SELECT USING (true);



CREATE POLICY "Anyone can read users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can add equipment" ON "public"."office_equipment" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."id" = "bookings"."user_id")))));



CREATE POLICY "Authenticated users can do everything" ON "public"."resources" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage equipment" ON "public"."office_equipment" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Everyone can view sales team" ON "public"."sales_team" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Everyone can view users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Sales can manage appointments for assigned leads" ON "public"."appointments" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND ("productivity_log_id" IN ( SELECT "lpl"."id"
   FROM ((("public"."lead_productivity_logs" "lpl"
     JOIN "public"."leads" "l" ON (("lpl"."lead_id" = "l"."id")))
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Sales can manage conversations for assigned leads" ON "public"."conversations" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND ("lead_id" IN ( SELECT "l"."id"
   FROM (("public"."leads" "l"
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Sales can manage logs for assigned leads" ON "public"."lead_productivity_logs" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND (("lead_id" IN ( SELECT "l"."id"
   FROM (("public"."leads" "l"
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"()))) OR ("staff_id" = "auth"."uid"()))));



CREATE POLICY "Sales can manage quotations for assigned leads" ON "public"."quotations" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND ("productivity_log_id" IN ( SELECT "lpl"."id"
   FROM ((("public"."lead_productivity_logs" "lpl"
     JOIN "public"."leads" "l" ON (("lpl"."lead_id" = "l"."id")))
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Sales can view appointments of assigned leads" ON "public"."appointments" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND ("productivity_log_id" IN ( SELECT "lpl"."id"
   FROM ((("public"."lead_productivity_logs" "lpl"
     JOIN "public"."leads" "l" ON (("lpl"."lead_id" = "l"."id")))
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Sales can view conversations of assigned leads" ON "public"."conversations" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND ("lead_id" IN ( SELECT "l"."id"
   FROM (("public"."leads" "l"
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Sales can view logs of assigned leads" ON "public"."lead_productivity_logs" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND ("lead_id" IN ( SELECT "l"."id"
   FROM (("public"."leads" "l"
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Sales can view quotations of assigned leads" ON "public"."quotations" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'sale'::"text")))) AND ("productivity_log_id" IN ( SELECT "lpl"."id"
   FROM ((("public"."lead_productivity_logs" "lpl"
     JOIN "public"."leads" "l" ON (("lpl"."lead_id" = "l"."id")))
     JOIN "public"."sales_team" "st" ON (("l"."sale_owner_id" = "st"."id")))
     JOIN "public"."users" "u" ON (("st"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Sales team members can view all team" ON "public"."sales_team" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can delete their own bookings" ON "public"."bookings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."id" = "bookings"."user_id")))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own bookings" ON "public"."bookings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."id" = "bookings"."user_id")))));



CREATE POLICY "Users can view all bookings" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "admin_manager_can_modify_all_users" ON "public"."users" TO "authenticated" USING ("public"."is_admin_or_manager"());



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_can_insert_leads" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "authenticated_users_can_update_leads" ON "public"."leads" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_all_leads" ON "public"."leads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_all_users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_sales_team" ON "public"."sales_team" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_evaluation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_productivity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."n8n_chat_histories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."office_equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_team" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_update_own_profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_sale_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_sale_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_sale_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_sales_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_sales_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_sales_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_sales_team"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_sales_team"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_sales_team"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lead_status_automatically"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lead_status_automatically"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lead_status_automatically"() TO "service_role";


















GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."credit_evaluation" TO "anon";
GRANT ALL ON TABLE "public"."credit_evaluation" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_evaluation" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_evaluation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_evaluation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_evaluation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lead_productivity_logs" TO "anon";
GRANT ALL ON TABLE "public"."lead_productivity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_productivity_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lead_productivity_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lead_productivity_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lead_productivity_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lead_products" TO "anon";
GRANT ALL ON TABLE "public"."lead_products" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lead_products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lead_products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lead_products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "anon";
GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "authenticated";
GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."office_equipment" TO "anon";
GRANT ALL ON TABLE "public"."office_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."office_equipment" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."sales_team" TO "anon";
GRANT ALL ON TABLE "public"."sales_team" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_team" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_team_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_team_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_team_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."sales_team_with_user_info" TO "anon";
GRANT ALL ON TABLE "public"."sales_team_with_user_info" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_team_with_user_info" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
