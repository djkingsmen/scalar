from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import FormStatus, QuestionType


# ---------- Questions ----------

class QuestionOption(BaseModel):
    id: str
    label: str


class QuestionBase(BaseModel):
    type: QuestionType
    title: str = ""
    description: Optional[str] = None
    required: bool = False
    options: Optional[list[QuestionOption]] = None
    settings: Optional[dict[str, Any]] = None


class QuestionCreate(QuestionBase):
    id: Optional[int] = None  # present when updating an existing question in a bulk save


class QuestionOut(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    order_index: int


# ---------- Forms ----------

class FormCreate(BaseModel):
    title: str = "Untitled Form"
    description: Optional[str] = None


class FormPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    thank_you_message: Optional[str] = None
    theme_color: Optional[str] = None
    theme_background: Optional[str] = None


class FormQuestionsPatch(BaseModel):
    questions: list[QuestionCreate]


class FormOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    status: FormStatus
    share_slug: str
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    thank_you_message: Optional[str] = None
    theme_color: Optional[str] = None
    theme_background: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


class FormDetailOut(FormOut):
    questions: list[QuestionOut] = []


class FormListItemOut(FormOut):
    response_count: int = 0
    question_count: int = 0


# ---------- Public respondent flow ----------

class PublicQuestionOut(BaseModel):
    id: int
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool
    order_index: int
    options: Optional[list[QuestionOption]] = None
    settings: Optional[dict[str, Any]] = None


class PublicFormOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    share_slug: str
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    thank_you_message: Optional[str] = None
    theme_color: Optional[str] = None
    theme_background: Optional[str] = None
    questions: list[PublicQuestionOut]


# ---------- Responses / Answers ----------

class AnswerIn(BaseModel):
    question_id: int
    value: Any = None


class ResponseCreate(BaseModel):
    answers: list[AnswerIn]
    completed: bool = True


class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: int
    value: Any = None
    value_text: Optional[str] = None


class ResponseListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    completed: bool
    answer_count: int = 0


class ResponseDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    completed: bool
    answers: list[AnswerOut]


# ---------- Summary stats ----------

class QuestionSummary(BaseModel):
    question_id: int
    type: QuestionType
    title: str
    response_count: int
    # For choice-type questions: option label -> count
    counts: Optional[dict[str, int]] = None
    # For numeric/rating questions
    average: Optional[float] = None
    # A sample of recent free-text answers
    sample_answers: Optional[list[str]] = None


class FormSummaryOut(BaseModel):
    form_id: int
    total_responses: int
    completed_responses: int
    completion_rate: float
    questions: list[QuestionSummary]
