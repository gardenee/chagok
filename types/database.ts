export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Views: Record<string, never>;
    Tables: {
      couples: {
        Row: {
          id: string;
          book_name: string;
          invite_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_name?: string;
          invite_code: string;
          created_at?: string;
        };
        Update: {
          book_name?: string;
          invite_code?: string;
        };
        Relationships: never[];
      };
      users: {
        Row: {
          id: string;
          couple_id: string | null;
          nickname: string;
          avatar_url: string | null;
          expo_push_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          couple_id?: string | null;
          nickname: string;
          avatar_url?: string | null;
          expo_push_token?: string | null;
          created_at?: string;
        };
        Update: {
          couple_id?: string | null;
          nickname?: string;
          avatar_url?: string | null;
          expo_push_token?: string | null;
        };
        Relationships: never[];
      };
      categories: {
        Row: {
          id: string;
          couple_id: string;
          name: string;
          icon: string;
          color: string;
          budget_amount: number;
          sort_order: number;
          type: 'expense' | 'income';
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          name: string;
          icon?: string;
          color?: string;
          budget_amount?: number;
          sort_order?: number;
          type?: 'expense' | 'income';
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          budget_amount?: number;
          sort_order?: number;
          type?: 'expense' | 'income';
        };
        Relationships: never[];
      };
      payment_methods: {
        Row: {
          id: string;
          couple_id: string;
          name: string;
          type:
            | 'credit_card'
            | 'debit_card'
            | 'transit'
            | 'welfare'
            | 'points'
            | 'prepaid'
            | 'other';
          icon: string;
          color: string;
          limit: number | null;
          card_company: string | null;
          billing_day: number | null;
          annual_fee: number | null;
          linked_asset_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          name: string;
          type?:
            | 'credit_card'
            | 'debit_card'
            | 'transit'
            | 'welfare'
            | 'points'
            | 'prepaid'
            | 'other';
          icon?: string;
          color?: string;
          limit?: number | null;
          card_company?: string | null;
          billing_day?: number | null;
          annual_fee?: number | null;
          linked_asset_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          type?:
            | 'credit_card'
            | 'debit_card'
            | 'transit'
            | 'welfare'
            | 'points'
            | 'prepaid'
            | 'other';
          icon?: string;
          color?: string;
          limit?: number | null;
          card_company?: string | null;
          billing_day?: number | null;
          annual_fee?: number | null;
          linked_asset_id?: string | null;
          sort_order?: number;
        };
        Relationships: never[];
      };
      transactions: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          category_id: string | null;
          payment_method_id: string | null;
          asset_id: string | null;
          amount: number;
          type: 'expense' | 'income';
          tag: 'me' | 'partner' | 'together';
          memo: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          category_id?: string | null;
          payment_method_id?: string | null;
          asset_id?: string | null;
          amount: number;
          type: 'expense' | 'income';
          tag: 'me' | 'partner' | 'together';
          memo?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          category_id?: string | null;
          payment_method_id?: string | null;
          asset_id?: string | null;
          amount?: number;
          type?: 'expense' | 'income';
          tag?: 'me' | 'partner' | 'together';
          memo?: string | null;
          date?: string;
        };
        Relationships: never[];
      };
      comments: {
        Row: {
          id: string;
          transaction_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: never[];
      };
      schedules: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          title: string;
          date: string;
          start_time: string | null;
          tag: 'me' | 'partner' | 'together';
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          title: string;
          date: string;
          start_time?: string | null;
          tag: 'me' | 'partner' | 'together';
          created_at?: string;
        };
        Update: {
          title?: string;
          date?: string;
          start_time?: string | null;
          tag?: 'me' | 'partner' | 'together';
        };
        Relationships: never[];
      };
      fixed_expenses: {
        Row: {
          id: string;
          couple_id: string;
          category_id: string | null;
          name: string;
          amount: number;
          due_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          category_id?: string | null;
          name: string;
          amount: number;
          due_day: number;
          created_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          amount?: number;
          due_day?: number;
        };
        Relationships: never[];
      };
      assets: {
        Row: {
          id: string;
          couple_id: string;
          name: string;
          amount: number | null;
          type: string;
          icon: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          name: string;
          amount?: number | null;
          type?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          amount?: number | null;
          type?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
        };
        Relationships: never[];
      };
      holidays: {
        Row: {
          date: string;
          name: string;
          is_substitute: boolean;
        };
        Insert: {
          date: string;
          name: string;
          is_substitute?: boolean;
        };
        Update: {
          name?: string;
          is_substitute?: boolean;
        };
        Relationships: never[];
      };
    };
    Functions: {
      create_couple: {
        Args: { book_name: string; invite_code: string };
        Returns: string;
      };
      join_couple: {
        Args: { invite_code: string };
        Returns: string;
      };
      get_my_couple_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}

// 편의 타입 alias
export type Couple = Database['public']['Tables']['couples']['Row'];
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type FixedExpense =
  Database['public']['Tables']['fixed_expenses']['Row'];
export type Asset = Database['public']['Tables']['assets']['Row'];
export type PaymentMethod =
  Database['public']['Tables']['payment_methods']['Row'];
export type Holiday = Database['public']['Tables']['holidays']['Row'];

export type TransactionType = Transaction['type'];
export type Tag = Transaction['tag'];
export type CategoryType = 'expense' | 'income';
