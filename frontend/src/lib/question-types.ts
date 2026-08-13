import {
  AlignLeftIcon,
  ChevronSelectIcon,
  HashIcon,
  ListIcon,
  MailIcon,
  StarIcon,
  ToggleLeftIcon,
  TypeIcon,
} from "@/components/ui/icons";
import type { QuestionType } from "./types";

export const QUESTION_TYPES: { type: QuestionType; label: string; icon: typeof TypeIcon; hint: string }[] = [
  { type: "short_text", label: "Short text", icon: TypeIcon, hint: "A single line of text" },
  { type: "long_text", label: "Long text", icon: AlignLeftIcon, hint: "A multi-line paragraph" },
  { type: "multiple_choice", label: "Multiple choice", icon: ListIcon, hint: "Pick one option" },
  { type: "dropdown", label: "Dropdown", icon: ChevronSelectIcon, hint: "Choose from a list" },
  { type: "email", label: "Email", icon: MailIcon, hint: "Validated email address" },
  { type: "number", label: "Number", icon: HashIcon, hint: "Numeric input" },
  { type: "yes_no", label: "Yes / No", icon: ToggleLeftIcon, hint: "A simple boolean choice" },
  { type: "rating", label: "Rating", icon: StarIcon, hint: "Star rating scale" },
];

export const questionTypeMeta = (type: QuestionType) =>
  QUESTION_TYPES.find((q) => q.type === type) ?? QUESTION_TYPES[0];

export function emptyQuestionDefaults(type: QuestionType) {
  switch (type) {
    case "multiple_choice":
    case "dropdown":
      return {
        options: [
          { id: `opt_${Math.random().toString(36).slice(2, 8)}`, label: "Option 1" },
          { id: `opt_${Math.random().toString(36).slice(2, 8)}`, label: "Option 2" },
        ],
        settings: null,
      };
    case "rating":
      return { options: null, settings: { max: 5 } };
    case "number":
      return { options: null, settings: {} };
    default:
      return { options: null, settings: null };
  }
}
