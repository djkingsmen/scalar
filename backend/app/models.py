import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


def short_uuid():
    return uuid.uuid4().hex[:10]


class QuestionType(str, enum.Enum):
    short_text = "short_text"
    long_text = "long_text"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    email = "email"
    number = "number"
    yes_no = "yes_no"
    rating = "rating"


class FormStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class Creator(Base):
    """Single default creator - real auth is out of scope per assignment spec."""

    __tablename__ = "creators"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    forms = relationship("Form", back_populates="creator", cascade="all, delete-orphan")


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    title = Column(String, nullable=False, default="Untitled Form")
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=FormStatus.draft.value)
    share_slug = Column(String, unique=True, nullable=False, default=short_uuid)

    welcome_title = Column(String, nullable=True)
    welcome_description = Column(Text, nullable=True)
    thank_you_message = Column(Text, nullable=True, default="Thanks for completing this form!")

    theme_color = Column(String, nullable=True, default="#0d0d0d")
    theme_background = Column(String, nullable=True, default="#ffffff")

    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    published_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("Creator", back_populates="forms")
    questions = relationship(
        "Question", back_populates="form", cascade="all, delete-orphan", order_by="Question.order_index"
    )
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False, default="")
    description = Column(Text, nullable=True)
    required = Column(Boolean, nullable=False, default=False)
    order_index = Column(Integer, nullable=False, default=0)

    # For multiple_choice / dropdown: [{"id": "opt_xxx", "label": "..."}]
    options = Column(JSON, nullable=True)
    # Type-specific extras, e.g. {"max": 5} for rating, {"min":0,"max":120} for number
    settings = Column(JSON, nullable=True)

    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), default=now_utc)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    completed = Column(Boolean, nullable=False, default=False)

    form = relationship("Form", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    # Raw value as JSON (string, number, bool, or option id) - flexible across question types
    value = Column(JSON, nullable=True)
    # Denormalized human-readable rendering, used for tables/CSV export
    value_text = Column(Text, nullable=True)

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
