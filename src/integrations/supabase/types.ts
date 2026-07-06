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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      broadcast_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          link_label: string | null
          link_url: string | null
          sender_id: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          sender_id: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          sender_id?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: []
      }
      broadcast_reads: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      career_bonus_payouts: {
        Row: {
          amount: number
          grade_id: string | null
          id: string
          notes: string | null
          paid_at: string
          paid_by: string | null
          period: string
          user_id: string
        }
        Insert: {
          amount: number
          grade_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          period: string
          user_id: string
        }
        Update: {
          amount?: number
          grade_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          period?: string
          user_id?: string
        }
        Relationships: []
      }
      career_grades: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          min_active_referrals: number
          min_downline_size: number
          min_revenue: number
          min_weekly_revenue: number
          monthly_bonus: number
          name: string
          rewards_description: string | null
          updated_at: string
          weekly_bonus: number
          weekly_revenue_percentage: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          min_active_referrals?: number
          min_downline_size?: number
          min_revenue?: number
          min_weekly_revenue?: number
          monthly_bonus?: number
          name: string
          rewards_description?: string | null
          updated_at?: string
          weekly_bonus?: number
          weekly_revenue_percentage?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          min_active_referrals?: number
          min_downline_size?: number
          min_revenue?: number
          min_weekly_revenue?: number
          monthly_bonus?: number
          name?: string
          rewards_description?: string | null
          updated_at?: string
          weekly_bonus?: number
          weekly_revenue_percentage?: number
        }
        Relationships: []
      }
      commerce_orders: {
        Row: {
          client_name: string | null
          client_note: string | null
          client_phone: string | null
          commission_amount: number
          created_at: string
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          id: string
          payment_method: Database["public"]["Enums"]["commerce_payment_method"]
          product_id: string
          proposer_id: string | null
          quantity: number
          relay_point_id: string | null
          shipping_address_id: string | null
          status: Database["public"]["Enums"]["commerce_order_status"]
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          client_note?: string | null
          client_phone?: string | null
          commission_amount?: number
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          payment_method?: Database["public"]["Enums"]["commerce_payment_method"]
          product_id: string
          proposer_id?: string | null
          quantity?: number
          relay_point_id?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["commerce_order_status"]
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          client_note?: string | null
          client_phone?: string | null
          commission_amount?: number
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          payment_method?: Database["public"]["Enums"]["commerce_payment_method"]
          product_id?: string
          proposer_id?: string | null
          quantity?: number
          relay_point_id?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["commerce_order_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "commerce_products"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_products: {
        Row: {
          available_quantity: number | null
          commission_percentage: number
          created_at: string
          created_by: string | null
          currency: string
          description: string
          id: string
          images: Json
          is_active: boolean
          kind: Database["public"]["Enums"]["commerce_product_kind"]
          min_quantity: number
          name: string
          partner_name: string
          price: number
          pv_value: number
          updated_at: string
        }
        Insert: {
          available_quantity?: number | null
          commission_percentage?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          images?: Json
          is_active?: boolean
          kind: Database["public"]["Enums"]["commerce_product_kind"]
          min_quantity?: number
          name: string
          partner_name?: string
          price?: number
          pv_value?: number
          updated_at?: string
        }
        Update: {
          available_quantity?: number | null
          commission_percentage?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          images?: Json
          is_active?: boolean
          kind?: Database["public"]["Enums"]["commerce_product_kind"]
          min_quantity?: number
          name?: string
          partner_name?: string
          price?: number
          pv_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      commission_rates: {
        Row: {
          created_at: string
          id: string
          level: number
          percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          level: number
          order_id: string | null
          source_user_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          order_id?: string | null
          source_user_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          order_id?: string | null
          source_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      community_fund: {
        Row: {
          balance: number
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_fund_transactions: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string
          emergency_id: string | null
          id: string
          reason: string | null
          type: Database["public"]["Enums"]["fund_tx_type"]
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string
          emergency_id?: string | null
          id?: string
          reason?: string | null
          type: Database["public"]["Enums"]["fund_tx_type"]
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string
          emergency_id?: string | null
          id?: string
          reason?: string | null
          type?: Database["public"]["Enums"]["fund_tx_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          banner_url: string | null
          contact_email: string | null
          contact_facebook: string | null
          contact_whatsapp: string | null
          country: string
          created_at: string
          description: string | null
          id: string
          image_url_2: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          sector: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          banner_url?: string | null
          contact_email?: string | null
          contact_facebook?: string | null
          contact_whatsapp?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url_2?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          sector?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          contact_email?: string | null
          contact_facebook?: string | null
          contact_whatsapp?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url_2?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sector?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      custom_order_commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          level_depth: number
          percentage_applied: number
          source_order_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          level_depth: number
          percentage_applied: number
          source_order_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          level_depth?: number
          percentage_applied?: number
          source_order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_order_commissions_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_orders: {
        Row: {
          admin_note: string | null
          calculated_commission: number
          created_at: string
          delivery_address_text: string | null
          delivery_details: Json
          delivery_frequency: string
          delivery_latitude: number
          delivery_longitude: number
          id: string
          product_name: string
          quantity: number
          status: string
          total_amount: number | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          calculated_commission?: number
          created_at?: string
          delivery_address_text?: string | null
          delivery_details?: Json
          delivery_frequency?: string
          delivery_latitude: number
          delivery_longitude: number
          id?: string
          product_name: string
          quantity: number
          status?: string
          total_amount?: number | null
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          calculated_commission?: number
          created_at?: string
          delivery_address_text?: string | null
          delivery_details?: Json
          delivery_frequency?: string
          delivery_latitude?: number
          delivery_longitude?: number
          id?: string
          product_name?: string
          quantity?: number
          status?: string
          total_amount?: number | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergencies: {
        Row: {
          admin_note: string | null
          amount_requested: number | null
          created_at: string
          description: string
          frequency: Database["public"]["Enums"]["emergency_frequency"]
          id: string
          status: Database["public"]["Enums"]["emergency_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_requested?: number | null
          created_at?: string
          description: string
          frequency?: Database["public"]["Enums"]["emergency_frequency"]
          id?: string
          status?: Database["public"]["Enums"]["emergency_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_requested?: number | null
          created_at?: string
          description?: string
          frequency?: Database["public"]["Enums"]["emergency_frequency"]
          id?: string
          status?: Database["public"]["Enums"]["emergency_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_messages: {
        Row: {
          content: string
          created_at: string
          emergency_id: string
          id: string
          is_admin: boolean
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          emergency_id: string
          id?: string
          is_admin?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emergency_id?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_messages_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      mlm_commission_configs: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: string | null
          id: string
          is_active: boolean
          percentage: number
          rule_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria_type?: string
          criteria_value?: string | null
          id?: string
          is_active?: boolean
          percentage?: number
          rule_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: string | null
          id?: string
          is_active?: boolean
          percentage?: number
          rule_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      moisson_community_investments: {
        Row: {
          available_before: number | null
          contract_signed_url: string | null
          id: string
          investment_date: string
          operation_id: string | null
          payment_method: string
          payout_received: number
          project_id: string
          shares_before: number | null
          shares_purchased: number
          total_amount_invested: number
          user_id: string
        }
        Insert: {
          available_before?: number | null
          contract_signed_url?: string | null
          id?: string
          investment_date?: string
          operation_id?: string | null
          payment_method?: string
          payout_received?: number
          project_id: string
          shares_before?: number | null
          shares_purchased: number
          total_amount_invested: number
          user_id: string
        }
        Update: {
          available_before?: number | null
          contract_signed_url?: string | null
          id?: string
          investment_date?: string
          operation_id?: string | null
          payment_method?: string
          payout_received?: number
          project_id?: string
          shares_before?: number | null
          shares_purchased?: number
          total_amount_invested?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moisson_community_investments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "moisson_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      moisson_projects: {
        Row: {
          category: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string
          end_date: string | null
          estimated_roi: number
          gallery_images: Json
          global_target: number
          id: string
          share_price: number
          shares_sold: number
          start_date: string | null
          status: string
          title: string
          total_shares: number
          update_feed: Json
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string | null
          estimated_roi?: number
          gallery_images?: Json
          global_target?: number
          id?: string
          share_price?: number
          shares_sold?: number
          start_date?: string | null
          status?: string
          title: string
          total_shares?: number
          update_feed?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string | null
          estimated_roi?: number
          gallery_images?: Json
          global_target?: number
          id?: string
          share_price?: number
          shares_sold?: number
          start_date?: string | null
          status?: string
          title?: string
          total_shares?: number
          update_feed?: Json
          updated_at?: string
        }
        Relationships: []
      }
      network: {
        Row: {
          created_at: string
          id: string
          level: number
          position: string | null
          sponsor_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          position?: string | null
          sponsor_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          position?: string | null
          sponsor_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_ratings: {
        Row: {
          comment: string | null
          created_at: string
          delivery_rating: number
          id: string
          order_id: string
          product_rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          delivery_rating?: number
          id?: string
          order_id: string
          product_rating?: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          delivery_rating?: number
          id?: string
          order_id?: string
          product_rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          created_at: string
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          id: string
          product_id: string
          quantity: number
          relay_point_id: string | null
          shipping_address_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          product_id: string
          quantity?: number
          relay_point_id?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          product_id?: string
          quantity?: number
          relay_point_id?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_commission_rates: {
        Row: {
          created_at: string
          id: string
          level: number
          percentage: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          percentage?: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          percentage?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_commission_rates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          type: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          type: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          type?: string
          value?: string
        }
        Relationships: []
      }
      product_submissions: {
        Row: {
          additional_info: Json
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          images: string[]
          quantity: number
          regular_price: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          unit_type: string
          updated_at: string
          user_id: string
          wholesale_price: number
        }
        Insert: {
          additional_info?: Json
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          quantity?: number
          regular_price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          unit_type?: string
          updated_at?: string
          user_id: string
          wholesale_price?: number
        }
        Update: {
          additional_info?: Json
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          quantity?: number
          regular_price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          unit_type?: string
          updated_at?: string
          user_id?: string
          wholesale_price?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          activates_system: boolean
          company_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean
          is_physical: boolean
          level1_commission_percentage: number
          name: string
          price: number
          profit_amount: number
          sector: string | null
          updated_at: string
        }
        Insert: {
          activates_system?: boolean
          company_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          is_physical?: boolean
          level1_commission_percentage?: number
          name: string
          price?: number
          profit_amount?: number
          sector?: string | null
          updated_at?: string
        }
        Update: {
          activates_system?: boolean
          company_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          is_physical?: boolean
          level1_commission_percentage?: number
          name?: string
          price?: number
          profit_amount?: number
          sector?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          career_level: Database["public"]["Enums"]["career_level"]
          cgu_accepted: boolean
          cgu_accepted_at: string | null
          contract_signed_at: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          id_moissonneur: string | null
          id_photo_back: string | null
          id_photo_front: string | null
          identity_reject_reason: string | null
          identity_submitted_at: string | null
          identity_verified: boolean
          identity_verified_at: string | null
          identity_verified_by: string | null
          is_pro_visible: boolean
          is_system_active: boolean
          last_name: string
          phone: string | null
          referral_code: string
          referred_by: string | null
          signature_url: string | null
          updated_at: string
          verification_token: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          career_level?: Database["public"]["Enums"]["career_level"]
          cgu_accepted?: boolean
          cgu_accepted_at?: string | null
          contract_signed_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id: string
          id_moissonneur?: string | null
          id_photo_back?: string | null
          id_photo_front?: string | null
          identity_reject_reason?: string | null
          identity_submitted_at?: string | null
          identity_verified?: boolean
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          is_pro_visible?: boolean
          is_system_active?: boolean
          last_name?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          signature_url?: string | null
          updated_at?: string
          verification_token?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          career_level?: Database["public"]["Enums"]["career_level"]
          cgu_accepted?: boolean
          cgu_accepted_at?: string | null
          contract_signed_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          id_moissonneur?: string | null
          id_photo_back?: string | null
          id_photo_front?: string | null
          identity_reject_reason?: string | null
          identity_submitted_at?: string | null
          identity_verified?: boolean
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          is_pro_visible?: boolean
          is_system_active?: boolean
          last_name?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          signature_url?: string | null
          updated_at?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_points: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          phone: string | null
          responsible_name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          phone?: string | null
          responsible_name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          phone?: string | null
          responsible_name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          city: string | null
          country: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          city?: string | null
          country?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          city?: string | null
          country?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          address_line: string
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          phone: string
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          country: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          phone: string
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_career_overrides: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          custom_monthly_bonus: number | null
          custom_weekly_bonus: number | null
          grade_id: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          custom_monthly_bonus?: number | null
          custom_weekly_bonus?: number | null
          grade_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          custom_monthly_bonus?: number | null
          custom_weekly_bonus?: number | null
          grade_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_career_overrides_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "career_grades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          contact: string | null
          created_at: string
          id: string
          notes: string | null
          operator: string | null
          recipient_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string | null
          transaction_ref: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          withdrawal_address: string | null
        }
        Insert: {
          amount: number
          contact?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          operator?: string | null
          recipient_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string | null
          transaction_ref?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          withdrawal_address?: string | null
        }
        Update: {
          amount?: number
          contact?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          operator?: string | null
          recipient_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string | null
          transaction_ref?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
          withdrawal_address?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_cgu: { Args: never; Returns: boolean }
      add_project_update: {
        Args: {
          _content: string
          _image_url?: string
          _project_id: string
          _title: string
        }
        Returns: undefined
      }
      admin_delete_commission_config: {
        Args: { _id: string }
        Returns: undefined
      }
      admin_delete_grade: { Args: { _id: string }; Returns: undefined }
      admin_list_custom_orders: {
        Args: never
        Returns: {
          admin_note: string
          calculated_commission: number
          country: string
          created_at: string
          delivery_address_text: string
          delivery_details: Json
          delivery_frequency: string
          delivery_latitude: number
          delivery_longitude: number
          first_name: string
          id: string
          last_name: string
          phone: string
          product_name: string
          quantity: number
          referral_code: string
          status: string
          total_amount: number
          unit_price: number
          user_id: string
        }[]
      }
      admin_list_identity_submissions: {
        Args: never
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id_moissonneur: string
          id_photo_back: string
          id_photo_front: string
          identity_submitted_at: string
          identity_verified: boolean
          identity_verified_at: string
          phone: string
          referral_code: string
          user_id: string
        }[]
      }
      admin_list_submissions: {
        Args: { _status?: string }
        Returns: {
          additional_info: Json
          admin_notes: string
          category: string
          country: string
          created_at: string
          description: string
          first_name: string
          id: string
          images: string[]
          last_name: string
          phone: string
          quantity: number
          referral_code: string
          regular_price: number
          status: string
          title: string
          unit_type: string
          updated_at: string
          user_id: string
          wholesale_price: number
        }[]
      }
      admin_pay_career_bonus: {
        Args: {
          _amount: number
          _notes?: string
          _period: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_identity_verified: {
        Args: { _reason?: string; _user_id: string; _verified: boolean }
        Returns: undefined
      }
      admin_set_user_grade: {
        Args: {
          _grade_id: string
          _monthly: number
          _notes: string
          _user_id: string
          _weekly: number
        }
        Returns: undefined
      }
      admin_update_custom_order_status: {
        Args: { _id: string; _note?: string; _status: string }
        Returns: undefined
      }
      admin_update_submission_status: {
        Args: { _id: string; _notes?: string; _status: string }
        Returns: undefined
      }
      admin_upsert_commission_config: {
        Args: {
          _criteria_type: string
          _criteria_value: string
          _id: string
          _is_active: boolean
          _percentage: number
          _rule_name: string
        }
        Returns: string
      }
      admin_upsert_grade: {
        Args: {
          _description: string
          _display_order: number
          _id: string
          _is_active: boolean
          _min_active_referrals: number
          _min_downline_size: number
          _min_revenue: number
          _monthly_bonus: number
          _name: string
          _weekly_bonus: number
        }
        Returns: string
      }
      admin_upsert_grade_v2: {
        Args: {
          _description: string
          _display_order: number
          _id: string
          _is_active: boolean
          _min_active_referrals: number
          _min_downline_size: number
          _min_revenue: number
          _min_weekly_revenue: number
          _monthly_bonus: number
          _name: string
          _rewards_description: string
          _weekly_bonus: number
          _weekly_revenue_percentage: number
        }
        Returns: string
      }
      assign_role: {
        Args: {
          _city?: string
          _country?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      auto_assign_user_grade: { Args: { _user_id: string }; Returns: string }
      compute_custom_order_commission: {
        Args: { _order_id: string }
        Returns: number
      }
      contribute_to_fund: {
        Args: { _amount: number }
        Returns: {
          new_fund_balance: number
          new_wallet_balance: number
        }[]
      }
      count_unread_broadcasts: { Args: never; Returns: number }
      create_broadcast: {
        Args: {
          _content: string
          _image_url?: string
          _link_label?: string
          _link_url?: string
          _target_user_id?: string
          _title: string
        }
        Returns: string
      }
      distribute_custom_order_commissions: {
        Args: { _order_id: string }
        Returns: undefined
      }
      distribute_dividends: {
        Args: { _note?: string; _project_id: string; _total_revenue: number }
        Returns: {
          investors_paid: number
          total_paid: number
        }[]
      }
      find_profile_by_code: {
        Args: { _code: string }
        Returns: {
          first_name: string
          id: string
          last_name: string
          referral_code: string
        }[]
      }
      get_downline: {
        Args: { _user_id: string }
        Returns: {
          member_id: string
          member_level: number
          member_position: string
          member_sponsor_id: string
          tree_depth: number
        }[]
      }
      get_email_by_referral_code: { Args: { _code: string }; Returns: string }
      get_public_profiles: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          career_level: Database["public"]["Enums"]["career_level"]
          country: string
          first_name: string
          id: string
          is_system_active: boolean
          last_name: string
          referral_code: string
        }[]
      }
      has_geo_scope: {
        Args: { _city: string; _country: string; _uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invest_in_project: {
        Args: { _payment_method?: string; _project_id: string; _shares: number }
        Returns: {
          investment_id: string
          new_wallet_balance: number
          operation_id: string
          shares_sold: number
        }[]
      }
      list_emergencies_for_admin: {
        Args: never
        Returns: {
          admin_note: string
          amount_requested: number
          created_at: string
          description: string
          first_name: string
          frequency: Database["public"]["Enums"]["emergency_frequency"]
          id: string
          last_name: string
          referral_code: string
          status: Database["public"]["Enums"]["emergency_status"]
          title: string
          user_id: string
        }[]
      }
      list_my_broadcasts: {
        Args: never
        Returns: {
          content: string
          created_at: string
          id: string
          image_url: string
          is_read: boolean
          link_label: string
          link_url: string
          target_user_id: string
          title: string
        }[]
      }
      list_my_referrals: {
        Args: never
        Returns: {
          branch_position: string
          career_level: Database["public"]["Enums"]["career_level"]
          country: string
          first_name: string
          is_system_active: boolean
          joined_at: string
          last_name: string
          member_id: string
          phone: string
          referral_code: string
        }[]
      }
      list_my_submissions: {
        Args: never
        Returns: {
          additional_info: Json
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          images: string[]
          quantity: number
          regular_price: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          unit_type: string
          updated_at: string
          user_id: string
          wholesale_price: number
        }[]
        SetofOptions: {
          from: "*"
          to: "product_submissions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_pros_directory: {
        Args: never
        Returns: {
          avatar_url: string
          career_level: Database["public"]["Enums"]["career_level"]
          country: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          referral_code: string
        }[]
      }
      list_relay_points: {
        Args: { _city?: string; _country?: string }
        Returns: {
          address: string
          city: string
          country: string
          id: string
          is_active: boolean
          name: string
          type: string
        }[]
      }
      list_role_assignments: {
        Args: never
        Returns: {
          assigned_at: string
          city: string
          country: string
          first_name: string
          id: string
          last_name: string
          referral_code: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      list_users_for_career: {
        Args: never
        Returns: {
          active_referrals: number
          country: string
          downline_size: number
          first_name: string
          grade_id: string
          grade_name: string
          last_name: string
          monthly_bonus: number
          referral_code: string
          total_revenue: number
          user_id: string
          weekly_bonus: number
        }[]
      }
      list_users_for_staff: {
        Args: { _country?: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_system_active: boolean
          last_name: string
          phone: string
          referral_code: string
        }[]
      }
      log_admin_event: {
        Args: {
          _action: string
          _metadata?: Json
          _target_id?: string
          _target_type?: string
          _user_agent?: string
        }
        Returns: string
      }
      mark_broadcast_read: { Args: { _message_id: string }; Returns: undefined }
      move_referral_position: {
        Args: { _member_id: string; _new_position: string }
        Returns: undefined
      }
      pay_weekly_revenue_bonuses: {
        Args: never
        Returns: {
          total_paid: number
          users_paid: number
        }[]
      }
      purchase_commerce_product: {
        Args: {
          _client_name?: string
          _client_note?: string
          _client_phone?: string
          _payment_method: Database["public"]["Enums"]["commerce_payment_method"]
          _product_id: string
          _proposer_id?: string
          _quantity: number
          _shipping_address_id?: string
        }
        Returns: {
          message: string
          new_balance: number
          order_id: string
        }[]
      }
      purchase_pack_product: {
        Args: { _product_id: string; _shipping_address_id?: string }
        Returns: {
          message: string
          new_balance: number
          order_id: string
        }[]
      }
      recalc_all_grades: { Args: never; Returns: number }
      recalc_my_grade: { Args: never; Returns: string }
      revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      set_account_status: {
        Args: {
          _status: Database["public"]["Enums"]["account_status"]
          _user_id: string
        }
        Returns: undefined
      }
      transfer_to_user: {
        Args: { _amount: number; _note?: string; _recipient_code: string }
        Returns: {
          new_balance: number
          recipient_name: string
        }[]
      }
      update_delivery_status: {
        Args: {
          _kind: string
          _order_id: string
          _status: Database["public"]["Enums"]["delivery_status"]
        }
        Returns: undefined
      }
      verify_investment_document: {
        Args: { _operation_id: string }
        Returns: {
          available_before: number
          id_moissonneur: string
          investment_date: string
          investment_id: string
          operation_id: string
          percentage_acquired: number
          project_category: string
          project_id: string
          project_title: string
          shares_before: number
          shares_purchased: number
          total_amount_invested: number
          total_shares: number
          user_email: string
          user_id: string
          user_name: string
          user_phone: string
          user_referral_code: string
        }[]
      }
      verify_member_token: {
        Args: { _token: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string
          career_level: Database["public"]["Enums"]["career_level"]
          country: string
          first_name: string
          id_moissonneur: string
          is_system_active: boolean
          last_name: string
          member_since: string
        }[]
      }
      withdraw_from_fund: {
        Args: { _amount: number; _emergency_id?: string; _reason: string }
        Returns: {
          new_fund_balance: number
        }[]
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "paused" | "blocked"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "pack_manager"
        | "financier"
        | "partner_manager"
        | "communication"
        | "zone_harvester"
        | "city_harvester"
        | "country_harvester"
        | "emergency_admin"
        | "hr_manager"
        | "delivery_manager"
        | "career_manager"
        | "identity_verifier"
        | "title_verifier"
        | "grenier_manager"
        | "custom_orders_manager"
        | "submissions_manager"
      career_level:
        | "semeur"
        | "cultivateur"
        | "jardinier"
        | "recolteur"
        | "fermier"
        | "maitre_fermier"
        | "intendant"
        | "sage_moissonneur"
        | "grand_moissonneur"
        | "guide_moissonneur"
      commerce_order_status:
        | "pending"
        | "paid"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      commerce_payment_method: "wallet" | "cash_on_delivery"
      commerce_product_kind: "wholesale" | "distribution"
      delivery_status:
        | "en_preparation"
        | "en_route_relais"
        | "disponible_au_relais"
        | "recupere"
      emergency_frequency:
        | "ponctuelle"
        | "recurrente"
        | "urgente_critique"
        | "quotidienne"
        | "hebdomadaire"
      emergency_status: "open" | "in_progress" | "resolved" | "rejected"
      fund_tx_type: "contribution" | "withdrawal"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      transaction_status: "pending" | "approved" | "rejected"
      transaction_type:
        | "recharge"
        | "retrait"
        | "achat"
        | "commission"
        | "transfert"
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
      account_status: ["active", "suspended", "paused", "blocked"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "pack_manager",
        "financier",
        "partner_manager",
        "communication",
        "zone_harvester",
        "city_harvester",
        "country_harvester",
        "emergency_admin",
        "hr_manager",
        "delivery_manager",
        "career_manager",
        "identity_verifier",
        "title_verifier",
        "grenier_manager",
        "custom_orders_manager",
        "submissions_manager",
      ],
      career_level: [
        "semeur",
        "cultivateur",
        "jardinier",
        "recolteur",
        "fermier",
        "maitre_fermier",
        "intendant",
        "sage_moissonneur",
        "grand_moissonneur",
        "guide_moissonneur",
      ],
      commerce_order_status: [
        "pending",
        "paid",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      commerce_payment_method: ["wallet", "cash_on_delivery"],
      commerce_product_kind: ["wholesale", "distribution"],
      delivery_status: [
        "en_preparation",
        "en_route_relais",
        "disponible_au_relais",
        "recupere",
      ],
      emergency_frequency: [
        "ponctuelle",
        "recurrente",
        "urgente_critique",
        "quotidienne",
        "hebdomadaire",
      ],
      emergency_status: ["open", "in_progress", "resolved", "rejected"],
      fund_tx_type: ["contribution", "withdrawal"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      transaction_status: ["pending", "approved", "rejected"],
      transaction_type: [
        "recharge",
        "retrait",
        "achat",
        "commission",
        "transfert",
      ],
    },
  },
} as const
