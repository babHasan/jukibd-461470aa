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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      boards: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          remarks: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          remarks?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          remarks?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          remarks: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          remarks?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          remarks?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          parent_id: string | null
        }
        Insert: {
          account_code?: string
          account_name: string
          account_type?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          parent_id?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string
          client_name: string
          company_name: string
          contact_number: string
          created_at: string
          email: string
          id: string
          image_url: string | null
          remarks: string
          updated_at: string
        }
        Insert: {
          address?: string
          client_name: string
          company_name?: string
          contact_number?: string
          created_at?: string
          email?: string
          id?: string
          image_url?: string | null
          remarks?: string
          updated_at?: string
        }
        Update: {
          address?: string
          client_name?: string
          company_name?: string
          contact_number?: string
          created_at?: string
          email?: string
          id?: string
          image_url?: string | null
          remarks?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_info: {
        Row: {
          address: string
          company_name: string
          email: string
          header_font_size: number
          id: string
          logo_url: string | null
          mobile: string
          phone: string
          portal_enabled: boolean
          updated_at: string
          website: string
        }
        Insert: {
          address?: string
          company_name?: string
          email?: string
          header_font_size?: number
          id?: string
          logo_url?: string | null
          mobile?: string
          phone?: string
          portal_enabled?: boolean
          updated_at?: string
          website?: string
        }
        Update: {
          address?: string
          company_name?: string
          email?: string
          header_font_size?: number
          id?: string
          logo_url?: string | null
          mobile?: string
          phone?: string
          portal_enabled?: boolean
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      customer_feedback: {
        Row: {
          created_at: string
          customer_name: string
          feedback_text: string
          id: string
          job_id: string | null
          job_number: string
          rating: number
        }
        Insert: {
          created_at?: string
          customer_name?: string
          feedback_text?: string
          id?: string
          job_id?: string | null
          job_number?: string
          rating?: number
        }
        Update: {
          created_at?: string
          customer_name?: string
          feedback_text?: string
          id?: string
          job_id?: string | null
          job_number?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          remarks: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          remarks?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          remarks?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          category_name: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          memo_no: string
          remarks: string
          service_provider: string
          service_provider_memo: string
          tr_no: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          category_name?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          memo_no?: string
          remarks?: string
          service_provider?: string
          service_provider_memo?: string
          tr_no?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          category_name?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          memo_no?: string
          remarks?: string
          service_provider?: string
          service_provider_memo?: string
          tr_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      footer_content: {
        Row: {
          content: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          content?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          content?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      income_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          remarks: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          remarks?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          remarks?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          category_id: string | null
          category_name: string
          created_at: string
          created_by: string | null
          id: string
          income_date: string
          remarks: string
          tr_no: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          category_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          income_date?: string
          remarks?: string
          tr_no?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          category_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          income_date?: string
          remarks?: string
          tr_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          brand: string
          category: string
          created_at: string
          id: string
          location: string
          min_stock_level: number
          part_name: string
          part_number: string
          quantity: number
          remarks: string
          supplier: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          location?: string
          min_stock_level?: number
          part_name: string
          part_number?: string
          quantity?: number
          remarks?: string
          supplier?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          location?: string
          min_stock_level?: number
          part_name?: string
          part_number?: string
          quantity?: number
          remarks?: string
          supplier?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoice_column_settings: {
        Row: {
          alignment: string
          column_key: string
          column_label: string
          created_at: string
          display_order: number
          font_size: number
          id: string
          visible_in_delivery: boolean
          visible_in_receive: boolean
        }
        Insert: {
          alignment?: string
          column_key: string
          column_label: string
          created_at?: string
          display_order?: number
          font_size?: number
          id?: string
          visible_in_delivery?: boolean
          visible_in_receive?: boolean
        }
        Update: {
          alignment?: string
          column_key?: string
          column_label?: string
          created_at?: string
          display_order?: number
          font_size?: number
          id?: string
          visible_in_delivery?: boolean
          visible_in_receive?: boolean
        }
        Relationships: []
      }
      jobs: {
        Row: {
          board_name: string
          board_serial: string
          branch_id: string | null
          branch_name: string
          brand_name: string
          challan_url: string | null
          charge_type: string | null
          cheque_url: string | null
          completed_date: string | null
          created_at: string
          created_by: string | null
          created_by_name: string
          customer_id: string | null
          customer_name: string
          delivered_by_name: string
          delivery_date: string | null
          details_of_problem: string
          discount: number | null
          factory_challan_number: string
          id: string
          job_date: string
          job_number: string
          model_name: string
          payable_amount: number | null
          receive_amount: number | null
          receive_type: string | null
          remarks: string
          service_charge: number | null
          status: string
        }
        Insert: {
          board_name?: string
          board_serial?: string
          branch_id?: string | null
          branch_name?: string
          brand_name?: string
          challan_url?: string | null
          charge_type?: string | null
          cheque_url?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string
          customer_id?: string | null
          customer_name?: string
          delivered_by_name?: string
          delivery_date?: string | null
          details_of_problem?: string
          discount?: number | null
          factory_challan_number?: string
          id?: string
          job_date?: string
          job_number: string
          model_name?: string
          payable_amount?: number | null
          receive_amount?: number | null
          receive_type?: string | null
          remarks?: string
          service_charge?: number | null
          status?: string
        }
        Update: {
          board_name?: string
          board_serial?: string
          branch_id?: string | null
          branch_name?: string
          brand_name?: string
          challan_url?: string | null
          charge_type?: string | null
          cheque_url?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string
          customer_id?: string | null
          customer_name?: string
          delivered_by_name?: string
          delivery_date?: string | null
          details_of_problem?: string
          discount?: number | null
          factory_challan_number?: string
          id?: string
          job_date?: string
          job_number?: string
          model_name?: string
          payable_amount?: number | null
          receive_amount?: number | null
          receive_type?: string | null
          remarks?: string
          service_charge?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string
          id: string
          name: string
          remarks: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          remarks?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          remarks?: string
        }
        Relationships: []
      }
      portal_scroll_messages: {
        Row: {
          font_color: string
          font_size: number
          id: string
          is_active: boolean
          message_text: string
          updated_at: string
        }
        Insert: {
          font_color?: string
          font_size?: number
          id?: string
          is_active?: boolean
          message_text?: string
          updated_at?: string
        }
        Update: {
          font_color?: string
          font_size?: number
          id?: string
          is_active?: boolean
          message_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string
          created_at: string
          email: string
          employee_id: string
          id: string
          mobile: string
          name: string
          nid: string
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          email?: string
          employee_id?: string
          id: string
          mobile?: string
          name?: string
          nid?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          employee_id?: string
          id?: string
          mobile?: string
          name?: string
          nid?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_config: {
        Row: {
          api_key: string
          id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          api_key?: string
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          api_response: Json | null
          created_at: string
          customer_phone: string
          id: string
          message_text: string
          repair_order_id: string
          status: string
          trigger_status: string
        }
        Insert: {
          api_response?: Json | null
          created_at?: string
          customer_phone: string
          id?: string
          message_text: string
          repair_order_id: string
          status?: string
          trigger_status: string
        }
        Update: {
          api_response?: Json | null
          created_at?: string
          customer_phone?: string
          id?: string
          message_text?: string
          repair_order_id?: string
          status?: string
          trigger_status?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          template_text: string
          trigger_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          template_text: string
          trigger_status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          template_text?: string
          trigger_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          id: string
          menu_font_color: string
          menu_font_size: number
          page_bg_color: string
          primary_color: string
          sidebar_bg_color: string
          submenu_font_color: string
          submenu_font_size: number
          table_font_color: string
          table_font_size: number
          table_header_bg_color: string
          table_header_font_color: string
          updated_at: string
        }
        Insert: {
          id?: string
          menu_font_color?: string
          menu_font_size?: number
          page_bg_color?: string
          primary_color?: string
          sidebar_bg_color?: string
          submenu_font_color?: string
          submenu_font_size?: number
          table_font_color?: string
          table_font_size?: number
          table_header_bg_color?: string
          table_header_font_color?: string
          updated_at?: string
        }
        Update: {
          id?: string
          menu_font_color?: string
          menu_font_size?: number
          page_bg_color?: string
          primary_color?: string
          sidebar_bg_color?: string
          submenu_font_color?: string
          submenu_font_size?: number
          table_font_color?: string
          table_font_size?: number
          table_header_bg_color?: string
          table_header_font_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          id: string
          module: string
          user_id: string
        }
        Insert: {
          id?: string
          module: string
          user_id: string
        }
        Update: {
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warranties: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          job_id: string | null
          job_number: string
          status: string
          terms: string
          updated_at: string
          warranty_end_date: string
          warranty_start_date: string
          warranty_type: string
        }
        Insert: {
          created_at?: string
          customer_name?: string
          id?: string
          job_id?: string | null
          job_number?: string
          status?: string
          terms?: string
          updated_at?: string
          warranty_end_date: string
          warranty_start_date?: string
          warranty_type?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          job_id?: string | null
          job_number?: string
          status?: string
          terms?: string
          updated_at?: string
          warranty_end_date?: string
          warranty_start_date?: string
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_module_permission: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_email_by_mobile: { Args: { _mobile: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
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
      app_role: ["admin", "user", "super_admin"],
    },
  },
} as const
