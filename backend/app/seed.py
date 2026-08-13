"""Seeds the database with a default creator, a few published forms (mixed question
types) with sample responses, and one draft form - so the app is usable immediately.
Runs automatically on startup if the forms table is empty (see app/main.py).
"""

import random

from sqlalchemy.orm import Session

from app import models
from app.models import now_utc
from app.validation import render_value_text

random.seed(42)


def _q(form, order, type_, title, description=None, required=False, options=None, settings=None):
    return models.Question(
        form_id=form.id,
        order_index=order,
        type=type_.value,
        title=title,
        description=description,
        required=required,
        options=options,
        settings=settings,
    )


def _opts(*labels):
    return [{"id": f"opt_{i}", "label": label} for i, label in enumerate(labels)]


def run_seed(db: Session):
    creator = models.Creator(name="Demo Creator", email="creator@typeform-clone.local")
    db.add(creator)
    db.flush()

    # ---------------- Form 1: Customer Feedback Survey ----------------
    feedback = models.Form(
        creator_id=creator.id,
        title="Customer Feedback Survey",
        description="Help us improve our product by sharing a few thoughts.",
        status=models.FormStatus.published.value,
        welcome_title="Quick feedback survey",
        welcome_description="This will take less than 2 minutes. Your answers help us build a better product.",
        thank_you_message="Thanks so much for your feedback! We read every response.",
        theme_color="#0d0d0d",
        published_at=now_utc(),
    )
    db.add(feedback)
    db.flush()
    fb_questions = [
        _q(feedback, 0, models.QuestionType.short_text, "What's your name?", required=True,
           settings={"placeholder": "Jane Doe"}),
        _q(feedback, 1, models.QuestionType.email, "What's your email address?", required=True,
           description="We'll only use this to follow up if needed."),
        _q(feedback, 2, models.QuestionType.multiple_choice, "How did you hear about us?",
           options=_opts("Search engine", "Social media", "Friend or colleague", "Advertisement", "Other")),
        _q(feedback, 3, models.QuestionType.rating, "How would you rate our product overall?",
           required=True, settings={"max": 5}),
        _q(feedback, 4, models.QuestionType.yes_no, "Would you recommend us to a friend?", required=True),
        _q(feedback, 5, models.QuestionType.long_text, "Anything else you'd like to share?",
           description="Optional - the more detail, the better.", required=False),
    ]
    db.add_all(fb_questions)
    db.flush()

    names = ["Ava Patel", "Liam Chen", "Noah Garcia", "Emma Wilson", "Olivia Kim",
             "Mason Lee", "Sophia Rossi", "Ethan Brooks", "Isabella Novak", "James Turner"]
    sources = [o["id"] for o in fb_questions[2].options]
    feedback_texts = [
        "Really love the new dashboard, much faster than before.",
        "Onboarding was a bit confusing at first but support helped a lot.",
        "Would like to see dark mode added soon.",
        "",
        "Great value for the price, keep up the good work!",
        "",
        "The mobile experience could use some polish.",
        "",
    ]
    for i, name in enumerate(names):
        completed = i < 9
        response = models.Response(form_id=feedback.id, completed=completed,
                                    submitted_at=now_utc() if completed else None)
        db.add(response)
        db.flush()
        answer_defs = [
            (fb_questions[0], name),
            (fb_questions[1], f"{name.split()[0].lower()}@example.com"),
            (fb_questions[2], random.choice(sources)),
            (fb_questions[3], random.randint(3, 5)),
            (fb_questions[4], random.choice([True, True, True, False])),
            (fb_questions[5], random.choice(feedback_texts)),
        ]
        # Simulate a couple of partial (in-progress, not completed) responses.
        answers_to_write = answer_defs if completed else answer_defs[: random.randint(1, 3)]
        for question, value in answers_to_write:
            if value in (None, ""):
                continue
            db.add(models.Answer(response_id=response.id, question_id=question.id, value=value,
                                  value_text=render_value_text(question, value)))

    # ---------------- Form 2: Job Application ----------------
    job = models.Form(
        creator_id=creator.id,
        title="Job Application - Frontend Engineer",
        description="Apply for the Frontend Engineer role on our product team.",
        status=models.FormStatus.published.value,
        welcome_title="Frontend Engineer application",
        welcome_description="Takes about 3 minutes. We review every application personally.",
        thank_you_message="Thanks for applying! Our team will review your application and get back to you within a week.",
        theme_color="#2b6cb0",
        published_at=now_utc(),
    )
    db.add(job)
    db.flush()
    job_questions = [
        _q(job, 0, models.QuestionType.short_text, "What's your full name?", required=True),
        _q(job, 1, models.QuestionType.email, "Email address", required=True),
        _q(job, 2, models.QuestionType.number, "Years of professional experience", required=True,
           settings={"min": 0, "max": 50}),
        _q(job, 3, models.QuestionType.dropdown, "Preferred tech stack",
           options=_opts("React", "Vue", "Angular", "Svelte"), required=True),
        _q(job, 4, models.QuestionType.long_text, "Why do you want to join us?",
           description="A couple of sentences is plenty."),
        _q(job, 5, models.QuestionType.yes_no, "Are you authorized to work in this country?", required=True),
    ]
    db.add_all(job_questions)
    db.flush()

    stacks = [o["id"] for o in job_questions[3].options]
    why_texts = [
        "I've admired your product for years and want to help shape it.",
        "Looking for a team that values craftsmanship and good design.",
        "Excited about the challenges of building at this scale.",
        "A friend on the team recommended I apply - the culture sounds great.",
    ]
    for i, name in enumerate(names[:7]):
        completed = i < 6
        response = models.Response(form_id=job.id, completed=completed,
                                    submitted_at=now_utc() if completed else None)
        db.add(response)
        db.flush()
        answer_defs = [
            (job_questions[0], name),
            (job_questions[1], f"{name.split()[0].lower()}@example.com"),
            (job_questions[2], random.randint(0, 12)),
            (job_questions[3], random.choice(stacks)),
            (job_questions[4], random.choice(why_texts)),
            (job_questions[5], random.choice([True, True, False])),
        ]
        answers_to_write = answer_defs if completed else answer_defs[: random.randint(1, 4)]
        for question, value in answers_to_write:
            db.add(models.Answer(response_id=response.id, question_id=question.id, value=value,
                                  value_text=render_value_text(question, value)))

    # ---------------- Form 3: Event Registration (draft, unpublished) ----------------
    event = models.Form(
        creator_id=creator.id,
        title="Product Launch Event Registration",
        description="Draft - still being put together.",
        status=models.FormStatus.draft.value,
        welcome_title="Register for our product launch",
        welcome_description="Join us for the big reveal.",
        thank_you_message="You're registered! See you there.",
        theme_color="#7c3aed",
    )
    db.add(event)
    db.flush()
    db.add_all([
        _q(event, 0, models.QuestionType.short_text, "Full name", required=True),
        _q(event, 1, models.QuestionType.email, "Email address", required=True),
        _q(event, 2, models.QuestionType.multiple_choice, "Which session will you attend?",
           options=_opts("Morning keynote", "Afternoon workshop", "Both")),
        _q(event, 3, models.QuestionType.yes_no, "Will you need parking?"),
    ])

    db.commit()
