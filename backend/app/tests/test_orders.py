import pytest


def _create_product(client, admin_headers, **overrides):
    payload = {
        "name": "Test Widget",
        "price": 9.99,
        "stock_quantity": 10,
        "low_stock_threshold": 2,
    }
    payload.update(overrides)
    resp = client.post("/products", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    return resp.json()


def test_create_order_success(client, admin_headers):
    product = _create_product(client, admin_headers)

    resp = client.post(
        "/orders",
        json={"items": [{"product_id": product["id"], "quantity": 3}]},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["total_amount"] == pytest.approx(9.99 * 3)

    updated = client.get(f"/products/{product['id']}").json()
    assert updated["stock_quantity"] == 7


def test_order_insufficient_stock_returns_409(client, admin_headers):
    product = _create_product(client, admin_headers, stock_quantity=1)

    resp = client.post(
        "/orders",
        json={"items": [{"product_id": product["id"], "quantity": 5}]},
        headers=admin_headers,
    )
    assert resp.status_code == 409

    # Nothing should have been decremented — the whole order rolls back.
    unchanged = client.get(f"/products/{product['id']}").json()
    assert unchanged["stock_quantity"] == 1


def test_order_nonexistent_product_returns_404(client, admin_headers):
    resp = client.post(
        "/orders",
        json={"items": [{"product_id": 999999, "quantity": 1}]},
        headers=admin_headers,
    )
    assert resp.status_code == 404


def test_order_empty_items_returns_400(client, admin_headers):
    resp = client.post("/orders", json={"items": []}, headers=admin_headers)
    assert resp.status_code == 400


def test_order_requires_authentication(client):
    resp = client.post("/orders", json={"items": [{"product_id": 1, "quantity": 1}]})
    assert resp.status_code == 401


def test_non_admin_cannot_create_product(client, buyer_headers):
    resp = client.post(
        "/products",
        json={"name": "X", "price": 1.0, "stock_quantity": 1},
        headers=buyer_headers,
    )
    assert resp.status_code == 403
