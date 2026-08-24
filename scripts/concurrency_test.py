"""
Fires many concurrent order requests at a single product with limited stock,
to verify the row-locking logic in orders.py actually prevents overselling
under real concurrency (not just in theory).

This hits your LIVE dev server over real HTTP — `docker compose up` must
already be running in another terminal before you run this script.

Usage (from the project root, in WSL):
    pip install requests
    python3 scripts/concurrency_test.py

Optional environment variables:
    API_URL              default http://localhost:8000
    CONCURRENT_REQUESTS  default 50 (also the number of buyer accounts created)
    STARTING_STOCK       default 10
"""
import concurrent.futures
import os
import sys

import requests

API_URL = os.getenv("API_URL", "http://localhost:8000")
CONCURRENT_REQUESTS = int(os.getenv("CONCURRENT_REQUESTS", "50"))
STARTING_STOCK = int(os.getenv("STARTING_STOCK", "10"))

ADMIN_EMAIL = "concurrency_admin@test.com"
ADMIN_PASSWORD = "testpass123"


def register_and_login(email, password):
    requests.post(f"{API_URL}/auth/register", json={"email": email, "password": password})
    resp = requests.post(f"{API_URL}/auth/login", data={"username": email, "password": password})
    resp.raise_for_status()
    return resp.json()["access_token"]


def create_test_product(token):
    resp = requests.post(
        f"{API_URL}/products",
        json={
            "name": "Concurrency Test Widget",
            "price": 9.99,
            "stock_quantity": STARTING_STOCK,
            "low_stock_threshold": 1,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.status_code == 403:
        print(f"\n'{ADMIN_EMAIL}' is not an admin yet. Run this in psql, then re-run this script:\n")
        print(f"  UPDATE users SET is_admin = true WHERE email = '{ADMIN_EMAIL}';\n")
        sys.exit(1)
    resp.raise_for_status()
    return resp.json()["id"]


def place_order(token, product_id):
    resp = requests.post(
        f"{API_URL}/orders",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {token}"},
    )
    return resp.status_code


def main():
    admin_token = register_and_login(ADMIN_EMAIL, ADMIN_PASSWORD)
    product_id = create_test_product(admin_token)
    print(f"Created product {product_id} with stock = {STARTING_STOCK}")

    print(f"Registering {CONCURRENT_REQUESTS} buyer accounts...")
    buyer_tokens = [
        register_and_login(f"buyer{i}@test.com", "testpass123")
        for i in range(CONCURRENT_REQUESTS)
    ]

    print(f"Firing {CONCURRENT_REQUESTS} concurrent orders (1 unit each) at the same product...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
        results = list(executor.map(lambda t: place_order(t, product_id), buyer_tokens))

    successes = results.count(201)
    conflicts = results.count(409)
    other = len(results) - successes - conflicts

    final_stock = requests.get(f"{API_URL}/products/{product_id}").json()["stock_quantity"]
    expected_stock = STARTING_STOCK - successes

    print("\n--- Results ---")
    print(f"  Concurrent requests fired:        {CONCURRENT_REQUESTS}")
    print(f"  Successful orders (201):          {successes}")
    print(f"  Rejected, insufficient stock (409): {conflicts}")
    if other:
        print(f"  Unexpected status codes:          {other}  <- investigate this")
    print(f"  Expected final stock:              {expected_stock}")
    print(f"  Actual final stock:                {final_stock}")

    if final_stock == expected_stock and final_stock >= 0:
        print(f"\nPASS — zero overselling across {CONCURRENT_REQUESTS} concurrent requests.")
    else:
        print("\nFAIL — stock doesn't match expectations. The locking logic has a bug.")


if __name__ == "__main__":
    main()
