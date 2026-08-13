import csv
import io
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db
from app.deps import get_default_creator
from app.validation import render_value_text

router = APIRouter(prefix="/api/forms", tags=["forms"])


def _get_form_or_404(db: Session, form_id: int) -> models.Form:
    form = (
        db.query(models.Form)
        .options(selectinload(models.Form.questions))
        .filter(models.Form.id == form_id)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.get("", response_model=list[schemas.FormListItemOut])
def list_forms(db: Session = Depends(get_db)):
    creator = get_default_creator(db)
    forms = (
        db.query(models.Form)
        .filter(models.Form.creator_id == creator.id)
        .order_by(models.Form.updated_at.desc())
        .all()
    )
    response_counts = dict(
        db.query(models.Response.form_id, func.count(models.Response.id))
        .filter(models.Response.form_id.in_([f.id for f in forms]) if forms else False)
        .group_by(models.Response.form_id)
        .all()
    )
    result = []
    for f in forms:
        item = schemas.FormListItemOut.model_validate(f)
        item.response_count = response_counts.get(f.id, 0)
        item.question_count = len(f.questions)
        result.append(item)
    return result


@router.post("", response_model=schemas.FormDetailOut, status_code=201)
def create_form(payload: schemas.FormCreate, db: Session = Depends(get_db)):
    creator = get_default_creator(db)
    form = models.Form(creator_id=creator.id, title=payload.title, description=payload.description)
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("/{form_id}", response_model=schemas.FormDetailOut)
def get_form(form_id: int, db: Session = Depends(get_db)):
    return _get_form_or_404(db, form_id)


@router.patch("/{form_id}", response_model=schemas.FormDetailOut)
def update_form(form_id: int, payload: schemas.FormPatch, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(form, field, value)
    db.commit()
    db.refresh(form)
    return form


@router.put("/{form_id}/questions", response_model=schemas.FormDetailOut)
def replace_questions(form_id: int, payload: schemas.FormQuestionsPatch, db: Session = Depends(get_db)):
    """Full-replace strategy: the builder always sends the complete ordered question list.
    Existing questions (matched by id) are updated in place so response history stays linked;
    anything no longer present is deleted; anything without an id is inserted.
    """
    form = _get_form_or_404(db, form_id)
    existing_by_id = {q.id: q for q in form.questions}
    incoming_ids = {q.id for q in payload.questions if q.id is not None}

    for qid, question in existing_by_id.items():
        if qid not in incoming_ids:
            db.delete(question)

    for index, q in enumerate(payload.questions):
        options = [o.model_dump() for o in q.options] if q.options else None
        if q.id is not None and q.id in existing_by_id:
            existing = existing_by_id[q.id]
            existing.type = q.type.value
            existing.title = q.title
            existing.description = q.description
            existing.required = q.required
            existing.options = options
            existing.settings = q.settings
            existing.order_index = index
        else:
            db.add(
                models.Question(
                    form_id=form.id,
                    type=q.type.value,
                    title=q.title,
                    description=q.description,
                    required=q.required,
                    options=options,
                    settings=q.settings,
                    order_index=index,
                )
            )

    db.commit()
    return _get_form_or_404(db, form_id)


@router.delete("/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    db.delete(form)
    db.commit()
    return None


@router.post("/{form_id}/duplicate", response_model=schemas.FormDetailOut, status_code=201)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    original = _get_form_or_404(db, form_id)
    copy = models.Form(
        creator_id=original.creator_id,
        title=f"{original.title} (copy)",
        description=original.description,
        status=models.FormStatus.draft.value,
        welcome_title=original.welcome_title,
        welcome_description=original.welcome_description,
        thank_you_message=original.thank_you_message,
        theme_color=original.theme_color,
        theme_background=original.theme_background,
    )
    db.add(copy)
    db.flush()
    for q in original.questions:
        db.add(
            models.Question(
                form_id=copy.id,
                type=q.type,
                title=q.title,
                description=q.description,
                required=q.required,
                order_index=q.order_index,
                options=q.options,
                settings=q.settings,
            )
        )
    db.commit()
    db.refresh(copy)
    return copy


@router.post("/{form_id}/publish", response_model=schemas.FormDetailOut)
def publish_form(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    if not form.questions:
        raise HTTPException(status_code=400, detail="Add at least one question before publishing.")
    from app.models import now_utc

    form.status = models.FormStatus.published.value
    if form.published_at is None:
        form.published_at = now_utc()
    db.commit()
    db.refresh(form)
    return form


@router.post("/{form_id}/unpublish", response_model=schemas.FormDetailOut)
def unpublish_form(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    form.status = models.FormStatus.draft.value
    db.commit()
    db.refresh(form)
    return form


@router.get("/{form_id}/responses", response_model=list[schemas.ResponseListItemOut])
def list_responses(form_id: int, db: Session = Depends(get_db)):
    _get_form_or_404(db, form_id)
    responses = (
        db.query(models.Response)
        .options(selectinload(models.Response.answers))
        .filter(models.Response.form_id == form_id)
        .order_by(models.Response.started_at.desc())
        .all()
    )
    out = []
    for r in responses:
        item = schemas.ResponseListItemOut.model_validate(r)
        item.answer_count = len(r.answers)
        out.append(item)
    return out


@router.get("/{form_id}/responses/export.csv")
def export_responses_csv(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    responses = (
        db.query(models.Response)
        .options(selectinload(models.Response.answers))
        .filter(models.Response.form_id == form_id)
        .order_by(models.Response.started_at.asc())
        .all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    header = ["response_id", "started_at", "submitted_at", "completed"] + [q.title for q in form.questions]
    writer.writerow(header)

    for r in responses:
        answers_by_q = {a.question_id: a for a in r.answers}
        row = [r.id, r.started_at.isoformat(), r.submitted_at.isoformat() if r.submitted_at else "", r.completed]
        for q in form.questions:
            a = answers_by_q.get(q.id)
            row.append(a.value_text if a else "")
        writer.writerow(row)

    buffer.seek(0)
    filename = f"{form.title.replace(' ', '_')}_responses.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{form_id}/responses/{response_id}", response_model=schemas.ResponseDetailOut)
def get_response(form_id: int, response_id: int, db: Session = Depends(get_db)):
    _get_form_or_404(db, form_id)
    response = (
        db.query(models.Response)
        .options(selectinload(models.Response.answers))
        .filter(models.Response.id == response_id, models.Response.form_id == form_id)
        .first()
    )
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    return response


@router.get("/{form_id}/summary", response_model=schemas.FormSummaryOut)
def form_summary(form_id: int, db: Session = Depends(get_db)):
    form = _get_form_or_404(db, form_id)
    responses = db.query(models.Response).filter(models.Response.form_id == form_id).all()
    total = len(responses)
    completed = sum(1 for r in responses if r.completed)

    answers = (
        db.query(models.Answer)
        .join(models.Response)
        .filter(models.Response.form_id == form_id)
        .all()
    )
    answers_by_question: dict[int, list] = {}
    for a in answers:
        answers_by_question.setdefault(a.question_id, []).append(a)

    question_summaries = []
    for q in form.questions:
        q_answers = [a for a in answers_by_question.get(q.id, []) if a.value is not None]
        summary = schemas.QuestionSummary(
            question_id=q.id, type=q.type, title=q.title, response_count=len(q_answers)
        )
        if q.type in (models.QuestionType.multiple_choice.value, models.QuestionType.dropdown.value):
            option_labels = {o["id"]: o["label"] for o in (q.options or [])}
            counter: Counter = Counter()
            for a in q_answers:
                vals = a.value if isinstance(a.value, list) else [a.value]
                for v in vals:
                    counter[option_labels.get(v, str(v))] += 1
            summary.counts = dict(counter)
        elif q.type == models.QuestionType.yes_no.value:
            counter = Counter()
            for a in q_answers:
                counter["Yes" if a.value in (True, "true") else "No"] += 1
            summary.counts = dict(counter)
        elif q.type in (models.QuestionType.number.value, models.QuestionType.rating.value):
            nums = [float(a.value) for a in q_answers if a.value is not None]
            summary.average = round(sum(nums) / len(nums), 2) if nums else None
        else:
            summary.sample_answers = [str(a.value) for a in q_answers[-5:]]
        question_summaries.append(summary)

    return schemas.FormSummaryOut(
        form_id=form_id,
        total_responses=total,
        completed_responses=completed,
        completion_rate=round(completed / total, 4) if total else 0.0,
        questions=question_summaries,
    )
