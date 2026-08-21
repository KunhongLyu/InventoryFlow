from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderRead, status_code=201)
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Creates an order and decrements stock atomically.

    Key detail: we lock each product row with SELECT ... FOR UPDATE before
    checking stock. This forces concurrent requests for the same product to
    queue up at the database level instead of racing on a stale stock read,
    which is what prevents overselling.
    """
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order = models.Order(user_id=current_user.id, total_amount=0.0)
    db.add(order)
    db.flush()  # assigns order.id without committing yet

    total = 0.0
    try:
        for item in order_in.items:
            # SELECT ... FOR UPDATE: locks this row until the transaction commits/rolls back.
            product = (
                db.query(models.Product)
                .filter(models.Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=409,
                    detail=f"Insufficient stock for '{product.name}': "
                           f"requested {item.quantity}, available {product.stock_quantity}",
                )

            product.stock_quantity -= item.quantity
            line_total = product.price * item.quantity
            total += line_total

            db.add(models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
            ))

        order.total_amount = total
        db.commit()
        db.refresh(order)
        return order

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Order could not be processed")


@router.get("", response_model=List[schemas.OrderRead])
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Order).filter(models.Order.user_id == current_user.id).all()


@router.get("/{order_id}", response_model=schemas.OrderRead)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id, models.Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
