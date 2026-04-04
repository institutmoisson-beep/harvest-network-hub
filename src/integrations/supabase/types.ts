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
          name: string
          price: number
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
          name: string
          price?: number
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
          name?: string
          price?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "paused"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "pack_manager"
        | "financier"
        | "partner_manager"
        | "communication"
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
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      transaction_status: "pending" | "approved" | "rejected"
      transaction_type: "recharge" | "retrait" | "achat" | "commission"
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
      account_status: ["active", "suspended", "paused"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "pack_manager",
        "financier",
        "partner_manager",
        "communication",
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
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      transaction_status: ["pending", "approved", "rejected"],
      transaction_type: ["recharge", "retrait", "achat", "commission"],
    },
  },
} as const
