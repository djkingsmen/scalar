export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type FormStatus = "draft" | "published";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface LogicBranch {
  match_value: string | number | boolean;
  operator?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
  target_question_id: number | null;
}

export interface QuestionLogic {
  branches: LogicBranch[];
}

export interface QuestionSettings {
  placeholder?: string;
  min?: number;
  max?: number;
  logic?: QuestionLogic;
  [key: string]: unknown;
}

export interface Question {
  id: number;
  form_id?: number;
  type: QuestionType;
  title: string;
  description?: string | null;
  required: boolean;
  order_index: number;
  options?: QuestionOption[] | null;
  settings?: QuestionSettings | null;
}

/** A question that may not exist on the server yet (client-generated negative id). */
export interface DraftQuestion extends Omit<Question, "id"> {
  id: number;
  isNew?: boolean;
}

export interface FormSummaryFields {
  id: number;
  title: string;
  description?: string | null;
  status: FormStatus;
  share_slug: string;
  welcome_title?: string | null;
  welcome_description?: string | null;
  thank_you_message?: string | null;
  theme_color?: string | null;
  theme_background?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface FormListItem extends FormSummaryFields {
  response_count: number;
  question_count: number;
}

export interface FormDetail extends FormSummaryFields {
  questions: Question[];
}

export interface PublicForm {
  id: number;
  title: string;
  description?: string | null;
  share_slug: string;
  welcome_title?: string | null;
  welcome_description?: string | null;
  thank_you_message?: string | null;
  theme_color?: string | null;
  theme_background?: string | null;
  questions: Question[];
}

export interface AnswerOut {
  question_id: number;
  value: unknown;
  value_text?: string | null;
}

export interface ResponseListItem {
  id: number;
  started_at: string;
  submitted_at?: string | null;
  completed: boolean;
  answer_count: number;
}

export interface ResponseDetail {
  id: number;
  form_id: number;
  started_at: string;
  submitted_at?: string | null;
  completed: boolean;
  answers: AnswerOut[];
}

export interface QuestionSummary {
  question_id: number;
  type: QuestionType;
  title: string;
  response_count: number;
  counts?: Record<string, number> | null;
  average?: number | null;
  sample_answers?: string[] | null;
}

export interface FormSummary {
  form_id: number;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  questions: QuestionSummary[];
}

export interface ApiValidationError {
  question_id: number;
  message: string;
}
