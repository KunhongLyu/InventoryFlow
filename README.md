# InventoryFlow

A cloud-native e-commerce inventory and order management system, built to explore what it actually takes to ship a full-stack application end-to-end: a concurrency-safe backend, an automated test suite, a CI/CD pipeline, and a real deployment on AWS — not just code that runs on `localhost`.

**Live demo:** http://inventoryflow-frontend-kl52352.s3-website.us-east-2.amazonaws.com
**API docs (Swagger):** http://18.222.125.92:8000/docs

---

## What this project demonstrates

Most portfolio CRUD apps stop at "it works on my machine." This one is built around a few specific engineering problems and the decisions made to solve them:

- **Preventing overselling under concurrent load.** The order endpoint uses `SELECT ... FOR UPDATE` row-level locking so that two simultaneous purchases of the last unit of a product can't both succeed. This is verified with a real concurrency test (`scripts/concurrency_test.py`) that fires dozens of simultaneous HTTP requests at a live server and checks the database ends up in a consistent state — not just that the code *looks* correct.
- **No long-lived credentials sitting anywhere they don't need to.** The EC2 instance authenticates to ECR via an IAM instance role, not a stored access key. GitHub Actions authenticates to AWS via OIDC federation (a short-lived token scoped to this specific repo), not a static secret pasted into GitHub. The only place a real AWS credential exists is in the CLI config on my own machine.
- **A real "chain of trust" for admin accounts.** The first admin is bootstrapped from an environment variable at startup; every admin after that must be promoted by an existing admin via an authenticated endpoint. No user can grant themselves elevated privileges.
- **Tests that don't lie to you.** The automated suite runs against an isolated `inventoryflow_test` database (never the dev data), and CI runs it against a fresh, throwaway Postgres container on every push — so "tests pass" actually means the code works against a real database, not a mock.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT auth (python-jose + passlib/bcrypt) |
| Frontend | React, Vite, Tailwind CSS, React Router |
| Testing | pytest, custom concurrency load-testing script |
| CI/CD | GitHub Actions (test on every push; build & push to ECR on push to `main` via OIDC) |
| Infrastructure | Docker, AWS EC2, AWS RDS (PostgreSQL), AWS S3 (static hosting), AWS ECR, AWS IAM |

## Architecture

```
Browser
  │
  ├──► S3 (static website hosting) ── serves the built React app
  │
  └──► EC2 (Docker container running FastAPI)
           │
           └──► RDS (PostgreSQL)

GitHub push ──► GitHub Actions ──► pytest against throwaway Postgres
                                         │ (on push to main, if tests pass)
                                         ▼
                                   build image ──► push to ECR (via OIDC, no stored keys)
                                                         │
                                                (manually pulled & deployed to EC2)
```

Deployment to EC2 is a deliberate, manual step — pushing a new image to ECR does *not* automatically restart the running container. Build and deploy are kept as separate actions on purpose: a bad build should never be able to take down the live service just because it finished compiling.

## Key features

- JWT-based authentication with bcrypt password hashing
- Role-based access control (admin vs. regular user) with an auditable promotion chain
- Product catalog with stock tracking and low-stock alerts
- Cart → checkout flow with atomic, concurrency-safe stock decrementing
- Admin dashboard for product creation and low-stock monitoring
- Order history per user

## Running it locally

Requires Docker and Docker Compose.

```bash
git clone https://github.com/KunhongLyu/InventoryFlow.git
cd InventoryFlow
cp .env.example .env   # fill in ADMIN_EMAIL / ADMIN_PASSWORD / SECRET_KEY
docker compose up --build
```

- API: http://localhost:8000/docs
- Frontend: http://localhost:5173

The first admin account is created automatically on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` — no manual database editing required.

## Running the tests

```bash
# One-time: create the isolated test database
docker exec -it inventoryflow-db-1 psql -U inventory -d inventoryflow -c "CREATE DATABASE inventoryflow_test;"

# Run the suite
docker exec -it inventoryflow-api-1 pytest app/tests -v

# Run the concurrency load test against the live dev server
pip install requests
python3 scripts/concurrency_test.py
```

The concurrency script fires 50 simultaneous order requests at a product with only 10 units of stock and confirms the final stock is exactly what it should be — the actual verification behind the "zero overselling" claim, not an assumption.

## Project structure

```
InventoryFlow/
├── .github/workflows/ci.yml     # test on every push; build + push to ECR on main
├── backend/
│   ├── app/
│   │   ├── main.py              # app entrypoint, CORS, admin bootstrap
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── auth.py              # JWT + password hashing
│   │   ├── routers/             # auth, products, orders, users
│   │   └── tests/                # pytest suite (isolated test DB)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # fetch wrapper
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   └── pages/
│   └── Dockerfile
├── scripts/
│   └── concurrency_test.py      # real-HTTP concurrency verification
└── docker-compose.yml
```

## What's next

- Alembic-based schema migrations (currently using `Base.metadata.create_all` for simplicity)
- Automated deployment step in CI (currently a deliberate manual step — see [Architecture](#architecture))
- Custom domain + HTTPS in front of the EC2 API and S3 frontend

---

Built by [Kunhong Lyu](https://github.com/KunhongLyu) — [LinkedIn](https://linkedin.com/in/kunhong-lyu-110649361)
