from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from .models import OrderStatus


# ---- Auth ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    is_admin: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Products ----
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    low_stock_threshold: int = 5


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str]
    price: float
    stock_quantity: int
    low_stock_threshold: int


# ---- Orders ----
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    quantity: int
    unit_price: float


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: OrderStatus
    total_amount: float
    created_at: datetime
    items: List[OrderItemRead]
