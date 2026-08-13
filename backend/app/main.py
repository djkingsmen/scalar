from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers import forms, public

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Builder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(public.router)


@app.on_event("startup")
def seed_if_empty():
    from app import models
    from app.seed import run_seed

    db = SessionLocal()
    try:
        has_forms = db.query(models.Form).first() is not None
        if not has_forms:
            run_seed(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
