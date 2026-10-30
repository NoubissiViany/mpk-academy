export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
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
      assessment_answers: {
        Row: {
          answer: string;
          answered_at: string;
          assessment_id: string;
          id: number;
          is_correct: boolean | null;
          question_id: string;
          sequence: number;
          user_id: string;
        };
        Insert: {
          answer: string;
          answered_at?: string;
          assessment_id: string;
          id?: never;
          is_correct?: boolean | null;
          question_id: string;
          sequence: number;
          user_id: string;
        };
        Update: {
          answer?: string;
          answered_at?: string;
          assessment_id?: string;
          id?: never;
          is_correct?: boolean | null;
          question_id?: string;
          sequence?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_answers_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_answers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_results: {
        Row: {
          algorithm_version: string;
          assessed_item_count: number | null;
          language_foundation: number | null;
          assessment_id: string;
          competency_scores: Json;
          created_at: string;
          level: string | null;
          priority: string | null;
          recommended_module_id: string | null;
          score: number;
          skill_scores: Json;
          strength: string | null;
          user_id: string;
        };
        Insert: {
          algorithm_version?: string;
          assessment_id: string;
          competency_scores?: Json;
          created_at?: string;
          level?: string | null;
          priority?: string | null;
          recommended_module_id?: string | null;
          score: number;
          skill_scores?: Json;
          strength?: string | null;
          user_id: string;
        };
        Update: {
          algorithm_version?: string;
          assessment_id?: string;
          competency_scores?: Json;
          created_at?: string;
          level?: string | null;
          priority?: string | null;
          recommended_module_id?: string | null;
          score?: number;
          skill_scores?: Json;
          strength?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: true;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          completed_at: string | null;
          created_at: string;
          exam: string;
          guest_session_id: string | null;
          id: string;
          intake: Json;
          kind: string;
          started_at: string;
          status: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          exam: string;
          guest_session_id?: string | null;
          id?: string;
          intake?: Json;
          kind: string;
          started_at?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          exam?: string;
          guest_session_id?: string | null;
          id?: string;
          intake?: Json;
          kind?: string;
          started_at?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      entitlements: {
        Row: {
          created_at: string;
          ends_at: string | null;
          id: string;
          plan_id: string;
          purchase_id: string | null;
          source: string;
          starts_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          plan_id: string;
          purchase_id?: string | null;
          source?: string;
          starts_at: string;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          plan_id?: string;
          purchase_id?: string | null;
          source?: string;
          starts_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entitlements_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entitlements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_goals: {
        Row: {
          exam: string;
          target: string;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          exam: string;
          target: string;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          exam?: string;
          target?: string;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      learner_progress: {
        Row: {
          competency_scores: Json;
          completed_lessons: number;
          course_completion: number;
          diagnostic_score: number | null;
          exam: string;
          mock_attempts: number;
          mock_average: number | null;
          practice_accuracy: number;
          practice_answered: number;
          quiz_average: number;
          readiness: number | null;
          readiness_baseline_30_days: number | null;
          readiness_source: string | null;
          simulation_average: number;
          simulations_completed: number;
          updated_at: string;
          user_id: string;
          week_started_at: string;
          weekly_minutes_studied: number;
          weekly_practice_sessions: number;
          weekly_questions_reviewed: number;
          weekly_readiness_change: number;
        };
        Insert: {
          competency_scores?: Json;
          completed_lessons?: number;
          course_completion?: number;
          diagnostic_score?: number | null;
          exam: string;
          mock_attempts?: number;
          mock_average?: number | null;
          practice_accuracy?: number;
          practice_answered?: number;
          quiz_average?: number;
          readiness?: number | null;
          readiness_baseline_30_days?: number | null;
          readiness_source?: string | null;
          simulation_average?: number;
          simulations_completed?: number;
          updated_at?: string;
          user_id: string;
          week_started_at?: string;
          weekly_minutes_studied?: number;
          weekly_practice_sessions?: number;
          weekly_questions_reviewed?: number;
          weekly_readiness_change?: number;
        };
        Update: {
          competency_scores?: Json;
          completed_lessons?: number;
          course_completion?: number;
          diagnostic_score?: number | null;
          exam?: string;
          mock_attempts?: number;
          mock_average?: number | null;
          practice_accuracy?: number;
          practice_answered?: number;
          quiz_average?: number;
          readiness?: number | null;
          readiness_baseline_30_days?: number | null;
          readiness_source?: string | null;
          simulation_average?: number;
          simulations_completed?: number;
          updated_at?: string;
          user_id?: string;
          week_started_at?: string;
          weekly_minutes_studied?: number;
          weekly_practice_sessions?: number;
          weekly_questions_reviewed?: number;
          weekly_readiness_change?: number;
        };
        Relationships: [
          {
            foreignKeyName: "learner_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          completed_at: string | null;
          lesson_id: string;
          module_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          lesson_id: string;
          module_id: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          lesson_id?: string;
          module_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mistakes: {
        Row: {
          category: string;
          competency_id: string;
          correct_answer: string;
          created_at: string;
          exam: string | null;
          exam_skill: string | null;
          explanation: string;
          id: string;
          learner_answer: string;
          occurrence_count: number;
          pattern: string | null;
          practice_session_id: string | null;
          question_id: string;
          review_status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category: string;
          competency_id: string;
          correct_answer: string;
          created_at?: string;
          exam?: string | null;
          exam_skill?: string | null;
          explanation: string;
          id?: string;
          learner_answer: string;
          occurrence_count?: number;
          pattern?: string | null;
          practice_session_id?: string | null;
          question_id: string;
          review_status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          competency_id?: string;
          correct_answer?: string;
          created_at?: string;
          exam?: string | null;
          exam_skill?: string | null;
          explanation?: string;
          id?: string;
          learner_answer?: string;
          occurrence_count?: number;
          pattern?: string | null;
          practice_session_id?: string | null;
          question_id?: string;
          review_status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mistakes_practice_session_id_fkey";
            columns: ["practice_session_id"];
            isOneToOne: false;
            referencedRelation: "practice_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mistakes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_answers: {
        Row: {
          answer: string;
          answered_at: string;
          id: number;
          is_correct: boolean | null;
          practice_session_id: string;
          question_id: string;
          sequence: number;
          user_id: string;
        };
        Insert: {
          answer: string;
          answered_at?: string;
          id?: never;
          is_correct?: boolean | null;
          practice_session_id: string;
          question_id: string;
          sequence: number;
          user_id: string;
        };
        Update: {
          answer?: string;
          answered_at?: string;
          id?: never;
          is_correct?: boolean | null;
          practice_session_id?: string;
          question_id?: string;
          sequence?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practice_answers_practice_session_id_fkey";
            columns: ["practice_session_id"];
            isOneToOne: false;
            referencedRelation: "practice_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_answers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_sessions: {
        Row: {
          evidence_mode: string;
          completed_at: string | null;
          correct_count: number;
          created_at: string;
          duration_seconds: number;
          exam: string;
          focus_competency: string | null;
          id: string;
          question_count: number;
          score: number | null;
          skill: string;
          started_at: string;
          status: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          correct_count?: number;
          created_at?: string;
          duration_seconds?: number;
          exam: string;
          focus_competency?: string | null;
          id?: string;
          question_count?: number;
          score?: number | null;
          skill: string;
          started_at?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          correct_count?: number;
          created_at?: string;
          duration_seconds?: number;
          exam?: string;
          focus_competency?: string | null;
          id?: string;
          question_count?: number;
          score?: number | null;
          skill?: string;
          started_at?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          ai_feedback_consent_at: string | null;
          ai_feedback_consent_version: string | null;
          assistance: string;
          created_at: string;
          first_name: string;
          id: string;
          last_name: string;
          locale: string;
          updated_at: string;
        };
        Insert: {
          ai_feedback_consent_at?: string | null;
          ai_feedback_consent_version?: string | null;
          assistance?: string;
          created_at?: string;
          first_name: string;
          id: string;
          last_name: string;
          locale?: string;
          updated_at?: string;
        };
        Update: {
          ai_feedback_consent_at?: string | null;
          ai_feedback_consent_version?: string | null;
          assistance?: string;
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          locale?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      progress_history: {
        Row: {
          created_at: string;
          detail: string;
          event_type: string;
          exam: string | null;
          id: string;
          label: string;
          snapshot: Json;
          source_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          detail: string;
          event_type: string;
          exam?: string | null;
          id?: string;
          label: string;
          snapshot?: Json;
          source_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          detail?: string;
          event_type?: string;
          exam?: string | null;
          id?: string;
          label?: string;
          snapshot?: Json;
          source_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          amount_minor: number;
          checkout_session_id: string | null;
          created_at: string;
          currency: string;
          external_purchase_id: string;
          id: string;
          payment_intent_id: string | null;
          plan_id: string;
          provider: string;
          purchased_at: string | null;
          status: string;
          subtotal_minor: number | null;
          tax_minor: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_minor: number;
          checkout_session_id?: string | null;
          created_at?: string;
          currency?: string;
          external_purchase_id: string;
          id?: string;
          payment_intent_id?: string | null;
          plan_id: string;
          provider: string;
          purchased_at?: string | null;
          status: string;
          subtotal_minor?: number | null;
          tax_minor?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_minor?: number;
          checkout_session_id?: string | null;
          created_at?: string;
          currency?: string;
          external_purchase_id?: string;
          id?: string;
          payment_intent_id?: string | null;
          plan_id?: string;
          provider?: string;
          purchased_at?: string | null;
          status?: string;
          subtotal_minor?: number | null;
          tax_minor?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      review_items: {
        Row: {
          created_at: string;
          due_at: string;
          exam: string;
          lapses: number;
          last_answered_at: string;
          question_id: string;
          skill: string;
          step: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          due_at: string;
          exam: string;
          lapses?: number;
          last_answered_at?: string;
          question_id: string;
          skill: string;
          step?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          due_at?: string;
          exam?: string;
          lapses?: number;
          last_answered_at?: string;
          question_id?: string;
          skill?: string;
          step?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_scores: {
        Row: {
          attempts: number;
          baseline_30_days: number | null;
          current_score: number | null;
          exam: string;
          last_practiced_at: string | null;
          skill: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          baseline_30_days?: number | null;
          current_score?: number | null;
          exam: string;
          last_practiced_at?: string | null;
          skill: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          baseline_30_days?: number | null;
          current_score?: number | null;
          exam?: string;
          last_practiced_at?: string | null;
          skill?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      speaking_feedback_flags: {
        Row: {
          created_at: string;
          fix_index: number;
          note: string | null;
          submission_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          fix_index: number;
          note?: string | null;
          submission_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          fix_index?: number;
          note?: string | null;
          submission_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      speaking_submissions: {
        Row: {
          attempts: number;
          audio_seconds: number;
          client_key: string;
          completed_at: string | null;
          created_at: string;
          error_code: string | null;
          exam: string;
          feedback: Json | null;
          id: string;
          locale: string;
          metrics: Json;
          model: string | null;
          not_before: string;
          started_at: string | null;
          status: string;
          task_id: string;
          tokens: number | null;
          transcript: string;
          user_id: string;
          word_count: number;
        };
        Insert: {
          attempts?: number;
          audio_seconds: number;
          client_key: string;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          exam: string;
          feedback?: Json | null;
          id?: string;
          locale: string;
          metrics?: Json;
          model?: string | null;
          not_before?: string;
          started_at?: string | null;
          status?: string;
          task_id: string;
          tokens?: number | null;
          transcript: string;
          user_id: string;
          word_count: number;
        };
        Update: {
          attempts?: number;
          audio_seconds?: number;
          client_key?: string;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          exam?: string;
          feedback?: Json | null;
          id?: string;
          locale?: string;
          metrics?: Json;
          model?: string | null;
          not_before?: string;
          started_at?: string | null;
          status?: string;
          task_id?: string;
          tokens?: number | null;
          transcript?: string;
          user_id?: string;
          word_count?: number;
        };
        Relationships: [];
      };
      writing_feedback_flags: {
        Row: {
          created_at: string;
          fix_index: number;
          note: string | null;
          submission_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          fix_index: number;
          note?: string | null;
          submission_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          fix_index?: number;
          note?: string | null;
          submission_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      writing_submissions: {
        Row: {
          attempts: number;
          body: string;
          checks: Json;
          client_key: string;
          completed_at: string | null;
          created_at: string;
          error_code: string | null;
          exam: string;
          feedback: Json | null;
          id: string;
          locale: string;
          model: string | null;
          not_before: string;
          parent_id: string | null;
          started_at: string | null;
          status: string;
          task_id: string;
          tokens: number | null;
          user_id: string;
          word_count: number;
        };
        Insert: {
          attempts?: number;
          body: string;
          checks?: Json;
          client_key: string;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          exam: string;
          feedback?: Json | null;
          id?: string;
          locale: string;
          model?: string | null;
          not_before?: string;
          parent_id?: string | null;
          started_at?: string | null;
          status?: string;
          task_id: string;
          tokens?: number | null;
          user_id: string;
          word_count: number;
        };
        Update: {
          attempts?: number;
          body?: string;
          checks?: Json;
          client_key?: string;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          exam?: string;
          feedback?: Json | null;
          id?: string;
          locale?: string;
          model?: string | null;
          not_before?: string;
          parent_id?: string | null;
          started_at?: string | null;
          status?: string;
          task_id?: string;
          tokens?: number | null;
          user_id?: string;
          word_count?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      mpk_complete_lesson: { Args: { p_lesson_id: string }; Returns: Json };
      mpk_admin_beta_overview: { Args: never; Returns: Json };
      mpk_admin_beta_metrics: { Args: never; Returns: Json };
      mpk_admin_ai_usage: { Args: never; Returns: Json };
      mpk_claim_speaking_jobs: {
        Args: { p_limit: number };
        Returns: {
          attempts: number;
          exam: string;
          id: string;
          locale: string;
          metrics: Json;
          target: string;
          task_id: string;
          transcript: string;
          user_id: string;
        }[];
      };
      mpk_complete_speaking_job: {
        Args: {
          p_feedback: Json;
          p_id: string;
          p_model: string;
          p_tokens: number;
        };
        Returns: undefined;
      };
      mpk_flag_speaking_fix: {
        Args: {
          p_fix_index: number;
          p_note: string | null;
          p_submission_id: string;
        };
        Returns: undefined;
      };
      mpk_record_transcription: {
        Args: { p_audio_seconds: number; p_failed: boolean; p_model: string };
        Returns: undefined;
      };
      mpk_requeue_speaking: { Args: { p_id: string }; Returns: string };
      mpk_retry_speaking_job: {
        Args: {
          p_delay_seconds: number;
          p_error: string;
          p_final: boolean;
          p_id: string;
          p_model: string;
          p_tokens: number;
        };
        Returns: string | null;
      };
      mpk_speaking_allowance: {
        Args: { p_audio_seconds: number; p_user_id: string };
        Returns: string;
      };
      mpk_speaking_status: { Args: { p_id: string }; Returns: Json };
      mpk_submit_speaking: {
        Args: {
          p_audio_seconds: number;
          p_client_key: string;
          p_exam: string;
          p_locale: string;
          p_metrics: Json;
          p_task_id: string;
          p_transcript: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      mpk_claim_writing_jobs: {
        Args: { p_limit: number };
        Returns: {
          attempts: number;
          body: string;
          exam: string;
          id: string;
          locale: string;
          target: string;
          task_id: string;
          user_id: string;
        }[];
      };
      mpk_complete_writing_job: {
        Args: {
          p_feedback: Json;
          p_id: string;
          p_model: string;
          p_tokens: number;
        };
        Returns: undefined;
      };
      mpk_flag_writing_fix: {
        Args: {
          p_fix_index: number;
          p_note: string | null;
          p_submission_id: string;
        };
        Returns: undefined;
      };
      mpk_retry_writing_job: {
        Args: {
          p_delay_seconds: number;
          p_error: string;
          p_final: boolean;
          p_id: string;
          p_model: string;
          p_tokens: number;
        };
        Returns: string | null;
      };
      mpk_set_ai_feedback_consent: {
        Args: { p_version: string | null };
        Returns: undefined;
      };
      mpk_submit_writing: {
        Args: {
          p_body: string;
          p_checks: Json;
          p_client_key: string;
          p_exam: string;
          p_locale: string;
          p_parent_id?: string | null;
          p_task_id: string;
        };
        Returns: Json;
      };
      mpk_submit_diagnostic: {
        Args: {
          p_guest_session_id: string;
          p_kind: string;
          p_exam: string;
          p_intake: Json;
          p_answers: Json;
        };
        Returns: Json;
      };
      mpk_submit_diagnostic_writing: {
        Args: { p_assessment_id: string; p_locale: string; p_retry?: boolean };
        Returns: Json;
      };
      mpk_writing_status: { Args: { p_id: string }; Returns: Json };
      mpk_admin_create_beta_invite: {
        Args: {
          p_code: string;
          p_expires_at: string | null;
          p_label: string;
          p_max_uses: number;
        };
        Returns: Json;
      };
      mpk_admin_recent_errors: { Args: { p_limit?: number }; Returns: Json };
      mpk_admin_revoke_beta_invite: {
        Args: { p_code: string };
        Returns: undefined;
      };
      mpk_admin_update_beta_settings: {
        Args: { p_access_days: number; p_seat_limit: number };
        Returns: undefined;
      };
      mpk_check_beta_invite: { Args: { p_code: string }; Returns: string };
      mpk_log_app_error: {
        Args: {
          p_code: string | null;
          p_context: Json;
          p_event: string;
          p_reference: string;
          p_source: string | null;
          p_status: number | null;
        };
        Returns: undefined;
      };
      mpk_record_funnel_step: {
        Args: { p_locale: string; p_step: string };
        Returns: undefined;
      };
      mpk_redeem_beta_invite: { Args: { p_code: string }; Returns: Json };
      mpk_fulfill_stripe_purchase: {
        Args: {
          p_checkout_session_id: string;
          p_currency: string;
          p_payment_intent_id: string;
          p_plan_id: string;
          p_purchased_at: string;
          p_subtotal_minor: number;
          p_tax_minor: number;
          p_total_minor: number;
          p_user_id: string;
        };
        Returns: string;
      };
      mpk_revoke_stripe_purchase: {
        Args: { p_payment_intent_id: string };
        Returns: undefined;
      };
      mpk_mock_event: {
        Args: {
          p_session_id: string | null;
          p_manifest_id: string;
          p_event: Json;
        };
        Returns: Json;
      };
      mpk_submit_assessment: {
        Args: {
          p_answers: Json;
          p_exam: string;
          p_guest_session_id: string;
          p_intake: Json;
          p_kind: string;
        };
        Returns: Json;
      };
      mpk_submit_practice: {
        Args: {
          p_answers: Json;
          p_duration_seconds: number;
          p_exam: string;
          p_focus_competency: string;
          p_skill: string;
        };
        Returns: Json;
      };
      mpk_update_exam_goal: {
        Args: { p_exam: string; p_target: string; p_target_date?: string };
        Returns: undefined;
      };
      mpk_update_mistake_status: {
        Args: { p_mistake_id: string; p_status: string };
        Returns: undefined;
      };
      mpk_update_profile: {
        Args: {
          p_assistance: string;
          p_first_name: string;
          p_last_name: string;
          p_locale: string;
        };
        Returns: undefined;
      };
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

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
