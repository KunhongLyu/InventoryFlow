from fastapi import FastAPI

from . import models
from .database import engine
from .routers import auth, products, orders

app = FastAPI(title="InventoryFlow API")

# Week 1 simplicity: create tables directly from models on startup.
# Swap this for Alembic migrations once the schema stabilizes (Week 4 stretch goal).
models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
