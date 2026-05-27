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
      commerce_orders: {
        Row: {
          client_name: string | null
          client_note: string | null
          client_phone: string | null
          commission_amount: number
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["commerce_payment_method"]
          product_id: string
          proposer_id: string | null
          quantity: number
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
          id?: string
          payment_method?: Database["public"]["Enums"]["commerce_payment_method"]
          product_id: string
          proposer_id?: string | null
          quantity?: number
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
          id?: string
          payment_method?: Database["public"]["Enums"]["commerce_payment_method"]
          product_id?: string
          proposer_id?: string | null
          quantity?: number
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
          id: string
          product_id: string
          quantity: number
          shipping_address_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
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
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_pro_visible: boolean
          is_system_active: boolean
          last_name: string
          phone: string | null
          referral_code: string
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          career_level?: Database["public"]["Enums"]["career_level"]
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id: string
          is_pro_visible?: boolean
          is_system_active?: boolean
          last_name?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          career_level?: Database["public"]["Enums"]["career_level"]
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_pro_visible?: boolean
          is_system_active?: boolean
          last_name?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
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
      contribute_to_fund: {
        Args: { _amount: number }
        Returns: {
          new_fund_balance: number
          new_wallet_balance: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      move_referral_position: {
        Args: { _member_id: string; _new_position: string }
        Returns: undefined
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
      transfer_to_user: {
        Args: { _amount: number; _note?: string; _recipient_code: string }
        Returns: {
          new_balance: number
          recipient_name: string
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
