import type { Question } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function isEmpty(value: unknown) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/** Client-side mirror of the backend's validate_answer - gives instant feedback before the network round-trip. */
export function validateAnswer(question: Question, value: unknown): string | null {
  if (isEmpty(value)) {
    return question.required ? "This question is required." : null;
  }

  switch (question.type) {
    case "email":
      return EMAIL_RE.test(String(value).trim()) ? null : "Enter a valid email address.";
    case "number": {
      const num = Number(value);
      if (Number.isNaN(num)) return "Enter a valid number.";
      if (question.settings?.min !== undefined && num < question.settings.min)
        return `Value must be at least ${question.settings.min}.`;
      if (question.settings?.max !== undefined && num > question.settings.max)
        return `Value must be at most ${question.settings.max}.`;
      return null;
    }
    case "rating": {
      const num = Number(value);
      const max = question.settings?.max ?? 5;
      if (Number.isNaN(num) || num < 1 || num > max) return `Rating must be between 1 and ${max}.`;
      return null;
    }
    default:
      return null;
  }
}
