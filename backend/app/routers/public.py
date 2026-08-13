from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db
from app.models import now_utc
from app.validation import AnswerValidationError, render_value_text, validate_answer

router = APIRouter(prefix="/api/public", tags=["public"])


def _get_published_form_or_404(db: Session, share_slug: str) -> models.Form:
    form = (
        db.query(models.Form)
        .options(selectinload(models.Form.questions))
        .filter(models.Form.share_slug == share_slug)
        .first()
    )
    if not form or form.status != models.FormStatus.published.value:
        raise HTTPException(status_code=404, detail="This form isn't available.")
    return form


@router.get("/forms/{share_slug}", response_model=schemas.PublicFormOut)
def get_public_form(share_slug: str, db: Session = Depends(get_db)):
    return _get_published_form_or_404(db, share_slug)


@router.post("/forms/{share_slug}/responses", response_model=schemas.ResponseDetailOut, status_code=201)
def submit_response(share_slug: str, payload: schemas.ResponseCreate, db: Session = Depends(get_db)):
    form = _get_published_form_or_404(db, share_slug)
    questions_by_id = {q.id: q for q in form.questions}
    answers_by_qid = {a.question_id: a.value for a in payload.answers if a.question_id in questions_by_id}

    errors = []
    validated = {}
    for q in form.questions:
        raw_value = answers_by_qid.get(q.id)
        try:
            validated[q.id] = validate_answer(q, raw_value)
        except AnswerValidationError as e:
            errors.append({"question_id": e.question_id, "message": e.message})

    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    response = models.Response(
        form_id=form.id,
        completed=payload.completed,
        submitted_at=now_utc() if payload.completed else None,
    )
    db.add(response)
    db.flush()

    for q in form.questions:
        value = validated.get(q.id)
        if value is None:
            continue
        db.add(
            models.Answer(
                response_id=response.id,
                question_id=q.id,
                value=value,
                value_text=render_value_text(q, value),
            )
        )

    db.commit()
    db.refresh(response)
    return response
