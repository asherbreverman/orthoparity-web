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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      pc_devices: {
        Row: {
          applicant: string | null
          brand: string | null
          company_root: string | null
          decision_date: string | null
          decision_year: string | null
          device_class: string | null
          device_name: string | null
          in_starting_set: boolean
          knumber: string
          product_code: string | null
          regulation_number: string | null
          review_panel: string | null
          segment: string | null
          status: string | null
          stop_reason: string | null
          summary_url: string | null
        }
        Insert: {
          applicant?: string | null
          brand?: string | null
          company_root?: string | null
          decision_date?: string | null
          decision_year?: string | null
          device_class?: string | null
          device_name?: string | null
          in_starting_set?: boolean
          knumber: string
          product_code?: string | null
          regulation_number?: string | null
          review_panel?: string | null
          segment?: string | null
          status?: string | null
          stop_reason?: string | null
          summary_url?: string | null
        }
        Update: {
          applicant?: string | null
          brand?: string | null
          company_root?: string | null
          decision_date?: string | null
          decision_year?: string | null
          device_class?: string | null
          device_name?: string | null
          in_starting_set?: boolean
          knumber?: string
          product_code?: string | null
          regulation_number?: string | null
          review_panel?: string | null
          segment?: string | null
          status?: string | null
          stop_reason?: string | null
          summary_url?: string | null
        }
        Relationships: []
      }
      pc_edges: {
        Row: {
          child: string
          confidence: string | null
          edge_id: number
          evidence: string | null
          list_order: number | null
          number_as_printed: string | null
          page: string | null
          predicate: string
          printed_label: string | null
          review_decision: string | null
          review_source: string | null
          role: string | null
        }
        Insert: {
          child: string
          confidence?: string | null
          edge_id: number
          evidence?: string | null
          list_order?: number | null
          number_as_printed?: string | null
          page?: string | null
          predicate: string
          printed_label?: string | null
          review_decision?: string | null
          review_source?: string | null
          role?: string | null
        }
        Update: {
          child?: string
          confidence?: string | null
          edge_id?: number
          evidence?: string | null
          list_order?: number | null
          number_as_printed?: string | null
          page?: string | null
          predicate?: string
          printed_label?: string | null
          review_decision?: string | null
          review_source?: string | null
          role?: string | null
        }
        Relationships: []
      }
      pc_flags: {
        Row: {
          detail: string | null
          flag_id: number
          flag_type: string | null
          knumber: string
          number: string | null
          review_decision: string | null
        }
        Insert: {
          detail?: string | null
          flag_id: number
          flag_type?: string | null
          knumber: string
          number?: string | null
          review_decision?: string | null
        }
        Update: {
          detail?: string | null
          flag_id?: number
          flag_type?: string | null
          knumber?: string
          number?: string | null
          review_decision?: string | null
        }
        Relationships: []
      }
      pc_meta: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      pc_brand_family: { Args: { k: string }; Returns: Json }
      pc_clean_blanks: { Args: never; Returns: string }
      pc_lookup: { Args: { max_gen?: number; roots: string[] }; Returns: Json }
      pc_search: {
        Args: { lim?: number; q: string }
        Returns: {
          applicant: string
          decision_date: string
          device_name: string
          in_starting_set: boolean
          knumber: string
          match: string
          segment: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
