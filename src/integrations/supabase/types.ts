export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ads_campaigns: {
        Row: {
          budget: number | null
          campaign_name: string | null
          campaign_start_time: string | null
          campaign_status: string | null
          campaign_stop_time: string | null
          created_at: string | null
          description: string | null
          facebook_ad_id: string | null
          facebook_campaign_id: string | null
          facebook_created_time: string | null
          id: number
          image_url: string | null
          name: string
          platform: string | null
          start_time: string | null
          status: string | null
          stop_time: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          campaign_name?: string | null
          campaign_start_time?: string | null
          campaign_status?: string | null
          campaign_stop_time?: string | null
          created_at?: string | null
          description?: string | null
          facebook_ad_id?: string | null
          facebook_campaign_id?: string | null
          facebook_created_time?: string | null
          id?: number
          image_url?: string | null
          name: string
          platform?: string | null
          start_time?: string | null
          status?: string | null
          stop_time?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          campaign_name?: string | null
          campaign_start_time?: string | null
          campaign_status?: string | null
          campaign_stop_time?: string | null
          created_at?: string | null
          description?: string | null
          facebook_ad_id?: string | null
          facebook_campaign_id?: string | null
          facebook_created_time?: string | null
          id?: number
          image_url?: string | null
          name?: string
          platform?: string | null
          start_time?: string | null
          status?: string | null
          stop_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type: string | null
          building_details: string | null
          date: string | null
          date_thai: string | null
          id: number
          installation_notes: string | null
          location: string | null
          note: string | null
          productivity_log_id: number | null
          status: string | null
        }
        Insert: {
          appointment_type?: string | null
          building_details?: string | null
          date?: string | null
          date_thai?: string | null
          id?: number
          installation_notes?: string | null
          location?: string | null
          note?: string | null
          productivity_log_id?: number | null
          status?: string | null
        }
        Update: {
          appointment_type?: string | null
          building_details?: string | null
          date?: string | null
          date_thai?: string | null
          id?: number
          installation_notes?: string | null
          location?: string | null
          note?: string | null
          productivity_log_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_productivity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_qt_itemized"
            referencedColumns: ["log_id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string | null
          created_at_thai: string | null
          end_time: string
          end_time_thai: string | null
          id: string
          note: string | null
          participants: string[] | null
          purpose: string | null
          resource_id: string | null
          start_time: string
          start_time_thai: string | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_at_thai?: string | null
          end_time: string
          end_time_thai?: string | null
          id?: string
          note?: string | null
          participants?: string[] | null
          purpose?: string | null
          resource_id?: string | null
          start_time: string
          start_time_thai?: string | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_at_thai?: string | null
          end_time?: string
          end_time_thai?: string | null
          id?: string
          note?: string | null
          participants?: string[] | null
          purpose?: string | null
          resource_id?: string | null
          start_time?: string
          start_time_thai?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_state: {
        Row: {
          auto_reply_mode: string | null
          last_toggled_at: string | null
          last_update: string
          sender_id: string
          shown_product_keys: string[]
        }
        Insert: {
          auto_reply_mode?: string | null
          last_toggled_at?: string | null
          last_update?: string
          sender_id: string
          shown_product_keys?: string[]
        }
        Update: {
          auto_reply_mode?: string | null
          last_toggled_at?: string | null
          last_update?: string
          sender_id?: string
          shown_product_keys?: string[]
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          created_at_thai: string | null
          id: number
          lead_id: number | null
          message: string | null
          sender_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: number
          lead_id?: number | null
          message?: string | null
          sender_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: number
          lead_id?: number | null
          message?: string | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_sales_opportunity"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_evaluation: {
        Row: {
          id: number
          is_loan_approved: boolean | null
          loan_status: string | null
          percent_daytime: number | null
          productivity_log_id: number | null
        }
        Insert: {
          id?: number
          is_loan_approved?: boolean | null
          loan_status?: string | null
          percent_daytime?: number | null
          productivity_log_id?: number | null
        }
        Update: {
          id?: number
          is_loan_approved?: boolean | null
          loan_status?: string | null
          percent_daytime?: number | null
          productivity_log_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_evaluation_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_productivity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_evaluation_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_qt_itemized"
            referencedColumns: ["log_id"]
          },
        ]
      }
      customer_services: {
        Row: {
          capacity_kw: number | null
          created_at: string | null
          created_at_thai: string | null
          customer_group: string
          district: string | null
          id: number
          installation_date: string | null
          installation_date_thai: string | null
          installer_name: string | null
          notes: string | null
          province: string
          sale: string | null
          sale_follow_up_assigned_to: number | null
          sale_follow_up_created_at: string | null
          sale_follow_up_date: string | null
          sale_follow_up_date_thai: string | null
          sale_follow_up_details: string | null
          sale_follow_up_notes: string | null
          sale_follow_up_required: boolean | null
          sale_follow_up_status: string | null
          sale_follow_up_updated_at: string | null
          service_visit_1: boolean | null
          service_visit_1_date: string | null
          service_visit_1_date_thai: string | null
          service_visit_1_technician: string | null
          service_visit_2: boolean | null
          service_visit_2_date: string | null
          service_visit_2_date_thai: string | null
          service_visit_2_technician: string | null
          service_visit_3: boolean | null
          service_visit_3_date: string | null
          service_visit_3_date_thai: string | null
          service_visit_3_technician: string | null
          service_visit_4: boolean | null
          service_visit_4_date: string | null
          service_visit_4_date_thai: string | null
          service_visit_4_technician: string | null
          service_visit_5: boolean | null
          service_visit_5_date: string | null
          service_visit_5_date_thai: string | null
          service_visit_5_technician: string | null
          status: string | null
          tel: string
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          capacity_kw?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          customer_group: string
          district?: string | null
          id?: never
          installation_date?: string | null
          installation_date_thai?: string | null
          installer_name?: string | null
          notes?: string | null
          province: string
          sale?: string | null
          sale_follow_up_assigned_to?: number | null
          sale_follow_up_created_at?: string | null
          sale_follow_up_date?: string | null
          sale_follow_up_date_thai?: string | null
          sale_follow_up_details?: string | null
          sale_follow_up_notes?: string | null
          sale_follow_up_required?: boolean | null
          sale_follow_up_status?: string | null
          sale_follow_up_updated_at?: string | null
          service_visit_1?: boolean | null
          service_visit_1_date?: string | null
          service_visit_1_date_thai?: string | null
          service_visit_1_technician?: string | null
          service_visit_2?: boolean | null
          service_visit_2_date?: string | null
          service_visit_2_date_thai?: string | null
          service_visit_2_technician?: string | null
          service_visit_3?: boolean | null
          service_visit_3_date?: string | null
          service_visit_3_date_thai?: string | null
          service_visit_3_technician?: string | null
          service_visit_4?: boolean | null
          service_visit_4_date?: string | null
          service_visit_4_date_thai?: string | null
          service_visit_4_technician?: string | null
          service_visit_5?: boolean | null
          service_visit_5_date?: string | null
          service_visit_5_date_thai?: string | null
          service_visit_5_technician?: string | null
          status?: string | null
          tel: string
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          capacity_kw?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          customer_group?: string
          district?: string | null
          id?: never
          installation_date?: string | null
          installation_date_thai?: string | null
          installer_name?: string | null
          notes?: string | null
          province?: string
          sale?: string | null
          sale_follow_up_assigned_to?: number | null
          sale_follow_up_created_at?: string | null
          sale_follow_up_date?: string | null
          sale_follow_up_date_thai?: string | null
          sale_follow_up_details?: string | null
          sale_follow_up_notes?: string | null
          sale_follow_up_required?: boolean | null
          sale_follow_up_status?: string | null
          sale_follow_up_updated_at?: string | null
          service_visit_1?: boolean | null
          service_visit_1_date?: string | null
          service_visit_1_date_thai?: string | null
          service_visit_1_technician?: string | null
          service_visit_2?: boolean | null
          service_visit_2_date?: string | null
          service_visit_2_date_thai?: string | null
          service_visit_2_technician?: string | null
          service_visit_3?: boolean | null
          service_visit_3_date?: string | null
          service_visit_3_date_thai?: string | null
          service_visit_3_technician?: string | null
          service_visit_4?: boolean | null
          service_visit_4_date?: string | null
          service_visit_4_date_thai?: string | null
          service_visit_4_technician?: string | null
          service_visit_5?: boolean | null
          service_visit_5_date?: string | null
          service_visit_5_date_thai?: string | null
          service_visit_5_technician?: string | null
          status?: string | null
          tel?: string
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_services_sale_follow_up_assigned_to_fkey"
            columns: ["sale_follow_up_assigned_to"]
            isOneToOne: false
            referencedRelation: "sales_team_with_user_info"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          lead_id: number | null
          name: string
          platform: string | null
          sale_owner_id: number | null
          status: Database["public"]["Enums"]["customer_status"] | null
          tel: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          lead_id?: number | null
          name: string
          platform?: string | null
          sale_owner_id?: number | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          tel?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          lead_id?: number | null
          name?: string
          platform?: string | null
          sale_owner_id?: number | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          tel?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "lead_sales_opportunity"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_sale_owner_id_fkey"
            columns: ["sale_owner_id"]
            isOneToOne: false
            referencedRelation: "sales_team_with_user_info"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_units: {
        Row: {
          created_at: string | null
          created_at_thai: string | null
          id: string
          product_id: number
          purchase_order_item_id: string | null
          received_date: string | null
          serial_no: string
          status: Database["public"]["Enums"]["inventory_status"] | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          product_id: number
          purchase_order_item_id?: string | null
          received_date?: string | null
          serial_no: string
          status?: Database["public"]["Enums"]["inventory_status"] | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          product_id?: number
          purchase_order_item_id?: string | null
          received_date?: string | null
          serial_no?: string
          status?: Database["public"]["Enums"]["inventory_status"] | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_units_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_productivity_logs: {
        Row: {
          building_info: string | null
          can_issue_qt: boolean | null
          canceled_reason: string | null
          contact_fail_reason: string | null
          contact_status: string | null
          created_at: string | null
          created_at_thai: string | null
          credit_approval_status: string | null
          customer_category: string | null
          cxl_detail: string | null
          cxl_group: string | null
          cxl_reason: string | null
          hotness: number | null
          id: number
          installation_notes: string | null
          interested_kw_size: string | null
          lead_group: string | null
          lead_id: number | null
          next_follow_up: string | null
          next_follow_up_details: string | null
          next_follow_up_thai: string | null
          note: string | null
          presentation_type: string | null
          qt_fail_reason: string | null
          sale_chance_percent: number | null
          sale_chance_status: string | null
          sale_id: number | null
          staff_id: string | null
          status: string | null
          tag: string[] | null
        }
        Insert: {
          building_info?: string | null
          can_issue_qt?: boolean | null
          canceled_reason?: string | null
          contact_fail_reason?: string | null
          contact_status?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          credit_approval_status?: string | null
          customer_category?: string | null
          cxl_detail?: string | null
          cxl_group?: string | null
          cxl_reason?: string | null
          hotness?: number | null
          id?: number
          installation_notes?: string | null
          interested_kw_size?: string | null
          lead_group?: string | null
          lead_id?: number | null
          next_follow_up?: string | null
          next_follow_up_details?: string | null
          next_follow_up_thai?: string | null
          note?: string | null
          presentation_type?: string | null
          qt_fail_reason?: string | null
          sale_chance_percent?: number | null
          sale_chance_status?: string | null
          sale_id?: number | null
          staff_id?: string | null
          status?: string | null
          tag?: string[] | null
        }
        Update: {
          building_info?: string | null
          can_issue_qt?: boolean | null
          canceled_reason?: string | null
          contact_fail_reason?: string | null
          contact_status?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          credit_approval_status?: string | null
          customer_category?: string | null
          cxl_detail?: string | null
          cxl_group?: string | null
          cxl_reason?: string | null
          hotness?: number | null
          id?: number
          installation_notes?: string | null
          interested_kw_size?: string | null
          lead_group?: string | null
          lead_id?: number | null
          next_follow_up?: string | null
          next_follow_up_details?: string | null
          next_follow_up_thai?: string | null
          note?: string | null
          presentation_type?: string | null
          qt_fail_reason?: string | null
          sale_chance_percent?: number | null
          sale_chance_status?: string | null
          sale_id?: number | null
          staff_id?: string | null
          status?: string | null
          tag?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_productivity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_sales_opportunity"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_productivity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_products: {
        Row: {
          additional_details: string | null
          charger_brand: string | null
          charger_size: string | null
          cleaning_coat: boolean | null
          cost_price: number | null
          electricity_usage: string | null
          id: number
          inverter_brand: string | null
          package_size: string | null
          panel_count: number | null
          product_id: number | null
          productivity_log_id: number | null
          profit: number | null
          profit_percent: number | null
          quantity: number | null
          total_cost: number | null
          total_price: number | null
          unit_price: number | null
          waterproof: boolean | null
        }
        Insert: {
          additional_details?: string | null
          charger_brand?: string | null
          charger_size?: string | null
          cleaning_coat?: boolean | null
          cost_price?: number | null
          electricity_usage?: string | null
          id?: number
          inverter_brand?: string | null
          package_size?: string | null
          panel_count?: number | null
          product_id?: number | null
          productivity_log_id?: number | null
          profit?: number | null
          profit_percent?: number | null
          quantity?: number | null
          total_cost?: number | null
          total_price?: number | null
          unit_price?: number | null
          waterproof?: boolean | null
        }
        Update: {
          additional_details?: string | null
          charger_brand?: string | null
          charger_size?: string | null
          cleaning_coat?: boolean | null
          cost_price?: number | null
          electricity_usage?: string | null
          id?: number
          inverter_brand?: string | null
          package_size?: string | null
          panel_count?: number | null
          product_id?: number | null
          productivity_log_id?: number | null
          profit?: number | null
          profit_percent?: number | null
          quantity?: number | null
          total_cost?: number | null
          total_price?: number | null
          unit_price?: number | null
          waterproof?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_products_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_products_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_productivity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_products_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_qt_itemized"
            referencedColumns: ["log_id"]
          },
        ]
      }
      leads: {
        Row: {
          ad_campaign_id: number | null
          assigned_at_thai: string | null
          avg_electricity_bill: string | null
          category: string | null
          created_at: string | null
          created_at_thai: string | null
          created_by: string | null
          customer_service_id: number | null
          daytime_percent: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          has_contact_info: boolean | null
          id: number
          is_archived: boolean | null
          line_id: string | null
          notes: string | null
          operation_status: string | null
          platform: string | null
          qr_code: string | null
          region: string | null
          sale_owner_id: number | null
          post_sales_owner_id: number | null
          status: string | null
          tel: string | null
          updated_at: string | null
          updated_at_thai: string | null
          user_id_platform: string | null
        }
        Insert: {
          ad_campaign_id?: number | null
          assigned_at_thai?: string | null
          avg_electricity_bill?: string | null
          category?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          created_by?: string | null
          customer_service_id?: number | null
          daytime_percent?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          has_contact_info?: boolean | null
          id?: number
          is_archived?: boolean | null
          line_id?: string | null
          notes?: string | null
          operation_status?: string | null
          platform?: string | null
          qr_code?: string | null
          region?: string | null
          sale_owner_id?: number | null
          post_sales_owner_id?: number | null
          status?: string | null
          tel?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
          user_id_platform?: string | null
        }
        Update: {
          ad_campaign_id?: number | null
          assigned_at_thai?: string | null
          avg_electricity_bill?: string | null
          category?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          created_by?: string | null
          customer_service_id?: number | null
          daytime_percent?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          has_contact_info?: boolean | null
          id?: number
          is_archived?: boolean | null
          line_id?: string | null
          notes?: string | null
          operation_status?: string | null
          platform?: string | null
          qr_code?: string | null
          region?: string | null
          sale_owner_id?: number | null
          post_sales_owner_id?: number | null
          status?: string | null
          tel?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
          user_id_platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_ad_campaign"
            columns: ["ad_campaign_id"]
            isOneToOne: false
            referencedRelation: "ads_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leads_sale_owner_id"
            columns: ["sale_owner_id"]
            isOneToOne: false
            referencedRelation: "sales_team_with_user_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      office_equipment: {
        Row: {
          accessories: string | null
          brand: string | null
          code: string
          color: string | null
          created_at: string
          created_at_thai: string | null
          department: string | null
          id: string
          is_bookable: boolean
          model: string | null
          name: string
          owner_id: string | null
          owner_name: string | null
          quantity: number
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at: string
          updated_at_thai: string | null
        }
        Insert: {
          accessories?: string | null
          brand?: string | null
          code: string
          color?: string | null
          created_at?: string
          created_at_thai?: string | null
          department?: string | null
          id?: string
          is_bookable?: boolean
          model?: string | null
          name: string
          owner_id?: string | null
          owner_name?: string | null
          quantity?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
          updated_at_thai?: string | null
        }
        Update: {
          accessories?: string | null
          brand?: string | null
          code?: string
          color?: string | null
          created_at?: string
          created_at_thai?: string | null
          department?: string | null
          id?: string
          is_bookable?: boolean
          model?: string | null
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          quantity?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          type?: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
          updated_at_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_equipment_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      openai_costs: {
        Row: {
          cost_baht: number
          cost_usd: number
          created_at: string
          date: string
          id: string
          updated_at: string
          input_tokens: number | null
          output_tokens: number | null
          sync_source: string | null
        }
        Insert: {
          cost_baht?: number
          cost_usd?: number
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          input_tokens?: number | null
          output_tokens?: number | null
          sync_source?: string | null
        }
        Update: {
          cost_baht?: number
          cost_usd?: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          input_tokens?: number | null
          output_tokens?: number | null
          sync_source?: string | null
        }
        Relationships: []
      }
      permit_requests: {
        Row: {
          attachments: Json | null
          capacity_kw: number | null
          company_name: string | null
          completion_date: string | null
          connection_type: string | null
          created_at: string | null
          district: string | null
          document_number: string | null
          document_received_date: string | null
          executor: string | null
          id: number
          installer_name: string | null
          main_status: string
          map_reference: string | null
          meter_number: string | null
          note: string | null
          online_date: string | null
          operator_name: string | null
          permit_number: string | null
          phone_number: string | null
          province: string | null
          requested_name: string | null
          requester_name: string
          sub_status: string | null
          team_leader: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          capacity_kw?: number | null
          company_name?: string | null
          completion_date?: string | null
          connection_type?: string | null
          created_at?: string | null
          district?: string | null
          document_number?: string | null
          document_received_date?: string | null
          executor?: string | null
          id?: number
          installer_name?: string | null
          main_status: string
          map_reference?: string | null
          meter_number?: string | null
          note?: string | null
          online_date?: string | null
          operator_name?: string | null
          permit_number?: string | null
          phone_number?: string | null
          province?: string | null
          requested_name?: string | null
          requester_name: string
          sub_status?: string | null
          team_leader?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          capacity_kw?: number | null
          company_name?: string | null
          completion_date?: string | null
          connection_type?: string | null
          created_at?: string | null
          district?: string | null
          document_number?: string | null
          document_received_date?: string | null
          executor?: string | null
          id?: number
          installer_name?: string | null
          main_status?: string
          map_reference?: string | null
          meter_number?: string | null
          note?: string | null
          online_date?: string | null
          operator_name?: string | null
          permit_number?: string | null
          phone_number?: string | null
          province?: string | null
          requested_name?: string | null
          requester_name?: string
          sub_status?: string | null
          team_leader?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platforms: {
        Row: {
          admin_email: string | null
          annual_cost: number | null
          category: string
          created_at: string
          created_at_thai: string | null
          description: string | null
          icon_url: string | null
          id: string
          max_users: number | null
          monthly_cost: number | null
          name: string
          notes: string | null
          renewal_date: string | null
          status: string | null
          subscription_plan: string | null
          updated_at: string
          updated_at_thai: string | null
          user_count: number | null
          website_url: string | null
        }
        Insert: {
          admin_email?: string | null
          annual_cost?: number | null
          category: string
          created_at?: string
          created_at_thai?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          max_users?: number | null
          monthly_cost?: number | null
          name: string
          notes?: string | null
          renewal_date?: string | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string
          updated_at_thai?: string | null
          user_count?: number | null
          website_url?: string | null
        }
        Update: {
          admin_email?: string | null
          annual_cost?: number | null
          category?: string
          created_at?: string
          created_at_thai?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          max_users?: number | null
          monthly_cost?: number | null
          name?: string
          notes?: string | null
          renewal_date?: string | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string
          updated_at_thai?: string | null
          user_count?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number
          created_at: string | null
          created_at_thai: string | null
          description: string | null
          id: number
          image: string | null
          is_active: boolean | null
          is_serialized: boolean | null
          model: string | null
          name: string
          sku: string | null
          stock_available: number | null
          stock_total: number | null
          total_cost_in_stock: number | null
          unit_price: number | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          created_at_thai?: string | null
          description?: string | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          is_serialized?: boolean | null
          model?: string | null
          name: string
          sku?: string | null
          stock_available?: number | null
          stock_total?: number | null
          total_cost_in_stock?: number | null
          unit_price?: number | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          created_at_thai?: string | null
          description?: string | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          is_serialized?: boolean | null
          model?: string | null
          name?: string
          sku?: string | null
          stock_available?: number | null
          stock_total?: number | null
          total_cost_in_stock?: number | null
          unit_price?: number | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          created_at_thai: string | null
          id: string
          product_id: number
          purchase_order_id: string
          qty: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          product_id: number
          purchase_order_id: string
          qty?: number
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          product_id?: number
          purchase_order_id?: string
          qty?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_at_thai: string | null
          id: string
          note: string | null
          po_date: string
          po_number: string
          supplier_id: string
          total_amount: number | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          note?: string | null
          po_date?: string
          po_number: string
          supplier_id: string
          total_amount?: number | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          note?: string | null
          po_date?: string
          po_number?: string
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_documents: {
        Row: {
          amount: number | null
          created_at: string | null
          created_at_thai: string | null
          delivery_fee: number | null
          document_number: string
          document_type: string
          id: number
          productivity_log_id: number
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          delivery_fee?: number | null
          document_number: string
          document_type: string
          id?: number
          productivity_log_id: number
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          delivery_fee?: number | null
          document_number?: string
          document_type?: string
          id?: number
          productivity_log_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotation_documents_productivity_log"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_productivity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quotation_documents_productivity_log"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_qt_itemized"
            referencedColumns: ["log_id"]
          },
        ]
      }
      quotations: {
        Row: {
          estimate_payment_date: string | null
          estimate_payment_date_thai: string | null
          has_inv: boolean | null
          has_qt: boolean | null
          id: number
          installment_amount: number | null
          installment_percent: number | null
          installment_periods: number | null
          invoice_number: string | null
          payment_method: string | null
          productivity_log_id: number | null
          quotation_number: string | null
          total_amount: number | null
        }
        Insert: {
          estimate_payment_date?: string | null
          estimate_payment_date_thai?: string | null
          has_inv?: boolean | null
          has_qt?: boolean | null
          id?: number
          installment_amount?: number | null
          installment_percent?: number | null
          installment_periods?: number | null
          invoice_number?: string | null
          payment_method?: string | null
          productivity_log_id?: number | null
          quotation_number?: string | null
          total_amount?: number | null
        }
        Update: {
          estimate_payment_date?: string | null
          estimate_payment_date_thai?: string | null
          has_inv?: boolean | null
          has_qt?: boolean | null
          id?: number
          installment_amount?: number | null
          installment_percent?: number | null
          installment_periods?: number | null
          invoice_number?: string | null
          payment_method?: string | null
          productivity_log_id?: number | null
          quotation_number?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotations_productivity_log"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_productivity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quotations_productivity_log"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_qt_itemized"
            referencedColumns: ["log_id"]
          },
          {
            foreignKeyName: "quotations_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_productivity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_productivity_log_id_fkey"
            columns: ["productivity_log_id"]
            isOneToOne: false
            referencedRelation: "lead_qt_itemized"
            referencedColumns: ["log_id"]
          },
        ]
      }
      resources: {
        Row: {
          available_from: string | null
          available_to: string | null
          capacity: number | null
          created_at: string | null
          created_at_thai: string | null
          description: string | null
          equipment_id: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          available_from?: string | null
          available_to?: string | null
          capacity?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          available_from?: string | null
          available_to?: string | null
          capacity?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "office_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_doc_item_units: {
        Row: {
          created_at: string | null
          id: string
          inventory_unit_id: string
          sales_doc_item_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_unit_id: string
          sales_doc_item_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_unit_id?: string
          sales_doc_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_doc_item_units_inventory_unit_id_fkey"
            columns: ["inventory_unit_id"]
            isOneToOne: true
            referencedRelation: "inventory_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_doc_item_units_sales_doc_item_id_fkey"
            columns: ["sales_doc_item_id"]
            isOneToOne: false
            referencedRelation: "sales_doc_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_doc_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: number
          qty: number
          sales_doc_id: string
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: number
          qty?: number
          sales_doc_id: string
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: number
          qty?: number
          sales_doc_id?: string
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_doc_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_doc_items_sales_doc_id_fkey"
            columns: ["sales_doc_id"]
            isOneToOne: false
            referencedRelation: "sales_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_docs: {
        Row: {
          created_at: string | null
          customer_id: string | null
          doc_date: string
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id: string
          note: string | null
          salesperson_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          doc_date?: string
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id?: string
          note?: string | null
          salesperson_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          doc_date?: string
          doc_number?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          note?: string | null
          salesperson_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_docs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_docs_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_team_with_user_info: {
        Row: {
          created_at: string | null
          created_at_thai: string | null
          current_leads: number | null
          department: string | null
          email: string | null
          id: number
          name: string | null
          phone: string | null
          position: string | null
          status: string | null
          updated_at: string | null
          updated_at_thai: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_at_thai?: string | null
          current_leads?: number | null
          department?: string | null
          email?: string | null
          id: number
          name?: string | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_at_thai?: string | null
          current_leads?: number | null
          department?: string | null
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_team_with_user_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_appointments: {
        Row: {
          appointment_date: string
          appointment_date_thai: string | null
          appointment_time: string | null
          created_at: string | null
          created_at_thai: string | null
          customer_service_id: number
          estimated_duration_minutes: number | null
          id: number
          notes: string | null
          service_type: string | null
          status: string | null
          technician_name: string | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          appointment_date: string
          appointment_date_thai?: string | null
          appointment_time?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          customer_service_id: number
          estimated_duration_minutes?: number | null
          id?: number
          notes?: string | null
          service_type?: string | null
          status?: string | null
          technician_name?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_date_thai?: string | null
          appointment_time?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          customer_service_id?: number
          estimated_duration_minutes?: number | null
          id?: number
          notes?: string | null
          service_type?: string | null
          status?: string | null
          technician_name?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_appointments_customer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_appointments_customer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: false
            referencedRelation: "customer_services_with_days"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_at_thai: string | null
          id: string
          movement: Database["public"]["Enums"]["movement_type"]
          note: string | null
          product_id: number
          qty: number
          ref_id: string | null
          ref_table: string | null
        }
        Insert: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          movement: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id: number
          qty: number
          ref_id?: string | null
          ref_table?: string | null
        }
        Update: {
          created_at?: string | null
          created_at_thai?: string | null
          id?: string
          movement?: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id?: number
          qty?: number
          ref_id?: string | null
          ref_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          created_at_thai: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          auth_user_id: string | null
          birthday: string | null
          created_at: string | null
          created_at_thai: string | null
          department: string | null
          email: string | null
          emergency_contact: Json | null
          employee_code: string | null
          end_date: string | null
          first_name: string | null
          id: string
          last_name: string | null
          line_id: string | null
          manager_id: string | null
          nickname: string | null
          personal_id: string | null
          phone: string | null
          position: string | null
          profile_image_url: string | null
          role: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          birthday?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_code?: string | null
          end_date?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          line_id?: string | null
          manager_id?: string | null
          nickname?: string | null
          personal_id?: string | null
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          birthday?: string | null
          created_at?: string | null
          created_at_thai?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_code?: string | null
          end_date?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          line_id?: string | null
          manager_id?: string | null
          nickname?: string | null
          personal_id?: string | null
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_services_extended: {
        Row: {
          capacity_kw: number | null
          completed_visits_count: number | null
          created_at: string | null
          created_at_thai: string | null
          customer_group: string | null
          days_after_service_complete: number | null
          days_since_installation: number | null
          days_until_service_1_due: number | null
          days_until_service_2_due: number | null
          district: string | null
          id: number | null
          installation_date: string | null
          installation_date_thai: string | null
          installer_name: string | null
          notes: string | null
          province: string | null
          remaining_visits_count: number | null
          sale: string | null
          sale_follow_up_assigned_to: number | null
          sale_follow_up_created_at: string | null
          sale_follow_up_date: string | null
          sale_follow_up_date_thai: string | null
          sale_follow_up_details: string | null
          sale_follow_up_notes: string | null
          sale_follow_up_required: boolean | null
          sale_follow_up_status: string | null
          sale_follow_up_updated_at: string | null
          service_status_calculated: string | null
          service_visit_1: boolean | null
          service_visit_1_date: string | null
          service_visit_1_date_thai: string | null
          service_visit_1_technician: string | null
          service_visit_2: boolean | null
          service_visit_2_date: string | null
          service_visit_2_date_thai: string | null
          service_visit_2_technician: string | null
          service_visit_3: boolean | null
          service_visit_3_date: string | null
          service_visit_3_date_thai: string | null
          service_visit_3_technician: string | null
          service_visit_4: boolean | null
          service_visit_4_date: string | null
          service_visit_4_date_thai: string | null
          service_visit_4_technician: string | null
          service_visit_5: boolean | null
          service_visit_5_date: string | null
          service_visit_5_date_thai: string | null
          service_visit_5_technician: string | null
          status: string | null
          tel: string | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          capacity_kw?: never
          completed_visits_count?: never
          created_at?: never
          created_at_thai?: never
          customer_group?: never
          district?: never
          id?: never
          installation_date?: never
          installation_date_thai?: never
          installer_name?: never
          notes?: never
          province?: never
          remaining_visits_count?: never
          sale?: never
          sale_follow_up_assigned_to?: never
          sale_follow_up_created_at?: never
          sale_follow_up_date?: never
          sale_follow_up_date_thai?: never
          sale_follow_up_details?: never
          sale_follow_up_notes?: never
          sale_follow_up_required?: never
          sale_follow_up_status?: never
          sale_follow_up_updated_at?: never
          service_status_calculated?: never
          service_visit_1?: never
          service_visit_1_date?: never
          service_visit_1_date_thai?: never
          service_visit_1_technician?: never
          service_visit_2?: never
          service_visit_2_date?: never
          service_visit_2_date_thai?: never
          service_visit_2_technician?: never
          service_visit_3?: never
          service_visit_3_date?: never
          service_visit_3_date_thai?: never
          service_visit_3_technician?: never
          service_visit_4?: never
          service_visit_4_date?: never
          service_visit_4_date_thai?: never
          service_visit_4_technician?: never
          service_visit_5?: never
          service_visit_5_date?: never
          service_visit_5_date_thai?: never
          service_visit_5_technician?: never
          status?: never
          tel?: never
          updated_at?: never
          updated_at_thai?: never
        }
        Update: {
          capacity_kw?: never
          completed_visits_count?: never
          created_at?: never
          created_at_thai?: never
          customer_group?: never
          district?: never
          id?: never
          installation_date?: never
          installation_date_thai?: never
          installer_name?: never
          notes?: never
          province?: never
          remaining_visits_count?: never
          sale?: never
          sale_follow_up_assigned_to?: never
          sale_follow_up_created_at?: never
          sale_follow_up_date?: never
          sale_follow_up_date_thai?: never
          sale_follow_up_details?: never
          sale_follow_up_notes?: never
          sale_follow_up_required?: never
          sale_follow_up_status?: never
          sale_follow_up_updated_at?: never
          service_status_calculated?: never
          service_visit_1?: never
          service_visit_1_date?: never
          service_visit_1_date_thai?: never
          service_visit_1_technician?: never
          service_visit_2?: never
          service_visit_2_date?: never
          service_visit_2_date_thai?: never
          service_visit_2_technician?: never
          service_visit_3?: never
          service_visit_3_date?: never
          service_visit_3_date_thai?: never
          service_visit_3_technician?: never
          service_visit_4?: never
          service_visit_4_date?: never
          service_visit_4_date_thai?: never
          service_visit_4_technician?: never
          service_visit_5?: never
          service_visit_5_date?: never
          service_visit_5_date_thai?: never
          service_visit_5_technician?: never
          status?: never
          tel?: never
          updated_at?: never
          updated_at_thai?: never
        }
        Relationships: []
      }
      customer_services_with_days: {
        Row: {
          capacity_kw: number | null
          created_at: string | null
          created_at_thai: string | null
          customer_group: string | null
          days_after_service_complete: number | null
          days_since_installation: number | null
          days_until_service_1_due: number | null
          days_until_service_2_due: number | null
          district: string | null
          id: number | null
          installation_date: string | null
          installation_date_thai: string | null
          installer_name: string | null
          notes: string | null
          province: string | null
          sale: string | null
          sale_follow_up_assigned_to: number | null
          sale_follow_up_created_at: string | null
          sale_follow_up_date: string | null
          sale_follow_up_date_thai: string | null
          sale_follow_up_details: string | null
          sale_follow_up_notes: string | null
          sale_follow_up_required: boolean | null
          sale_follow_up_status: string | null
          sale_follow_up_updated_at: string | null
          service_status_calculated: string | null
          service_visit_1: boolean | null
          service_visit_1_date: string | null
          service_visit_1_date_thai: string | null
          service_visit_1_technician: string | null
          service_visit_2: boolean | null
          service_visit_2_date: string | null
          service_visit_2_date_thai: string | null
          service_visit_2_technician: string | null
          status: string | null
          tel: string | null
          updated_at: string | null
          updated_at_thai: string | null
        }
        Insert: {
          capacity_kw?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          customer_group?: string | null
          days_after_service_complete?: never
          days_since_installation?: never
          days_until_service_1_due?: never
          days_until_service_2_due?: never
          district?: string | null
          id?: number | null
          installation_date?: string | null
          installation_date_thai?: string | null
          installer_name?: string | null
          notes?: string | null
          province?: string | null
          sale?: string | null
          sale_follow_up_assigned_to?: number | null
          sale_follow_up_created_at?: string | null
          sale_follow_up_date?: string | null
          sale_follow_up_date_thai?: string | null
          sale_follow_up_details?: string | null
          sale_follow_up_notes?: string | null
          sale_follow_up_required?: boolean | null
          sale_follow_up_status?: string | null
          sale_follow_up_updated_at?: string | null
          service_status_calculated?: never
          service_visit_1?: boolean | null
          service_visit_1_date?: string | null
          service_visit_1_date_thai?: string | null
          service_visit_1_technician?: string | null
          service_visit_2?: boolean | null
          service_visit_2_date?: string | null
          service_visit_2_date_thai?: string | null
          service_visit_2_technician?: string | null
          status?: string | null
          tel?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Update: {
          capacity_kw?: number | null
          created_at?: string | null
          created_at_thai?: string | null
          customer_group?: string | null
          days_after_service_complete?: never
          days_since_installation?: never
          days_until_service_1_due?: never
          days_until_service_2_due?: never
          district?: string | null
          id?: number | null
          installation_date?: string | null
          installation_date_thai?: string | null
          installer_name?: string | null
          notes?: string | null
          province?: string | null
          sale?: string | null
          sale_follow_up_assigned_to?: number | null
          sale_follow_up_created_at?: string | null
          sale_follow_up_date?: string | null
          sale_follow_up_date_thai?: string | null
          sale_follow_up_details?: string | null
          sale_follow_up_notes?: string | null
          sale_follow_up_required?: boolean | null
          sale_follow_up_status?: string | null
          sale_follow_up_updated_at?: string | null
          service_status_calculated?: never
          service_visit_1?: boolean | null
          service_visit_1_date?: string | null
          service_visit_1_date_thai?: string | null
          service_visit_1_technician?: string | null
          service_visit_2?: boolean | null
          service_visit_2_date?: string | null
          service_visit_2_date_thai?: string | null
          service_visit_2_technician?: string | null
          status?: string | null
          tel?: string | null
          updated_at?: string | null
          updated_at_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_services_sale_follow_up_assigned_to_fkey"
            columns: ["sale_follow_up_assigned_to"]
            isOneToOne: false
            referencedRelation: "sales_team_with_user_info"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_qt_itemized: {
        Row: {
          amount: number | null
          category: string | null
          created_at_thai: string | null
          customer_name: string | null
          document_number: string | null
          last_activity_date: string | null
          lead_id: number | null
          lead_status: string | null
          log_id: number | null
          operation_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_productivity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_sales_opportunity"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_productivity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sales_opportunity: {
        Row: {
          category: string | null
          customer_name: string | null
          last_activity_date: string | null
          lead_id: number | null
          lead_status: string | null
          operation_status: string | null
          total_opportunity_amount: number | null
          unique_qt_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_crm: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_hr: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_package: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_wholesale: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_crm: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_equipment: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_hr: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_users: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_view_all_employees: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_view_all_leads: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_view_reports: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_view_sales_team: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_normalized_phone_duplicate: {
        Args: { exclude_id?: number; phone_input: string }
        Returns: boolean
      }
      create_lead_from_customer_service: {
        Args: { cs_id: number }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_page: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager_or_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_sale_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_sales_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      sync_sales_team_with_user_info: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_all_sales_team_current_leads_v2: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_sales_team_current_leads_v2: {
        Args: { sales_member_id: number }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "sale" | "manager" | "admin_page" | "marketing"
      customer_status: "active" | "inactive"
      doc_type: "QT" | "BL" | "INV"
      equipment_status: "in_use" | "maintenance" | "lost" | "disposed"
      equipment_type: "it" | "audio" | "visual" | "other"
      inventory_status:
        | "in_stock"
        | "reserved"
        | "sold"
        | "returned"
        | "damaged"
      movement_type: "IN" | "OUT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "sale", "manager", "admin_page", "marketing"],
      customer_status: ["active", "inactive"],
      doc_type: ["QT", "BL", "INV"],
      equipment_status: ["in_use", "maintenance", "lost", "disposed"],
      equipment_type: ["it", "audio", "visual", "other"],
      inventory_status: ["in_stock", "reserved", "sold", "returned", "damaged"],
      movement_type: ["IN", "OUT"],
    },
  },
} as const
