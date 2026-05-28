/**
 * Supabase Database types — manually maintained to match the migrations
 * in `supabase/migrations/*.sql`. When the schema changes, regenerate by
 * running `npx supabase gen types typescript --project-id <id>` and
 * pasting the output here.
 *
 * The shape below mirrors BUILD_SPEC §8.
 */

export type RequestStatus =
  | "started"
  | "interview_in_progress"
  | "interview_complete"
  | "files_generated"
  | "sent"
  | "failed"
  | "abandoned";

export type ProductSlug = "brand-identity" | "design-brand-book";

export type ContactRole =
  | "Founder"
  | "Marketing"
  | "Brand"
  | "Operations"
  | "Other";

export type EmailType =
  | "internal_notification"
  | "client_confirmation"
  | "client_delivery"
  | "contact_form"
  | "reminder"
  | "resend";

export type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed";

export type GeneratedFileStatus = "generated" | "edited" | "finalized";

export type RequestRow = {
  id: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_role: ContactRole | null;
  product: ProductSlug;
  status: RequestStatus;
  interview_started_at: string | null;
  interview_completed_at: string | null;
  files_generated_at: string | null;
  sent_at: string | null;
  admin_notes: string | null;
  assigned_admin: string | null;
  iteration_history: PackIteration[] | null;
  /** Opaque random token used to authorise the client-facing
   * /deliver/<token> download page. Null until the admin first
   * triggers "Send pack to client"; rotated on resend. */
  delivery_token: string | null;
};

/** One round of admin-driven feedback that re-ran the generation. */
export type PackIteration = {
  /** ISO timestamp when this iteration completed. */
  at: string;
  /** The feedback prompt the admin submitted. Empty string for the
   * initial generation (no feedback). */
  prompt: string;
  /** Number of files regenerated. */
  file_count: number;
  /** Anthropic token usage for this iteration only (cumulative is
   * computed from interview_conversation.token_usage). */
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
};

export type InterviewAnswersRow = {
  id: string;
  request_id: string;
  created_at: string;
  updated_at: string;
  current_phase: number;
  completed_phases: number[];
  answers: Record<string, unknown>;
  admin_edits: Record<string, unknown>;
  materials_context: MaterialsContext | Record<string, never>;
  interview_conversation:
    | InterviewConversation
    | Record<string, never>;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  /** Plain text for simple messages; for assistant messages that include
   * tool_use / tool_result, this is the raw content-block array. */
  content: string | unknown[];
  at: string; // ISO timestamp
  /** Captured when the assistant invokes one of our tools mid-stream. */
  tool_uses?: Array<{
    name: string;
    input: Record<string, unknown>;
    result?: unknown;
  }>;
};

export type InterviewConversation = {
  messages?: ConversationMessage[];
  started_at?: string;
  last_active?: string;
  role?:
    | "Founder"
    | "Marketing"
    | "Brand"
    | "Operations"
    | "Other"
    | null;
  /** Which archetype the user picked when Claude presented choices. */
  archetype_decisions?: Record<string, string>;
  /** Mirror of which framework field-ids Claude has filled to date.
   * Lets the sidebar render progress without re-traversing answers JSONB. */
  completed_fields?: string[];
  /** Cumulative Anthropic token usage across every turn of this
   * interview. Used for cost auditing and to verify prompt caching is
   * hitting (cache_read should dominate after the first turn). */
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    turn_count: number;
  };
};

export type DraftEntry = {
  value: unknown;
  source: string;
  /** 1-3 short verbatim excerpts from the materials. Empty for purely structural inferences. */
  source_quotes?: string[];
  /** 2-5 specific prompts for what the user still needs to add — the depth the materials can't provide. */
  missing_context?: string[];
  dismissed?: boolean;
};

export type MaterialsContext = {
  url?: string | null;
  url_scraped_at?: string | null;
  url_content?: string | null;
  pasted_text?: string | null;
  extracted_at?: string | null;
  extraction_model?: string | null;
  drafts?: Record<string, DraftEntry>;
  /**
   * LinkedIn company URLs found on the user's website during crawl.
   * Used as a permission-scoped signal for headcount-based structural
   * inference (e.g., founder-led when LinkedIn shows ≤10 employees).
   */
  linkedin_urls?: string[];
  /** Anthropic token usage for the extraction call(s). Used by the
   * admin panel to break down spend per phase (extraction vs chat). */
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    run_count: number;
  };
  /** PDF / DOCX / TXT files the client uploaded on the materials page
   * as complementary context. Each file is stored in the
   * `materials-uploads` Supabase Storage bucket; the extracted text is
   * also concatenated into `uploaded_text` for fast LLM consumption. */
  uploaded_files?: UploadedFile[];
  /** Concatenated text extracted from uploaded_files, ready to be
   * appended to the materials block when extracting drafts and as
   * additional context for the conversational interviewer. */
  uploaded_text?: string | null;
  /** One-paragraph summary written by Claude during extraction. Captures
   * what the materials revealed about the brand: category, audience,
   * positioning signals. Surfaced in the admin panel as a 1-line
   * "what is this client" subtitle. */
  summary?: string | null;
};

export type UploadedFile = {
  /** Stable id we assign at upload time (also the storage path). */
  id: string;
  /** Original filename as the user uploaded it. */
  name: string;
  /** MIME type the upload route accepted. */
  mime: string;
  /** Bytes of the stored file. */
  bytes: number;
  /** Object storage path: "<requestId>/<id>.<ext>". */
  storage_path: string;
  /** ISO timestamp of upload. */
  uploaded_at: string;
  /** Characters extracted from the file (after sanitization). */
  extracted_chars: number;
  /** True if extraction yielded zero useful text (image-only PDF,
   * corrupted DOCX, etc.). Kept around so the admin sees the file
   * exists even if it added nothing to the brief. */
  extraction_empty?: boolean;
};

export type GeneratedFileRow = {
  id: string;
  request_id: string;
  created_at: string;
  file_name: string;
  /** Nullable since DN-004 — v1 stores content inline. Becomes
   * required again once we wire Supabase Storage for zip download. */
  storage_path: string | null;
  file_size_bytes: number | null;
  framework_version: string;
  locale: string | null;
  status: GeneratedFileStatus;
  /** Inline file body (DN-004). Plain text or markdown. */
  content: string | null;
  /** Which renderer produced this file ("deterministic-template-v1",
   * "claude-synth-v1", etc.). */
  generation_model: string | null;
  /** Token usage if a model was invoked. Empty object for deterministic
   * renderers. */
  token_usage: Record<string, number> | null;
};

export type EmailLogRow = {
  id: string;
  request_id: string | null;
  created_at: string;
  recipient: string;
  subject: string;
  type: EmailType;
  resend_message_id: string | null;
  status: EmailStatus;
  error: string | null;
  metadata: Record<string, unknown>;
};

type WithDefaults<T> = {
  [K in keyof T]?: T[K];
};

export type Database = {
  public: {
    Tables: {
      requests: {
        Row: RequestRow;
        Insert: WithDefaults<RequestRow> &
          Pick<
            RequestRow,
            "company_name" | "contact_name" | "contact_email" | "product"
          >;
        Update: Partial<RequestRow>;
        Relationships: [];
      };
      interview_answers: {
        Row: InterviewAnswersRow;
        Insert: WithDefaults<InterviewAnswersRow> &
          Pick<InterviewAnswersRow, "request_id">;
        Update: Partial<InterviewAnswersRow>;
        Relationships: [];
      };
      generated_files: {
        Row: GeneratedFileRow;
        Insert: WithDefaults<GeneratedFileRow> &
          Pick<
            GeneratedFileRow,
            "request_id" | "file_name" | "storage_path" | "framework_version"
          >;
        Update: Partial<GeneratedFileRow>;
        Relationships: [];
      };
      email_log: {
        Row: EmailLogRow;
        Insert: WithDefaults<EmailLogRow> &
          Pick<EmailLogRow, "recipient" | "subject" | "type">;
        Update: Partial<EmailLogRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
