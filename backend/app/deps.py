from sqlalchemy.orm import Session

from app import models


def get_default_creator(db: Session) -> models.Creator:
    """Real auth is out of scope for this assignment - always operate as the single seeded creator."""
    creator = db.query(models.Creator).first()
    if creator is None:
        creator = models.Creator(name="Demo Creator", email="creator@typeform-clone.local")
        db.add(creator)
        db.commit()
        db.refresh(creator)
    return creator
