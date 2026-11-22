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
      pc_add_on_payment: {
        Row: {
          apc: string | null
          cms_codes: string | null
          cms_descriptor: string | null
          cms_source: string | null
          company: string | null
          effective: string | null
          fda_numbers: string | null
          fda_source: string | null
          hcpcs: string | null
          max_payment: number | null
          note: string | null
          pass_through_ends: string | null
          pathway: string | null
          period: string | null
          program: string | null
          status: string | null
          tech_id: string
          technology: string | null
          vendor_id: string | null
        }
        Insert: {
          apc?: string | null
          cms_codes?: string | null
          cms_descriptor?: string | null
          cms_source?: string | null
          company?: string | null
          effective?: string | null
          fda_numbers?: string | null
          fda_source?: string | null
          hcpcs?: string | null
          max_payment?: number | null
          note?: string | null
          pass_through_ends?: string | null
          pathway?: string | null
          period?: string | null
          program?: string | null
          status?: string | null
          tech_id: string
          technology?: string | null
          vendor_id?: string | null
        }
        Update: {
          apc?: string | null
          cms_codes?: string | null
          cms_descriptor?: string | null
          cms_source?: string | null
          company?: string | null
          effective?: string | null
          fda_numbers?: string | null
          fda_source?: string | null
          hcpcs?: string | null
          max_payment?: number | null
          note?: string | null
          pass_through_ends?: string | null
          pathway?: string | null
          period?: string | null
          program?: string | null
          status?: string | null
          tech_id?: string
          technology?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_add_on_payment_510k: {
        Row: {
          knumber: string
          product_code: string | null
          tech_id: string
          vendor_id: string | null
        }
        Insert: {
          knumber: string
          product_code?: string | null
          tech_id: string
          vendor_id?: string | null
        }
        Update: {
          knumber?: string
          product_code?: string | null
          tech_id?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_compliance_action: {
        Row: {
          action_date: string | null
          action_type: string | null
          case_id: string | null
          fei_number: string | null
          legal_name: string | null
          product_type: string | null
        }
        Insert: {
          action_date?: string | null
          action_type?: string | null
          case_id?: string | null
          fei_number?: string | null
          legal_name?: string | null
          product_type?: string | null
        }
        Update: {
          action_date?: string | null
          action_type?: string | null
          case_id?: string | null
          fei_number?: string | null
          legal_name?: string | null
          product_type?: string | null
        }
        Relationships: []
      }
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
      pc_establishment: {
        Row: {
          activities: string | null
          city: string | null
          company_vendor_id: string | null
          country: string | null
          fei_number: string
          knumbers: number | null
          makes_devices: boolean | null
          name: string | null
          owner_operator_name: string | null
          owner_operator_number: string | null
          product_codes: string | null
          reg_expiry_year: number | null
          registration_number: string | null
          state: string | null
        }
        Insert: {
          activities?: string | null
          city?: string | null
          company_vendor_id?: string | null
          country?: string | null
          fei_number: string
          knumbers?: number | null
          makes_devices?: boolean | null
          name?: string | null
          owner_operator_name?: string | null
          owner_operator_number?: string | null
          product_codes?: string | null
          reg_expiry_year?: number | null
          registration_number?: string | null
          state?: string | null
        }
        Update: {
          activities?: string | null
          city?: string | null
          company_vendor_id?: string | null
          country?: string | null
          fei_number?: string
          knumbers?: number | null
          makes_devices?: boolean | null
          name?: string | null
          owner_operator_name?: string | null
          owner_operator_number?: string | null
          product_codes?: string | null
          reg_expiry_year?: number | null
          registration_number?: string | null
          state?: string | null
        }
        Relationships: []
      }
      pc_establishment_510k: {
        Row: {
          activities: string | null
          fei_number: string
          knumber: string
          makes_device: boolean | null
          proprietary_names: string | null
        }
        Insert: {
          activities?: string | null
          fei_number: string
          knumber: string
          makes_device?: boolean | null
          proprietary_names?: string | null
        }
        Update: {
          activities?: string | null
          fei_number?: string
          knumber?: string
          makes_device?: boolean | null
          proprietary_names?: string | null
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
      pc_ifu: {
        Row: {
          found: boolean
          ifu_text: string | null
          knumber: string
          page: string | null
          source: string | null
        }
        Insert: {
          found?: boolean
          ifu_text?: string | null
          knumber: string
          page?: string | null
          source?: string | null
        }
        Update: {
          found?: boolean
          ifu_text?: string | null
          knumber?: string
          page?: string | null
          source?: string | null
        }
        Relationships: []
      }
      pc_inspection: {
        Row: {
          classification: string | null
          end_date: string | null
          fei_number: string | null
          fiscal_year: number | null
          inspection_id: string | null
          legal_name: string | null
          posted_citations: boolean | null
          product_type: string | null
          project_area: string | null
        }
        Insert: {
          classification?: string | null
          end_date?: string | null
          fei_number?: string | null
          fiscal_year?: number | null
          inspection_id?: string | null
          legal_name?: string | null
          posted_citations?: boolean | null
          product_type?: string | null
          project_area?: string | null
        }
        Update: {
          classification?: string | null
          end_date?: string | null
          fei_number?: string | null
          fiscal_year?: number | null
          inspection_id?: string | null
          legal_name?: string | null
          posted_citations?: boolean | null
          product_type?: string | null
          project_area?: string | null
        }
        Relationships: []
      }
      pc_inspection_citation: {
        Row: {
          cfr: string | null
          end_date: string | null
          fei_number: string | null
          inspection_id: string | null
          program_area: string | null
          short_description: string | null
        }
        Insert: {
          cfr?: string | null
          end_date?: string | null
          fei_number?: string | null
          inspection_id?: string | null
          program_area?: string | null
          short_description?: string | null
        }
        Update: {
          cfr?: string | null
          end_date?: string | null
          fei_number?: string | null
          inspection_id?: string | null
          program_area?: string | null
          short_description?: string | null
        }
        Relationships: []
      }
      pc_maude_product: {
        Row: {
          data_through: string | null
          deaths: number | null
          deaths_last5: number | null
          first_year: number | null
          injuries: number | null
          injuries_last5: number | null
          knumber: string
          last_year: number | null
          malfunctions: number | null
          malfunctions_last5: number | null
          other: number | null
          other_last5: number | null
          reports: number | null
          reports_last5: number | null
          window_start: string | null
        }
        Insert: {
          data_through?: string | null
          deaths?: number | null
          deaths_last5?: number | null
          first_year?: number | null
          injuries?: number | null
          injuries_last5?: number | null
          knumber: string
          last_year?: number | null
          malfunctions?: number | null
          malfunctions_last5?: number | null
          other?: number | null
          other_last5?: number | null
          reports?: number | null
          reports_last5?: number | null
          window_start?: string | null
        }
        Update: {
          data_through?: string | null
          deaths?: number | null
          deaths_last5?: number | null
          first_year?: number | null
          injuries?: number | null
          injuries_last5?: number | null
          knumber?: string
          last_year?: number | null
          malfunctions?: number | null
          malfunctions_last5?: number | null
          other?: number | null
          other_last5?: number | null
          reports?: number | null
          reports_last5?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      pc_maude_year: {
        Row: {
          knumber: string
          reports: number | null
          year: number
        }
        Insert: {
          knumber: string
          reports?: number | null
          year: number
        }
        Update: {
          knumber?: string
          reports?: number | null
          year?: number
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
      pc_op_entity: {
        Row: {
          amount: number | null
          food: number | null
          payer_id: string | null
          payer_name: string | null
          recipients: number | null
          royalty: number | null
          vendor_current: string | null
          vendor_pit: string | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          food?: number | null
          payer_id?: string | null
          payer_name?: string | null
          recipients?: number | null
          royalty?: number | null
          vendor_current?: string | null
          vendor_pit?: string | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          food?: number | null
          payer_id?: string | null
          payer_name?: string | null
          recipients?: number | null
          royalty?: number | null
          vendor_current?: string | null
          vendor_pit?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pc_op_ownership: {
        Row: {
          holders: number | null
          invested: number | null
          value: number | null
          vendor_current: string | null
          vendor_pit: string | null
          year: number | null
        }
        Insert: {
          holders?: number | null
          invested?: number | null
          value?: number | null
          vendor_current?: string | null
          vendor_pit?: string | null
          year?: number | null
        }
        Update: {
          holders?: number | null
          invested?: number | null
          value?: number | null
          vendor_current?: string | null
          vendor_pit?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pc_op_product: {
        Row: {
          amount: number | null
          brand: string | null
          knumber: string | null
          nature_group: string | null
          recipients: number | null
          tier: number | null
          transactions: number | null
          vendor_pit: string | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          brand?: string | null
          knumber?: string | null
          nature_group?: string | null
          recipients?: number | null
          tier?: number | null
          transactions?: number | null
          vendor_pit?: string | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          brand?: string | null
          knumber?: string | null
          nature_group?: string | null
          recipients?: number | null
          tier?: number | null
          transactions?: number | null
          vendor_pit?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pc_op_product_top: {
        Row: {
          amount: number | null
          brand: string | null
          engagement: number | null
          mode: string | null
          rank: number | null
          royalty: number | null
          transactions: number | null
          vendor_id: string | null
        }
        Insert: {
          amount?: number | null
          brand?: string | null
          engagement?: number | null
          mode?: string | null
          rank?: number | null
          royalty?: number | null
          transactions?: number | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number | null
          brand?: string | null
          engagement?: number | null
          mode?: string | null
          rank?: number | null
          royalty?: number | null
          transactions?: number | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_op_relationship: {
        Row: {
          amount: number | null
          bucket: string | null
          consulting: boolean | null
          mode: string | null
          rkey: string | null
          royalty: boolean | null
          speaking_services: boolean | null
          vendor_id: string | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          bucket?: string | null
          consulting?: boolean | null
          mode?: string | null
          rkey?: string | null
          royalty?: boolean | null
          speaking_services?: boolean | null
          vendor_id?: string | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          bucket?: string | null
          consulting?: boolean | null
          mode?: string | null
          rkey?: string | null
          royalty?: boolean | null
          speaking_services?: boolean | null
          vendor_id?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pc_op_research: {
        Row: {
          amount: number | null
          ct_gov_id: string | null
          knumbers: string | null
          ortho: boolean | null
          payments: number | null
          preclinical: boolean | null
          study_name: string | null
          vendor_current: string | null
          vendor_entity: string | null
          vendor_pit: string | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          ct_gov_id?: string | null
          knumbers?: string | null
          ortho?: boolean | null
          payments?: number | null
          preclinical?: boolean | null
          study_name?: string | null
          vendor_current?: string | null
          vendor_entity?: string | null
          vendor_pit?: string | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          ct_gov_id?: string | null
          knumbers?: string | null
          ortho?: boolean | null
          payments?: number | null
          preclinical?: boolean | null
          study_name?: string | null
          vendor_current?: string | null
          vendor_entity?: string | null
          vendor_pit?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pc_op_vendor_profile: {
        Row: {
          acquisitions: number | null
          bucket_json: Json | null
          consulting_r: number | null
          debt_forgiveness: number | null
          equity_forms: number | null
          food_r: number | null
          median_per_recipient: number | null
          mode: string | null
          physicians: number | null
          recipients: number | null
          royalty_r: number | null
          to_entities: number | null
          to_teaching_hospitals: number | null
          top10_share: number | null
          top1pct_share: number | null
          total: number | null
          transactions: number | null
          travel_r: number | null
          vendor_id: string | null
          year: number | null
        }
        Insert: {
          acquisitions?: number | null
          bucket_json?: Json | null
          consulting_r?: number | null
          debt_forgiveness?: number | null
          equity_forms?: number | null
          food_r?: number | null
          median_per_recipient?: number | null
          mode?: string | null
          physicians?: number | null
          recipients?: number | null
          royalty_r?: number | null
          to_entities?: number | null
          to_teaching_hospitals?: number | null
          top10_share?: number | null
          top1pct_share?: number | null
          total?: number | null
          transactions?: number | null
          travel_r?: number | null
          vendor_id?: string | null
          year?: number | null
        }
        Update: {
          acquisitions?: number | null
          bucket_json?: Json | null
          consulting_r?: number | null
          debt_forgiveness?: number | null
          equity_forms?: number | null
          food_r?: number | null
          median_per_recipient?: number | null
          mode?: string | null
          physicians?: number | null
          recipients?: number | null
          royalty_r?: number | null
          to_entities?: number | null
          to_teaching_hospitals?: number | null
          top10_share?: number | null
          top1pct_share?: number | null
          total?: number | null
          transactions?: number | null
          travel_r?: number | null
          vendor_id?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pc_op_vendor_year: {
        Row: {
          amount: number | null
          mode: string | null
          nature_group: string | null
          recipients: number | null
          transactions: number | null
          vendor_id: string | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          mode?: string | null
          nature_group?: string | null
          recipients?: number | null
          transactions?: number | null
          vendor_id?: string | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          mode?: string | null
          nature_group?: string | null
          recipients?: number | null
          transactions?: number | null
          vendor_id?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pc_portfolio_510k: {
        Row: {
          applicant: string | null
          decision_date: string | null
          device_name: string | null
          gudid_brand: string | null
          gudid_devices: number | null
          gudid_in_distribution: number | null
          knumber: string | null
          product_code: string | null
          vendor_id: string | null
        }
        Insert: {
          applicant?: string | null
          decision_date?: string | null
          device_name?: string | null
          gudid_brand?: string | null
          gudid_devices?: number | null
          gudid_in_distribution?: number | null
          knumber?: string | null
          product_code?: string | null
          vendor_id?: string | null
        }
        Update: {
          applicant?: string | null
          decision_date?: string | null
          device_name?: string | null
          gudid_brand?: string | null
          gudid_devices?: number | null
          gudid_in_distribution?: number | null
          knumber?: string | null
          product_code?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_portfolio_brands: {
        Row: {
          brand: string | null
          devices: number | null
          implantable: boolean | null
          in_distribution: number | null
          knumbers: string | null
          product_codes: string | null
          vendor_id: string | null
        }
        Insert: {
          brand?: string | null
          devices?: number | null
          implantable?: boolean | null
          in_distribution?: number | null
          knumbers?: string | null
          product_codes?: string | null
          vendor_id?: string | null
        }
        Update: {
          brand?: string | null
          devices?: number | null
          implantable?: boolean | null
          in_distribution?: number | null
          knumbers?: string | null
          product_codes?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_procedure_apc: {
        Row: {
          apc: string
          apc_desc: string | null
          data_year: number | null
          hospitals: number | null
          medicare_pays: number | null
          patient_other_pays: number | null
          patients_reported: number | null
          services: number | null
          total_allowed: number | null
        }
        Insert: {
          apc: string
          apc_desc?: string | null
          data_year?: number | null
          hospitals?: number | null
          medicare_pays?: number | null
          patient_other_pays?: number | null
          patients_reported?: number | null
          services?: number | null
          total_allowed?: number | null
        }
        Update: {
          apc?: string
          apc_desc?: string | null
          data_year?: number | null
          hospitals?: number | null
          medicare_pays?: number | null
          patient_other_pays?: number | null
          patients_reported?: number | null
          services?: number | null
          total_allowed?: number | null
        }
        Relationships: []
      }
      pc_procedure_devices: {
        Row: {
          active_vendors: number | null
          clearances_all: number | null
          clearances_recent: number | null
          family_id: string | null
          fda_name: string | null
          plain_name: string | null
          product_code: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          active_vendors?: number | null
          clearances_all?: number | null
          clearances_recent?: number | null
          family_id?: string | null
          fda_name?: string | null
          plain_name?: string | null
          product_code?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          active_vendors?: number | null
          clearances_all?: number | null
          clearances_recent?: number | null
          family_id?: string | null
          fda_name?: string | null
          plain_name?: string | null
          product_code?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
      pc_procedure_drg: {
        Row: {
          discharges: number | null
          drg: string | null
          drg_desc: string | null
          family_id: string | null
          hospital_medicare_median: number | null
          hospital_medicare_p25: number | null
          hospital_medicare_p75: number | null
          hospitals: number | null
          medicare_pays: number | null
          note: string | null
          patient_other_pays: number | null
          share_of_family: number | null
          spread_note: string | null
          total_payment: number | null
        }
        Insert: {
          discharges?: number | null
          drg?: string | null
          drg_desc?: string | null
          family_id?: string | null
          hospital_medicare_median?: number | null
          hospital_medicare_p25?: number | null
          hospital_medicare_p75?: number | null
          hospitals?: number | null
          medicare_pays?: number | null
          note?: string | null
          patient_other_pays?: number | null
          share_of_family?: number | null
          spread_note?: string | null
          total_payment?: number | null
        }
        Update: {
          discharges?: number | null
          drg?: string | null
          drg_desc?: string | null
          family_id?: string | null
          hospital_medicare_median?: number | null
          hospital_medicare_p25?: number | null
          hospital_medicare_p75?: number | null
          hospitals?: number | null
          medicare_pays?: number | null
          note?: string | null
          patient_other_pays?: number | null
          share_of_family?: number | null
          spread_note?: string | null
          total_payment?: number | null
        }
        Relationships: []
      }
      pc_procedure_outpatient: {
        Row: {
          apc: string | null
          apc_medicare_pays: number | null
          apc_patient_other_pays: number | null
          apc_services: number | null
          apc_total_allowed: number | null
          cpt: string | null
          family_id: string | null
          outpatient_status: string | null
          procedure: string | null
          source: string | null
          source_url: string | null
        }
        Insert: {
          apc?: string | null
          apc_medicare_pays?: number | null
          apc_patient_other_pays?: number | null
          apc_services?: number | null
          apc_total_allowed?: number | null
          cpt?: string | null
          family_id?: string | null
          outpatient_status?: string | null
          procedure?: string | null
          source?: string | null
          source_url?: string | null
        }
        Update: {
          apc?: string | null
          apc_medicare_pays?: number | null
          apc_patient_other_pays?: number | null
          apc_services?: number | null
          apc_total_allowed?: number | null
          cpt?: string | null
          family_id?: string | null
          outpatient_status?: string | null
          procedure?: string | null
          source?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      pc_procedures: {
        Row: {
          data_year: number | null
          description: string | null
          discharges: number | null
          drgs: string | null
          family_id: string
          flagship: string | null
          hospitals: number | null
          medicare_pays: number | null
          name: string | null
          patient_other_pays: number | null
          patient_other_share: number | null
          sort_order: number | null
          supply_medicare_30: number | null
          supply_medicare_40: number | null
          supply_medicare_50: number | null
          supply_note: string | null
          supply_total_30: number | null
          supply_total_40: number | null
          supply_total_50: number | null
          total_payment: number | null
        }
        Insert: {
          data_year?: number | null
          description?: string | null
          discharges?: number | null
          drgs?: string | null
          family_id: string
          flagship?: string | null
          hospitals?: number | null
          medicare_pays?: number | null
          name?: string | null
          patient_other_pays?: number | null
          patient_other_share?: number | null
          sort_order?: number | null
          supply_medicare_30?: number | null
          supply_medicare_40?: number | null
          supply_medicare_50?: number | null
          supply_note?: string | null
          supply_total_30?: number | null
          supply_total_40?: number | null
          supply_total_50?: number | null
          total_payment?: number | null
        }
        Update: {
          data_year?: number | null
          description?: string | null
          discharges?: number | null
          drgs?: string | null
          family_id?: string
          flagship?: string | null
          hospitals?: number | null
          medicare_pays?: number | null
          name?: string | null
          patient_other_pays?: number | null
          patient_other_share?: number | null
          sort_order?: number | null
          supply_medicare_30?: number | null
          supply_medicare_40?: number | null
          supply_medicare_50?: number | null
          supply_note?: string | null
          supply_total_30?: number | null
          supply_total_40?: number | null
          supply_total_50?: number | null
          total_payment?: number | null
        }
        Relationships: []
      }
      pc_product_codes: {
        Row: {
          anatomy: string | null
          clearances: number | null
          device_class: string | null
          fda_definition: string | null
          fda_name: string | null
          kind: string | null
          plain_description: string | null
          plain_name: string | null
          procedures: string | null
          product_code: string
          regulation_number: string | null
          reviewed: boolean
          segment: string | null
        }
        Insert: {
          anatomy?: string | null
          clearances?: number | null
          device_class?: string | null
          fda_definition?: string | null
          fda_name?: string | null
          kind?: string | null
          plain_description?: string | null
          plain_name?: string | null
          procedures?: string | null
          product_code: string
          regulation_number?: string | null
          reviewed?: boolean
          segment?: string | null
        }
        Update: {
          anatomy?: string | null
          clearances?: number | null
          device_class?: string | null
          fda_definition?: string | null
          fda_name?: string | null
          kind?: string | null
          plain_description?: string | null
          plain_name?: string | null
          procedures?: string | null
          product_code?: string
          regulation_number?: string | null
          reviewed?: boolean
          segment?: string | null
        }
        Relationships: []
      }
      pc_recalls: {
        Row: {
          event_id: string | null
          initiated: string | null
          knumbers: string | null
          posted: string | null
          product: string | null
          product_code: string | null
          quantity: string | null
          reason: string | null
          recall_class: string | null
          recall_number: string | null
          recalling_firm: string | null
          root_cause: string | null
          status: string | null
          terminated: string | null
          vendor_basis: string | null
          vendor_id: string | null
        }
        Insert: {
          event_id?: string | null
          initiated?: string | null
          knumbers?: string | null
          posted?: string | null
          product?: string | null
          product_code?: string | null
          quantity?: string | null
          reason?: string | null
          recall_class?: string | null
          recall_number?: string | null
          recalling_firm?: string | null
          root_cause?: string | null
          status?: string | null
          terminated?: string | null
          vendor_basis?: string | null
          vendor_id?: string | null
        }
        Update: {
          event_id?: string | null
          initiated?: string | null
          knumbers?: string | null
          posted?: string | null
          product?: string | null
          product_code?: string | null
          quantity?: string | null
          reason?: string | null
          recall_class?: string | null
          recall_number?: string | null
          recalling_firm?: string | null
          root_cause?: string | null
          status?: string | null
          terminated?: string | null
          vendor_basis?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_supply_evidence: {
        Row: {
          data_years: string | null
          measure: string | null
          procedure: string | null
          result: string | null
          source: string | null
          source_url: string | null
        }
        Insert: {
          data_years?: string | null
          measure?: string | null
          procedure?: string | null
          result?: string | null
          source?: string | null
          source_url?: string | null
        }
        Update: {
          data_years?: string | null
          measure?: string | null
          procedure?: string | null
          result?: string | null
          source?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      pc_vendor_divestitures: {
        Row: {
          buyer: string | null
          decided_before: string | null
          effective: string | null
          note: string | null
          product_codes: string | null
          seller: string | null
          source_url: string | null
        }
        Insert: {
          buyer?: string | null
          decided_before?: string | null
          effective?: string | null
          note?: string | null
          product_codes?: string | null
          seller?: string | null
          source_url?: string | null
        }
        Update: {
          buyer?: string | null
          decided_before?: string | null
          effective?: string | null
          note?: string | null
          product_codes?: string | null
          seller?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      pc_vendor_lineage: {
        Row: {
          note: string | null
          parent: string | null
          relation: string | null
          reviewed: boolean | null
          source_url: string | null
          valid_from: string | null
          valid_to: string | null
          vendor_id: string | null
        }
        Insert: {
          note?: string | null
          parent?: string | null
          relation?: string | null
          reviewed?: boolean | null
          source_url?: string | null
          valid_from?: string | null
          valid_to?: string | null
          vendor_id?: string | null
        }
        Update: {
          note?: string | null
          parent?: string | null
          relation?: string | null
          reviewed?: boolean | null
          source_url?: string | null
          valid_from?: string | null
          valid_to?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_vendor_names: {
        Row: {
          basis: string | null
          raw_name: string | null
          source: string | null
          vendor_id: string | null
        }
        Insert: {
          basis?: string | null
          raw_name?: string | null
          source?: string | null
          vendor_id?: string | null
        }
        Update: {
          basis?: string | null
          raw_name?: string | null
          source?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      pc_vendors: {
        Row: {
          basis: string | null
          clearances: number | null
          current_parent: string | null
          display_name: string | null
          first_clearance_year: number | null
          gudid_brands: number | null
          gudid_ortho_devices: number | null
          last_clearance_year: number | null
          note: string | null
          payment_kind: string | null
          reviewed: boolean | null
          rolls_up_to: string | null
          segment: string | null
          vendor_id: string
        }
        Insert: {
          basis?: string | null
          clearances?: number | null
          current_parent?: string | null
          display_name?: string | null
          first_clearance_year?: number | null
          gudid_brands?: number | null
          gudid_ortho_devices?: number | null
          last_clearance_year?: number | null
          note?: string | null
          payment_kind?: string | null
          reviewed?: boolean | null
          rolls_up_to?: string | null
          segment?: string | null
          vendor_id: string
        }
        Update: {
          basis?: string | null
          clearances?: number | null
          current_parent?: string | null
          display_name?: string | null
          first_clearance_year?: number | null
          gudid_brands?: number | null
          gudid_ortho_devices?: number | null
          last_clearance_year?: number | null
          note?: string | null
          payment_kind?: string | null
          reviewed?: boolean | null
          rolls_up_to?: string | null
          segment?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      pc_add_on_notes: { Args: never; Returns: Json }
      pc_applicant_vendor: { Args: { name: string }; Returns: string }
      pc_asks: { Args: { q: string[] }; Returns: Json }
      pc_batch: { Args: { ks: string[] }; Returns: Json }
      pc_brand_family: { Args: { k: string }; Returns: Json }
      pc_brief: { Args: { k: string }; Returns: Json }
      pc_card: {
        Args: {
          ask: string
          badge: string
          evidence?: string
          finding: string
          key: string
          question: string
          tone: string
          why: string
        }
        Returns: Json
      }
      pc_category: { Args: { code: string }; Returns: Json }
      pc_clean_blanks: { Args: never; Returns: string }
      pc_co: { Args: { n: string }; Returns: string }
      pc_code_procedures: { Args: { code: string }; Returns: Json }
      pc_code_vendors: { Args: { code: string; lim?: number }; Returns: Json }
      pc_compare: { Args: { a: string; b: string }; Returns: Json }
      pc_count: {
        Args: { many: string; n: number; one: string }
        Returns: string
      }
      pc_country: { Args: { c: string }; Returns: string }
      pc_data_end: { Args: never; Returns: string }
      pc_device_add_on: { Args: { k: string }; Returns: Json }
      pc_device_indications: { Args: { k: string }; Returns: Json }
      pc_device_maude: { Args: { k: string }; Returns: Json }
      pc_device_owner: { Args: { k: string }; Returns: Json }
      pc_device_procedures: { Args: { k: string }; Returns: Json }
      pc_device_recalls: { Args: { k: string }; Returns: Json }
      pc_device_supplier: { Args: { k: string }; Returns: Json }
      pc_direct: {
        Args: { k: string }
        Returns: {
          applicant: string
          confidence: string
          decision_year: string
          device_name: string
          kind: string
          list_order: number
          number_as_printed: string
          predicate: string
          product_code: string
          review_source: string
          role: string
          same_code: boolean
          same_company: boolean
        }[]
      }
      pc_fig: { Args: { label: string; v: string }; Returns: Json }
      pc_figs: { Args: { f: Json[] }; Returns: Json }
      pc_lookup: { Args: { max_gen?: number; roots: string[] }; Returns: Json }
      pc_maude_notes: { Args: never; Returns: Json }
      pc_mode: { Args: { m: string }; Returns: string }
      pc_money: { Args: { x: number }; Returns: string }
      pc_num: { Args: { n: number }; Returns: string }
      pc_owner_at: { Args: { d: string; v: string }; Returns: string }
      pc_pay_range: {
        Args: { compact?: boolean; hi: number; lo: number }
        Returns: string
      }
      pc_peers: { Args: { k: string; lim?: number }; Returns: Json }
      pc_primary_lineage: {
        Args: { k: string; max_gen?: number }
        Returns: Json
      }
      pc_procedure: {
        Args: { fid: string; vendors_per_code?: number }
        Returns: Json
      }
      pc_procedure_list: { Args: never; Returns: Json }
      pc_procedure_notes: { Args: never; Returns: Json }
      pc_procedure_worksheet: { Args: never; Returns: Json }
      pc_product_payments: { Args: { k: string }; Returns: Json }
      pc_recall_card_product: {
        Args: { company: string; kn: string }
        Returns: Json
      }
      pc_recall_card_vendor: { Args: { md: string; v: string }; Returns: Json }
      pc_recall_event_rows: {
        Args: { ids: string[]; lim?: number }
        Returns: Json
      }
      pc_refresh_research_scope: { Args: never; Returns: string }
      pc_same_company: {
        Args: {
          a_applicant: string
          a_root: string
          b_applicant: string
          b_root: string
          d: string
        }
        Returns: boolean
      }
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
      pc_short_name: { Args: { n: string }; Returns: string }
      pc_signals: { Args: { k: string }; Returns: Json }
      pc_supplier_notes: { Args: never; Returns: Json }
      pc_usd: { Args: { x: number }; Returns: string }
      pc_vendor_add_on: { Args: { m?: string; v: string }; Returns: Json }
      pc_vendor_brief: { Args: { m?: string; v: string }; Returns: Json }
      pc_vendor_compare: {
        Args: { a: string; b: string; m?: string }
        Returns: Json
      }
      pc_vendor_coverage: { Args: never; Returns: Json }
      pc_vendor_family: {
        Args: { m: string; v: string }
        Returns: {
          display_name: string
          relation: string
          since: string
          source_url: string
          vendor_id: string
        }[]
      }
      pc_vendor_maude: {
        Args: { lim?: number; m?: string; v: string }
        Returns: Json
      }
      pc_vendor_parent: { Args: { v: string }; Returns: string }
      pc_vendor_portfolio: {
        Args: {
          lim?: number
          m?: string
          p_anatomy?: string
          p_code?: string
          p_kind?: string
          v: string
        }
        Returns: Json
      }
      pc_vendor_procedures: { Args: { m?: string; v: string }; Returns: Json }
      pc_vendor_recalls: {
        Args: { lim?: number; m?: string; v: string }
        Returns: Json
      }
      pc_vendor_resolve: { Args: { v: string }; Returns: Json }
      pc_vendor_search: { Args: { lim?: number; q: string }; Returns: Json }
      pc_vendor_signals: { Args: { m?: string; v: string }; Returns: Json }
      pc_vendor_step: { Args: { v: string }; Returns: Json }
      pc_vendor_supplier: { Args: { m?: string; v: string }; Returns: Json }
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
