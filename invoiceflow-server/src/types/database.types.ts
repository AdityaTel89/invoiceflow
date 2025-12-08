export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          business_name: string
          gstin: string | null
          pan: string | null
          address: string | null
          phone: string | null
          state_code: string | null
          state_name: string | null
          logo: string | null
          website: string | null
          annual_turnover: number | null
          linked_account_id: string | null
          kyc_status: string
          kyc_submitted_at: string | null
          kyc_verified_at: string | null
          kyc_rejection_reason: string | null
          commission_rate: number
          settlement_cycle: string
          role: string
          bank_account_last4: string | null
          bank_ifsc: string | null
          bank_account_holder_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          gstin: string | null
          pan: string | null
          address: string | null
          shipping_address: string | null
          state_code: string | null
          state_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string
          invoice_number: string
          invoice_date: string | null
          due_date: string | null
          supply_date: string | null
          place_of_supply: string | null
          is_reverse_charge: boolean
          subtotal: number
          cgst_amount: number
          sgst_amount: number
          igst_amount: number
          cess_amount: number
          total_amount: number
          round_off: number
          amount_in_words: string | null
          terms_conditions: string | null
          status: string
          paid_date: string | null
          irn: string | null
          irn_ack_no: string | null
          irn_ack_date: string | null
          irn_qr_code: string | null
          eway_bill_no: string | null
          eway_valid_from: string | null
          eway_valid_to: string | null
          vehicle_no: string | null
          transporter_id: string | null
          pdf_url: string | null
          pdf_public_id: string | null
          pdf_generated_at: string | null
          razorpay_payment_link_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          payment_link_url: string | null
          payment_link_created_at: string | null
          payment_method: string | null
          offline_payment_reference: string | null
          offline_payment_date: string | null
          offline_payment_notes: string | null
          email_sent: boolean
          email_sent_at: string | null
          last_reminder_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          line_number: number
          description: string
          quantity: number
          rate: number
          unit: string
          discount: number
          taxable_value: number
          gst_rate: number
          cgst_amount: number
          sgst_amount: number
          igst_amount: number
          cess_amount: number
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoice_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>
      }
      linked_account_documents: {
        Row: {
          id: string
          user_id: string
          document_type: string
          file_url: string
          file_public_id: string | null
          original_filename: string | null
          file_size_bytes: number | null
          verification_status: string
          verification_notes: string | null
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['linked_account_documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['linked_account_documents']['Insert']>
      }
      settlements: {
        Row: {
          id: string
          invoice_id: string
          user_id: string
          invoice_amount: number
          platform_commission: number
          razorpay_fees: number
          gst_on_fees: number
          net_amount: number
          transfer_id: string | null
          razorpay_payment_id: string | null
          settlement_status: string
          settlement_utr: string | null
          failure_reason: string | null
          initiated_at: string | null
          settled_at: string | null
          reversed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['settlements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['settlements']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          ip_address: string | null
          user_agent: string | null
          request_data: Json | null
          response_data: Json | null
          status: string | null
          error_message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string
          action: string
          attempt_count: number
          window_start: string
          last_attempt: string
        }
        Insert: Omit<Database['public']['Tables']['rate_limits']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['rate_limits']['Insert']>
      }
      invoice_counters: {
        Row: {
          user_id: string
          year: number
          counter: number
          updated_at: string
        }
        Insert: Database['public']['Tables']['invoice_counters']['Row']
        Update: Partial<Database['public']['Tables']['invoice_counters']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_attempts: number
          p_window_hours: number
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          p_action: string
          p_entity_type?: string
          p_entity_id?: string
          p_request_data?: Json
          p_response_data?: Json
          p_status?: string
        }
        Returns: string
      }
      is_admin: {
        Args: {}
        Returns: boolean
      }
      calculate_settlement_amount: {
        Args: {
          p_invoice_amount: number
          p_commission_rate: number
        }
        Returns: {
          platform_commission: number
          razorpay_fees: number
          gst_on_fees: number
          net_amount: number
        }[]
      }
      get_next_invoice_number: {
        Args: {
          p_user_id: string
          p_year: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
