export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: { Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      client_links: {
        Row: {
          client_email: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          project_id: string;
          revoked: boolean;
          token: string;
        };
        ComputedFields: never;
        Insert: {
          client_email?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          project_id: string;
          revoked?: boolean;
          token: string;
        };
        Update: {
          client_email?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          project_id?: string;
          revoked?: boolean;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_links_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      client_submissions: {
        Row: {
          client_link_id: string | null;
          file_name: string | null;
          file_path: string | null;
          id: string;
          note: string | null;
          onboarding_item_id: string;
          response_text: string | null;
          submitted_at: string;
        };
        ComputedFields: never;
        Insert: {
          client_link_id?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          id?: string;
          note?: string | null;
          onboarding_item_id: string;
          response_text?: string | null;
          submitted_at?: string;
        };
        Update: {
          client_link_id?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          id?: string;
          note?: string | null;
          onboarding_item_id?: string;
          response_text?: string | null;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_submissions_client_link_id_fkey";
            columns: ["client_link_id"];
            isOneToOne: false;
            referencedRelation: "client_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_submissions_onboarding_item_id_fkey";
            columns: ["onboarding_item_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_items";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_items: {
        Row: {
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          input_type: string;
          item_type: string;
          priority: string;
          project_id: string;
          required: boolean;
          sort_order: number;
          status: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          input_type: string;
          item_type: string;
          priority?: string;
          project_id: string;
          required?: boolean;
          sort_order?: number;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          input_type?: string;
          item_type?: string;
          priority?: string;
          project_id?: string;
          required?: boolean;
          sort_order?: number;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          workspace_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          client_name: string;
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          project_name: string;
          readiness_percentage: number;
          status: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          client_name: string;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          project_name: string;
          readiness_percentage?: number;
          status?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          client_name?: string;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          project_name?: string;
          readiness_percentage?: number;
          status?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders: {
        Row: {
          channel: string;
          client_link_id: string | null;
          error_message: string | null;
          id: string;
          project_id: string;
          sent_at: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          channel?: string;
          client_link_id?: string | null;
          error_message?: string | null;
          id?: string;
          project_id: string;
          sent_at?: string;
          status: string;
        };
        Update: {
          channel?: string;
          client_link_id?: string | null;
          error_message?: string | null;
          id?: string;
          project_id?: string;
          sent_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_client_link_id_fkey";
            columns: ["client_link_id"];
            isOneToOne: false;
            referencedRelation: "client_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      source_documents: {
        Row: {
          created_at: string;
          extraction_status: string;
          file_name: string | null;
          file_path: string | null;
          file_type: string;
          id: string;
          project_id: string;
          raw_text: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          extraction_status?: string;
          file_name?: string | null;
          file_path?: string | null;
          file_type: string;
          id?: string;
          project_id: string;
          raw_text?: string | null;
        };
        Update: {
          created_at?: string;
          extraction_status?: string;
          file_name?: string | null;
          file_path?: string | null;
          file_type?: string;
          id?: string;
          project_id?: string;
          raw_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "source_documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          id: string;
          plan: string | null;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_workspace_id: { Args: Record<PropertyKey, never>; Returns: string };
      owns_onboarding_item: { Args: { p_item_id: string }; Returns: boolean };
      owns_project: { Args: { p_project_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
