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
      api_usages: {
        Row: {
          api_type: string
          id: string
          length: number | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          api_type: string
          id?: string
          length?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          api_type?: string
          id?: string
          length?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_feedback: {
        Row: {
          conversation: Json
          created_at: string | null
          id: number
          opinion: string | null
          positive: boolean
        }
        Insert: {
          conversation: Json
          created_at?: string | null
          id?: number
          opinion?: string | null
          positive: boolean
        }
        Update: {
          conversation?: Json
          created_at?: string | null
          id?: number
          opinion?: string | null
          positive?: boolean
        }
        Relationships: []
      }
      conversations: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          created_at: string | null
          id: string
          name: string
          path: string
          size: number | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          path: string
          size?: number | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          path?: string
          size?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      instant_message_app_users: {
        Row: {
          created_at: string | null
          id: string
          line_id: string | null
          pair_code: string | null
          pair_code_expires_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id: string
          line_id?: string | null
          pair_code?: string | null
          pair_code_expires_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          line_id?: string | null
          pair_code?: string | null
          pair_code_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instant_message_app_users_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      message_tags: {
        Row: {
          message_submission_id: number
          tag_id: number
        }
        Insert: {
          message_submission_id: number
          tag_id: number
        }
        Update: {
          message_submission_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_tags_message_submission_id_fkey"
            columns: ["message_submission_id"]
            referencedRelation: "student_message_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      mqtt_connections: {
        Row: {
          created_at: string
          description: string
          dynamic_input: boolean
          id: number
          name: string
          payload: string | null
          receiver: boolean
          topic: string
          uuid: string
        }
        Insert: {
          created_at?: string
          description: string
          dynamic_input?: boolean
          id?: number
          name: string
          payload?: string | null
          receiver?: boolean
          topic: string
          uuid: string
        }
        Update: {
          created_at?: string
          description?: string
          dynamic_input?: boolean
          id?: number
          name?: string
          payload?: string | null
          receiver?: boolean
          topic?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "mqtt_connections_uuid_fkey"
            columns: ["uuid"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      one_time_code_tags: {
        Row: {
          one_time_code_id: string
          tag_id: number
        }
        Insert: {
          one_time_code_id: string
          tag_id: number
        }
        Update: {
          one_time_code_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "one_time_code_tags_one_time_code_id_fkey"
            columns: ["one_time_code_id"]
            referencedRelation: "one_time_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_time_code_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      one_time_codes: {
        Row: {
          code: string
          created_at: string
          expired_at: string
          id: string
          is_valid: boolean
          teacher_profile_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expired_at: string
          id?: string
          is_valid: boolean
          teacher_profile_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expired_at?: string
          id?: string
          is_valid?: boolean
          teacher_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_codes_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          email: string | null
          id: string
          is_teacher_account: boolean
          line_access_token: string | null
          max_temp_account_quota: number
          one_time_code_duration: number
          plan: string
          pro_plan_expiration_date: string | null
          referral_code: string | null
          referral_code_expiration_date: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          email?: string | null
          id: string
          is_teacher_account?: boolean
          line_access_token?: string | null
          max_temp_account_quota?: number
          one_time_code_duration?: number
          plan: string
          pro_plan_expiration_date?: string | null
          referral_code?: string | null
          referral_code_expiration_date?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          is_teacher_account?: boolean
          line_access_token?: string | null
          max_temp_account_quota?: number
          one_time_code_duration?: number
          plan?: string
          pro_plan_expiration_date?: string | null
          referral_code?: string | null
          referral_code_expiration_date?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      referral: {
        Row: {
          id: number
          referee_id: string | null
          referral_code: string | null
          referral_date: string | null
          referrer_id: string | null
        }
        Insert: {
          id?: number
          referee_id?: string | null
          referral_code?: string | null
          referral_date?: string | null
          referrer_id?: string | null
        }
        Update: {
          id?: number
          referee_id?: string | null
          referral_code?: string | null
          referral_date?: string | null
          referrer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_referee_id_fkey"
            columns: ["referee_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_referrer_id_fkey"
            columns: ["referrer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      share_conversations: {
        Row: {
          accessible_id: string
          created_at: string
          id: number
          prompts: Json
          title: string | null
        }
        Insert: {
          accessible_id?: string
          created_at?: string
          id?: number
          prompts: Json
          title?: string | null
        }
        Update: {
          accessible_id?: string
          created_at?: string
          id?: number
          prompts?: Json
          title?: string | null
        }
        Relationships: []
      }
      student_message_submissions: {
        Row: {
          created_at: string
          id: number
          image_file_url: string
          message_content: string
          student_name: string
          teacher_profile_id: string
          temporary_account_profile_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          image_file_url?: string
          message_content?: string
          student_name?: string
          teacher_profile_id: string
          temporary_account_profile_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          image_file_url?: string
          message_content?: string
          student_name?: string
          teacher_profile_id?: string
          temporary_account_profile_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_message_submissions_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_message_submissions_temporary_account_profile_id_fkey"
            columns: ["temporary_account_profile_id"]
            referencedRelation: "temporary_account_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      teacher_prompts: {
        Row: {
          content: string
          created_at: string
          default_mode: string | null
          description: string | null
          first_message_to_gpt: string | null
          id: string
          is_enable: boolean
          model: Json | null
          name: string
          teacher_profile_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          default_mode?: string | null
          description?: string | null
          first_message_to_gpt?: string | null
          id?: string
          is_enable?: boolean
          model?: Json | null
          name?: string
          teacher_profile_id: string
        }
        Update: {
          content?: string
          created_at?: string
          default_mode?: string | null
          description?: string | null
          first_message_to_gpt?: string | null
          id?: string
          is_enable?: boolean
          model?: Json | null
          name?: string
          teacher_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_prompts_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      teacher_settings: {
        Row: {
          allow_student_use_line: boolean
          created_at: string
          id: number
          teacher_profile_id: string
        }
        Insert: {
          allow_student_use_line?: boolean
          created_at?: string
          id?: number
          teacher_profile_id: string
        }
        Update: {
          allow_student_use_line?: boolean
          created_at?: string
          id?: number
          teacher_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_settings_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      teacher_tags: {
        Row: {
          id: number
          tag_id: number
          teacher_profile_id: string
        }
        Insert: {
          id?: number
          tag_id: number
          teacher_profile_id: string
        }
        Update: {
          id?: number
          tag_id?: number
          teacher_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_tags_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      temporary_account_profiles: {
        Row: {
          created_at: string
          id: number
          one_time_code_id: string | null
          profile_id: string
          uniqueId: string
        }
        Insert: {
          created_at?: string
          id?: number
          one_time_code_id?: string | null
          profile_id: string
          uniqueId?: string
        }
        Update: {
          created_at?: string
          id?: number
          one_time_code_id?: string | null
          profile_id?: string
          uniqueId?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_account_profiles_one_time_code_id_fkey"
            columns: ["one_time_code_id"]
            referencedRelation: "one_time_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_account_profiles_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_conversations: {
        Row: {
          conversations: Json
          id: number
          last_updated: string
          uid: string
        }
        Insert: {
          conversations: Json
          id?: number
          last_updated?: string
          uid: string
        }
        Update: {
          conversations?: Json
          id?: number
          last_updated?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_uid_fkey"
            columns: ["uid"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_credits: {
        Row: {
          api_type: string
          balance: number
          id: string
          last_updated: string | null
          user_id: string
        }
        Insert: {
          api_type: string
          balance?: number
          id?: string
          last_updated?: string | null
          user_id: string
        }
        Update: {
          api_type?: string
          balance?: number
          id?: string
          last_updated?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_survey: {
        Row: {
          comments: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          non_login_uid: string | null
          occupation: string | null
          preferred_choice: Json | null
          uid: string | null
          use_case: Json | null
          value_features: Json | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          non_login_uid?: string | null
          occupation?: string | null
          preferred_choice?: Json | null
          uid?: string | null
          use_case?: Json | null
          value_features?: Json | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          non_login_uid?: string | null
          occupation?: string | null
          preferred_choice?: Json | null
          uid?: string | null
          use_case?: Json | null
          value_features?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_survey_uid_fkey"
            columns: ["uid"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_v2_conversations: {
        Row: {
          created_at: string | null
          id: number
          processLock: boolean
          runInProgress: boolean
          threadId: string | null
          title: string | null
          uid: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          processLock?: boolean
          runInProgress?: boolean
          threadId?: string | null
          title?: string | null
          uid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          processLock?: boolean
          runInProgress?: boolean
          threadId?: string | null
          title?: string | null
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_v2_conversations_uid_fkey"
            columns: ["uid"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_otc_quota_and_validity: {
        Args: {
          otc_code: string
        }
        Returns: {
          has_quota: boolean
          code_is_valid: boolean
          code_is_not_expired: boolean
          referrer_is_teacher_account: boolean
          otc_id: string
        }[]
      }
      get_latest_valid_one_time_code_info: {
        Args: {
          teacher_profile_id_param: string
        }
        Returns: {
          code_id: string
          code: string
          code_is_valid: boolean
          code_expired_at: string
          referrer_is_teacher_account: boolean
          referrer_max_temp_account_quota: number
          current_total_referrer_temp_account_number: number
          active_temp_account_profiles: Json
        }[]
      }
      get_referees_profile_by_referrer_id: {
        Args: {
          referrer: string
        }
        Returns: {
          id: string
          plan: string
          stripe_subscription_id: string
          pro_plan_expiration_date: string
          referral_code: string
          referral_code_expiration_date: string
          email: string
          referral_date: string
        }[]
      }
      get_teacher_tag_and_tag_count: {
        Args: {
          teacher_profile_id_param: string
        }
        Returns: {
          name: string
          id: number
          message_count: number
        }[]
      }
      get_temp_account_teacher_profile: {
        Args: {
          p_profile_id: string
        }
        Returns: {
          profile_id: string
          temp_account_id: number
          uniqueid: string
          code: string
          teacher_profile_id: string
          tag_ids: number[]
        }[]
      }
      insert_student_message_with_tags: {
        Args: {
          _message_content: string
          _temporary_account_profile_id: number
          _image_file_url: string
          _teacher_profile_id: string
          _student_name: string
          _tag_ids: number[]
        }
        Returns: {
          message_id: number
          tag_ids: number[]
        }[]
      }
      refresh_referral_codes: {
        Args: {
          payload: Json
        }
        Returns: {
          email: string | null
          id: string
          is_teacher_account: boolean
          line_access_token: string | null
          max_temp_account_quota: number
          one_time_code_duration: number
          plan: string
          pro_plan_expiration_date: string | null
          referral_code: string | null
          referral_code_expiration_date: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }[]
      }
      set_tags_to_one_time_code: {
        Args: {
          one_time_code_id_param: string
          tag_ids_param: number[]
        }
        Returns: boolean
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

