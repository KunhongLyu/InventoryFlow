import os

# Point at a separate test database BEFORE importing the app, so the app's
# SQLAlchemy engine binds to a throwaway database instead of your real dev
# data. This means running tests will never wipe the products/orders you
# created manually while poking around in /docs.
os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://inventory:inventory@db:5432/inventoryflow_test",
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.database import SessionLocal
from app import models

test_client = TestClient(app)


@pytest.fixture
def client():
    return test_client


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate every table before each test so tests never see each other's data."""
    session = SessionLocal()
    session.execute(
        text("TRUNCATE TABLE order_items, orders, products, users RESTART IDENTITY CASCADE")
    )
    session.commit()
    session.close()
    yield


def _register_and_login(client, email, password, make_admin=False):
    client.post("/auth/register", json={"email": email, "password": password})
    if make_admin:
        session = SessionLocal()
        user = session.query(models.User).filter(models.User.email == email).first()
        user.is_admin = True
        session.commit()
        session.close()
    resp = client.post("/auth/login", data={"username": email, "password": password})
    return resp.json()["access_token"]


@pytest.fixture
def admin_headers(client):
    token = _register_and_login(client, "admin@test.com", "testpass123", make_admin=True)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def buyer_headers(client):
    token = _register_and_login(client, "buyer@test.com", "testpass123")
    return {"Authorization": f"Bearer {token}"}
