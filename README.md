# InventoryFlow — E-Commerce Inventory & Order Management System

Week 1 scaffold: FastAPI + PostgreSQL, running in Docker, with auth,
product CRUD, and a concurrency-safe order endpoint already wired up.

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

Then open http://localhost:8000/docs — this is FastAPI's interactive
Swagger UI. You can register a user, log in, and hit every endpoint
from the browser without writing a frontend yet.

## What's already built

- `POST /auth/register`, `POST /auth/login` — JWT-based auth
- `GET/POST /products` — product catalog (creating a product requires
  an admin user; you'll need to flip `is_admin` to `True` directly in
  the DB for your first admin account — that's expected at this stage)
- `POST /orders` — the important one. Look at
  `backend/app/routers/orders.py`: it uses `SELECT ... FOR UPDATE` to
  lock each product row before checking stock, so two simultaneous
  orders for the last unit of a product can't both succeed. This is
  the piece worth understanding cold before an interview.
- `GET /products/low-stock/list` — admin view of products at/below
  their reorder threshold

## Week 1 checklist (where you are now)

- [x] Schema: `users`, `products`, `orders`, `order_items`
- [x] Docker Compose local dev environment (API container + Postgres container)
- [x] JWT auth (register/login)
- [ ] Manually flip one user to `is_admin = True` in Postgres and
      create a couple of test products through `/docs`
- [ ] Skim `orders.py` until you can explain the row-lock logic out loud

## Coming in later weeks

- Week 2: more product/order edge cases, refine the locking logic,
  write pytest tests for the concurrency path
- Week 3: React + Tailwind frontend consuming this API
- Week 4: Dockerize for deployment, push to AWS (ECR + EC2 + RDS),
  GitHub Actions CI/CD, and a concurrency load test with `locust` to
  get a real number for your resume

## Project structure

```
InventoryFlow/
├── docker-compose.yml
├── .env.example
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py          # app entrypoint, mounts routers
        ├── database.py      # SQLAlchemy engine/session
        ├── models.py        # User, Product, Order, OrderItem
        ├── schemas.py       # Pydantic request/response models
        ├── auth.py          # password hashing + JWT
        └── routers/
            ├── auth.py
            ├── products.py
            └── orders.py
```
