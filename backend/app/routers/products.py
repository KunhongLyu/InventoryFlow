from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[schemas.ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=schemas.ProductRead, status_code=201)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    product = models.Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/low-stock/list", response_model=List[schemas.ProductRead])
def list_low_stock(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Admin view: products at or below their low-stock threshold."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return (
        db.query(models.Product)
        .filter(models.Product.stock_quantity <= models.Product.low_stock_threshold)
        .all()
    )
