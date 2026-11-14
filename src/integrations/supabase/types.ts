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
      contributions: {
        Row: {
          amount: number
          created_at: string
          guest_email: string
          guest_name: string
          id: string
          item_id: string
          message: string
          paid_at: string | null
          provider_order_id: string | null
          provider_payment_id: string | null
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          wedding_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          guest_email?: string
          guest_name: string
          id?: string
          item_id: string
          message?: string
          paid_at?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          wedding_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          guest_email?: string
          guest_name?: string
          id?: string
          item_id?: string
          message?: string
          paid_at?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          archived: boolean
          category: string
          contributors: number
          created_at: string
          description: string
          id: string
          image_url: string
          kind: string
          raised: number
          target: number
          title: string
          wedding_id: string
        }
        Insert: {
          archived?: boolean
          category?: string
          contributors?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          kind?: string
          raised?: number
          target: number
          title: string
          wedding_id: string
        }
        Update: {
          archived?: boolean
          category?: string
          contributors?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          kind?: string
          raised?: number
          target?: number
          title?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          applied_amount: number
          completed_at: string | null
          contribution_id: string
          created_at: string
          id: string
          provider_refund_id: string | null
          reason: string
          requested_by: string
          status: string
          wedding_id: string
        }
        Insert: {
          amount: number
          applied_amount?: number
          completed_at?: string | null
          contribution_id: string
          created_at?: string
          id?: string
          provider_refund_id?: string | null
          reason: string
          requested_by: string
          status?: string
          wedding_id: string
        }
        Update: {
          amount?: number
          applied_amount?: number
          completed_at?: string | null
          contribution_id?: string
          created_at?: string
          id?: string
          provider_refund_id?: string | null
          reason?: string
          requested_by?: string
          status?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_drafts: {
        Row: {
          payload: Json
          updated_at: string
          wedding_id: string
        }
        Insert: {
          payload: Json
          updated_at?: string
          wedding_id: string
        }
        Update: {
          payload?: Json
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_drafts_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          cover_url: string
          created_at: string
          id: string
          names: string
          owner_id: string
          place: string
          published: boolean
          slug: string
          story: string
          wedding_date: string
        }
        Insert: {
          cover_url?: string
          created_at?: string
          id?: string
          names: string
          owner_id?: string
          place?: string
          published?: boolean
          slug: string
          story?: string
          wedding_date?: string
        }
        Update: {
          cover_url?: string
          created_at?: string
          id?: string
          names?: string
          owner_id?: string
          place?: string
          published?: boolean
          slug?: string
          story?: string
          wedding_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_contribution: {
        Args: {
          _contribution_id: string
          _note: string
          _payment_id: string
          _reviewer_id: string
        }
        Returns: string
      }
      begin_refund: {
        Args: {
          _amount: number
          _contribution_id: string
          _reason: string
          _requested_by: string
        }
        Returns: string
      }
      finish_refund: {
        Args: {
          _provider_refund_id: string
          _refund_id: string
          _status: string
        }
        Returns: string
      }
      mark_contribution_paid: {
        Args: { _order_id: string; _payment_id: string }
        Returns: string
      }
      publish_wedding_draft: {
        Args: { _wedding_id: string }
        Returns: undefined
      }
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
