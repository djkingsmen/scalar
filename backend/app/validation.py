import re

from app.models import Question, QuestionType

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class AnswerValidationError(Exception):
    def __init__(self, question_id: int, message: str):
        self.question_id = question_id
        self.message = message
        super().__init__(message)


def is_empty(value) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def render_value_text(question: Question, value) -> str:
    """Human readable representation used for tables / CSV export."""
    if is_empty(value):
        return ""
    if question.type == QuestionType.multiple_choice.value:
        options = {o["id"]: o["label"] for o in (question.options or [])}
        if isinstance(value, list):
            return ", ".join(options.get(v, str(v)) for v in value)
        return options.get(value, str(value))
    if question.type == QuestionType.dropdown.value:
        options = {o["id"]: o["label"] for o in (question.options or [])}
        return options.get(value, str(value))
    if question.type == QuestionType.yes_no.value:
        return "Yes" if value in (True, "true", "yes") else "No"
    return str(value)


def validate_answer(question: Question, value):
    """Raises AnswerValidationError on invalid input. Returns the (possibly coerced) value."""
    if is_empty(value):
        if question.required:
            raise AnswerValidationError(question.id, "This question is required.")
        return None

    qtype = question.type

    if qtype == QuestionType.email.value:
        if not EMAIL_RE.match(str(value).strip()):
            raise AnswerValidationError(question.id, "Enter a valid email address.")
        return str(value).strip()

    if qtype == QuestionType.number.value:
        try:
            num = float(value)
        except (TypeError, ValueError):
            raise AnswerValidationError(question.id, "Enter a valid number.")
        settings = question.settings or {}
        if settings.get("min") is not None and num < settings["min"]:
            raise AnswerValidationError(question.id, f"Value must be at least {settings['min']}.")
        if settings.get("max") is not None and num > settings["max"]:
            raise AnswerValidationError(question.id, f"Value must be at most {settings['max']}.")
        return num

    if qtype == QuestionType.rating.value:
        try:
            num = int(value)
        except (TypeError, ValueError):
            raise AnswerValidationError(question.id, "Enter a valid rating.")
        max_rating = (question.settings or {}).get("max", 5)
        if not (1 <= num <= max_rating):
            raise AnswerValidationError(question.id, f"Rating must be between 1 and {max_rating}.")
        return num

    if qtype == QuestionType.yes_no.value:
        if value not in (True, False, "true", "false", "yes", "no"):
            raise AnswerValidationError(question.id, "Answer must be yes or no.")
        return value in (True, "true", "yes")

    if qtype in (QuestionType.multiple_choice.value, QuestionType.dropdown.value):
        valid_ids = {o["id"] for o in (question.options or [])}
        if qtype == QuestionType.multiple_choice.value and isinstance(value, list):
            if not all(v in valid_ids for v in value):
                raise AnswerValidationError(question.id, "Invalid option selected.")
            return value
        if value not in valid_ids:
            raise AnswerValidationError(question.id, "Invalid option selected.")
        return value

    if qtype in (QuestionType.short_text.value, QuestionType.long_text.value):
        return str(value)

    return value
