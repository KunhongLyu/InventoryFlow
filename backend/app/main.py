import os

from fastapi import FastAPI

from . import models
from .auth import hash_password
from .database import engine, SessionLocal
from .routers import auth, products, orders, users

app = FastAPI(title="InventoryFlow API")

# Week 1 simplicity: create tables directly from models on startup.
# Swap this for Alembic migrations once the schema stabilizes (Week 4 stretch goal).
models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(users.router)


def ensure_default_admin():
    """
    Bootstraps exactly ONE admin account from environment variables on
    startup, so you never have to hand-edit the database with SQL again.

    This only matters for the first admin. Once one exists, use the
    admin-only PATCH /users/{id}/promote endpoint to create more — that's
    the standard "chain of trust" pattern: a human configures one trusted
    seed account, and every admin after that is vouched for by an existing
    admin, not self-granted.
    """
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if not admin_email or not admin_password:
        return  # not configured — skip silently, nothing to bootstrap

    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == admin_email).first()
        if user is None:
            user = models.User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                is_admin=True,
            )
            db.add(user)
            db.commit()
            print(f"[startup] Created default admin: {admin_email}")
        elif not user.is_admin:
            user.is_admin = True
            db.commit()
            print(f"[startup] Promoted existing user to admin: {admin_email}")
    finally:
        db.close()


ensure_default_admin()


@app.get("/health")
def health_check():
    return {"status": "ok"}
