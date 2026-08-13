# Typeform Builder Clone

A full-stack Typeform-style form builder with:
- Creator dashboard and builder UI
- Public respondent flow
- Response analytics and CSV export
- Conditional branching (logic jumps)

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Repository Structure](#repository-structure)
3. [Features Implemented](#features-implemented)
4. [Local Setup Instructions](#local-setup-instructions)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
5. [Architecture Overview](#architecture-overview)
   - [High-level Flow](#high-level-flow)
   - [Frontend Architecture](#frontend-architecture)
   - [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
   - [ER Diagram](#er-diagram)
   - [JSON Columns](#json-columns)
7. [API Overview](#api-overview)
   - [Base URL](#base-url)
   - [Error Patterns](#error-patterns)
   - [Creator APIs](#creator-apis)
   - [Public APIs](#public-apis)
8. [Authentication Model](#authentication-model)
9. [Seed Data Behavior](#seed-data-behavior)
10. [CORS and Security Notes](#cors-and-security-notes)
11. [Scripts and Commands](#scripts-and-commands)
12. [Troubleshooting](#troubleshooting)
13. [Future Improvements](#future-improvements)

---

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- TanStack Query
- Framer Motion
- dnd-kit

### Backend
- FastAPI
- SQLAlchemy 2
- Pydantic 2
- SQLite (default; configurable via `DATABASE_URL`)

---

## Repository Structure

```text
backend/
  app/
    main.py              # FastAPI app, CORS, router registration, startup seed
    database.py          # SQLAlchemy engine/session/base
    models.py            # ORM entities
    schemas.py           # Pydantic request/response models
    validation.py        # Answer validation/coercion + display text rendering
    deps.py              # Default creator dependency (simplified auth)
    seed.py              # Demo seed data
    routers/
      forms.py           # Creator APIs (CRUD, publish, analytics)
      public.py          # Public form + submission APIs
  requirements.txt

frontend/
  src/
    app/                 # Next.js routes
    components/          # Builder, dashboard, respondent, results, ui
    lib/
      api.ts             # HTTP client wrapper + endpoint mapping
      types.ts           # Frontend domain types
      validate-answer.ts # Client-side answer validation mirror
```

---

## Features Implemented

### Creator-side
- Create, rename, duplicate, delete forms
- Draft/publish/unpublish workflow
- Question types:
  - short_text
  - long_text
  - multiple_choice
  - dropdown
  - email
  - number
  - yes_no
  - rating
- Drag-and-drop question reordering
- Autosave of form metadata and question list
- Per-form theme and welcome/thank-you settings
- Conditional branching / logic jumps:
  - Choice-based rules (multiple_choice, dropdown, yes_no)
  - Comparator rules (number, rating): `eq`, `neq`, `gt`, `gte`, `lt`, `lte`
- Preview mode
- Results dashboard:
  - Summary cards
  - Response table
  - Per-response modal details
  - CSV export

### Respondent-side
- Public shared-form route by slug
- Conversational one-question-at-a-time flow
- Client-side validation before submit
- Server-side validation and coercion on submit
- Completion and partial response support (`completed` flag)

### Placeholder areas (Coming Soon)
- Integrations / webhooks
- Team collaboration & sharing
- Payment/file-upload question types
- Real creator authentication (currently simplified to a default logged-in creator)

---

## Local Setup Instructions

### Prerequisites
- Node.js 20+
- npm 10+
- Python 3.10+
- pip

### Backend Setup

From repository root:

```bash
cd backend
python -m venv venv
```

Activate virtual environment:

**Windows PowerShell:**
```powershell
venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run API server:
```bash
uvicorn app.main:app --reload --port 8000
```

Backend defaults:
- API base: `http://localhost:8000`
- Health: `GET /api/health`
- DB file (default): `backend/typeform.db`
- On startup, app auto-creates tables and seeds demo data if no forms exist.

Optional backend environment variable:
- `DATABASE_URL`
  - Default: `sqlite:///backend/typeform.db`
  - Example (Postgres): `postgresql+psycopg://user:pass@host:5432/dbname`

### Frontend Setup

From repository root:

```bash
cd frontend
npm install
```

Create `.env.local` in `frontend/` (optional if backend is local default):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run frontend:
```bash
npm run dev
```

Frontend default:
- App URL: `http://localhost:3000`

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run start
```

**Backend (example):**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Architecture Overview

### High-level Flow

```mermaid
flowchart LR
  A[Creator UI - Next.js] -->|HTTP JSON| B[FastAPI Backend]
  C[Public Respondent UI - Next.js] -->|HTTP JSON| B
  B --> D[(SQLite via SQLAlchemy)]
```

### Frontend Architecture
- Route-level pages in `frontend/src/app`
- Domain components split by surface:
  - `components/builder/*`
  - `components/dashboard/*`
  - `components/respondent/*`
  - `components/results/*`
  - `components/ui/*`
- Data fetching and mutation with TanStack Query
- API layer centralized in `frontend/src/lib/api.ts`
- Branching logic editing stored in question `settings.logic.branches`

### Backend Architecture
- `app/main.py`
  - Configures FastAPI and permissive CORS (`*`)
  - Registers routers: `/api/forms`, `/api/public`
  - Creates DB tables on startup
  - Seeds demo data if forms table is empty
- Router split:
  - `routers/forms.py` for creator/internal management and analytics
  - `routers/public.py` for published-form consumption and response submit
- Validation:
  - `validation.py` validates and coerces answer values by question type
  - Renders human-readable `value_text` for tables and CSV

---

## Database Schema

### ER Diagram



### JSON Columns
- `questions.options`:
  - for choice/dropdown, array of objects like:
  - `[ { "id": "opt_ab12", "label": "Option A" } ]`
- `questions.settings`:
  - type-specific configuration, examples:
  - rating max: `{ "max": 5 }`
  - number bounds: `{ "min": 0, "max": 120 }`
  - branching rules (logic jumps):
    ```json
    {
      "logic": {
        "branches": [
          { "match_value": true, "target_question_id": 42 },
          { "operator": "gte", "match_value": 4, "target_question_id": null }
        ]
      }
    }
    ```

---

## API Overview

**Base URL:**
- local backend: `http://localhost:8000`

**Error patterns:**
- 404 for missing form/response or unpublished public form
- 400 for publish-without-questions
- 422 with structured validation errors for response submit

### Creator APIs (`/api/forms`)

#### List forms
- `GET /api/forms`
- Returns: `FormListItemOut[]`
- Adds computed fields:
  - `response_count`
  - `question_count`

#### Create form
- `POST /api/forms`
- Body:
  ```json
  { "title": "Customer Feedback", "description": "Optional" }
  ```
- Returns: `FormDetailOut`

#### Get single form
- `GET /api/forms/{form_id}`
- Returns: `FormDetailOut`

#### Patch form metadata
- `PATCH /api/forms/{form_id}`
- Body supports:
  - `title`
  - `description`
  - `welcome_title`
  - `welcome_description`
  - `thank_you_message`
  - `theme_color`
  - `theme_background`
- Returns: `FormDetailOut`

#### Replace all questions
- `PUT /api/forms/{form_id}/questions`
- Body:
  ```json
  {
    "questions": [
      {
        "id": 12,
        "type": "multiple_choice",
        "title": "How did you hear about us?",
        "description": null,
        "required": false,
        "options": [
          { "id": "opt_a", "label": "Search" },
          { "id": "opt_b", "label": "Friend" }
        ],
        "settings": {
          "logic": {
            "branches": [
              { "match_value": "opt_b", "target_question_id": null }
            ]
          }
        }
      }
    ]
  }
  ```
- Notes:
  - Full-replace strategy
  - Existing IDs are updated in place
  - Missing existing IDs are deleted
  - Missing/undefined IDs are inserted as new

#### Delete form
- `DELETE /api/forms/{form_id}`
- Returns: `204 No Content`

#### Duplicate form
- `POST /api/forms/{form_id}/duplicate`
- Returns: duplicated `FormDetailOut` as draft

#### Publish form
- `POST /api/forms/{form_id}/publish`
- Rule: at least one question required
- Returns: `FormDetailOut`

#### Unpublish form
- `POST /api/forms/{form_id}/unpublish`
- Returns: `FormDetailOut`

#### List responses for form
- `GET /api/forms/{form_id}/responses`
- Returns: `ResponseListItemOut[]`
- Includes computed `answer_count`

#### Get one response
- `GET /api/forms/{form_id}/responses/{response_id}`
- Returns: `ResponseDetailOut`

#### Export responses CSV
- `GET /api/forms/{form_id}/responses/export.csv`
- Returns: streaming CSV file
- Header format:
  - fixed columns: `response_id, started_at, submitted_at, completed`
  - then one column per question title

#### Form summary analytics
- `GET /api/forms/{form_id}/summary`
- Returns: `FormSummaryOut`
- Includes:
  - totals and completion rate
  - per-question summary
    - choice/dropdown counts
    - yes/no counts
    - number/rating average
    - text sample answers (up to recent 5)

### Public APIs (`/api/public`)

#### Get published form by share slug
- `GET /api/public/forms/{share_slug}`
- Returns: `PublicFormOut`
- Only published forms are visible

#### Submit response
- `POST /api/public/forms/{share_slug}/responses`
- Body:
  ```json
  {
    "completed": true,
    "answers": [
      { "question_id": 101, "value": "Jane" },
      { "question_id": 102, "value": "jane@example.com" },
      { "question_id": 103, "value": true }
    ]
  }
  ```
- Returns: `ResponseDetailOut`
- Validation behavior:
  - validates each form question by type
  - required checks on empty values
  - coercion examples:
    - number -> float
    - rating -> int
    - yes/no -> bool
- On validation failure:
  - HTTP 422
  - `detail.errors` array with entries:
    - `question_id`
    - `message`

---

## Authentication Model

Creator auth is intentionally simplified.
- Backend uses `get_default_creator()` to always operate as one seeded/default creator.
- No login/session/JWT is required for creator APIs in this assignment implementation.

## Seed Data Behavior

On backend startup:
- Tables are created via SQLAlchemy metadata.
- If no forms exist, demo data is inserted (multiple forms + sample responses).

This gives immediate content for dashboard, builder, and analytics pages.


## Scripts and Commands

### Frontend
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - serve production build
- `npm run lint` - lint checks

### Backend
- `uvicorn app.main:app --reload --port 8000` - run API in dev mode

## Troubleshooting

### Frontend cannot reach API
- Ensure backend runs on `:8000`.
- Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
- Restart frontend after env changes.

### Database reset
- Stop backend.
- Delete `backend/typeform.db`.
- Restart backend; schema + seed will regenerate.

### Public form shows unavailable
- Form must be published.
- Verify share slug and status.

## Future Improvements

- Real authentication and role-based access
- Webhooks and third-party integrations
- Team collaboration and permissions
- Payment and file-upload question types
- Alembic migrations and multi-environment config
- Hardened production deployment setup


## 4.1 Backend Setup

From repository root:

```bash
cd backend
python -m venv venv
```

Activate virtual environment:

Windows PowerShell:

```powershell
venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run API server:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend defaults:
- API base: `http://localhost:8000`
- Health: `GET /api/health`
- DB file (default): `backend/typeform.db`
- On startup, app auto-creates tables and seeds demo data if no forms exist.

Optional backend environment variable:
- `DATABASE_URL`
  - Default: `sqlite:///backend/typeform.db`
  - Example (Postgres): `postgresql+psycopg://user:pass@host:5432/dbname`

## 4.2 Frontend Setup

From repository root:

```bash
cd frontend
npm install
```

Create `.env.local` in `frontend/` (optional if backend is local default):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Frontend default:
- App URL: `http://localhost:3000`

## 4.3 Production Build

Frontend:

```bash
cd frontend
npm run build
npm run start
```

Backend (example):

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 5. Architecture Overview

## 5.1 High-level flow

```mermaid
flowchart LR
  A[Creator UI - Next.js] -->|HTTP JSON| B[FastAPI Backend]
  C[Public Respondent UI - Next.js] -->|HTTP JSON| B
  B --> D[(SQLite via SQLAlchemy)]
```

## 5.2 Frontend architecture
- Route-level pages in `frontend/src/app`
- Domain components split by surface:
  - `components/builder/*`
  - `components/dashboard/*`
  - `components/respondent/*`
  - `components/results/*`
  - `components/ui/*`
- Data fetching and mutation with TanStack Query
- API layer centralized in `frontend/src/lib/api.ts`
- Branching logic editing stored in question `settings.logic.branches`

## 5.3 Backend architecture
- `app/main.py`
  - Configures FastAPI and permissive CORS (`*`)
  - Registers routers: `/api/forms`, `/api/public`
  - Creates DB tables on startup
  - Seeds demo data if forms table is empty
- Router split:
  - `routers/forms.py` for creator/internal management and analytics
  - `routers/public.py` for published-form consumption and response submit
- Validation:
  - `validation.py` validates and coerces answer values by question type
  - Renders human-readable `value_text` for tables and CSV

## 6 JSON columns
- `questions.options`:
  - for choice/dropdown, array of objects like:
  - `[ { "id": "opt_ab12", "label": "Option A" } ]`
- `questions.settings`:
  - type-specific configuration, examples:
  - rating max: `{ "max": 5 }`
  - number bounds: `{ "min": 0, "max": 120 }`
  - branching rules (logic jumps):
    ```json
    {
      "logic": {
        "branches": [
          { "match_value": true, "target_question_id": 42 },
          { "operator": "gte", "match_value": 4, "target_question_id": null }
        ]
      }
    }
    ```

## 7. API Overview

Base URL:
- local backend: `http://localhost:8000`

Health:
- `GET /api/health`

Error patterns:
- 404 for missing form/response or unpublished public form
- 400 for publish-without-questions
- 422 with structured validation errors for response submit

## 7.1 Creator APIs (`/api/forms`)

### List forms
- `GET /api/forms`
- Returns: `FormListItemOut[]`
- Adds computed fields:
  - `response_count`
  - `question_count`

### Create form
- `POST /api/forms`
- Body:
  ```json
  { "title": "Customer Feedback", "description": "Optional" }
  ```
- Returns: `FormDetailOut`

### Get single form
- `GET /api/forms/{form_id}`
- Returns: `FormDetailOut`

### Patch form metadata
- `PATCH /api/forms/{form_id}`
- Body supports:
  - `title`
  - `description`
  - `welcome_title`
  - `welcome_description`
  - `thank_you_message`
  - `theme_color`
  - `theme_background`
- Returns: `FormDetailOut`

### Replace all questions
- `PUT /api/forms/{form_id}/questions`
- Body:
  ```json
  {
    "questions": [
      {
        "id": 12,
        "type": "multiple_choice",
        "title": "How did you hear about us?",
        "description": null,
        "required": false,
        "options": [
          { "id": "opt_a", "label": "Search" },
          { "id": "opt_b", "label": "Friend" }
        ],
        "settings": {
          "logic": {
            "branches": [
              { "match_value": "opt_b", "target_question_id": null }
            ]
          }
        }
      }
    ]
  }
  ```
- Notes:
  - Full-replace strategy
  - Existing IDs are updated in place
  - Missing existing IDs are deleted
  - Missing/undefined IDs are inserted as new

### Delete form
- `DELETE /api/forms/{form_id}`
- Returns: `204 No Content`

### Duplicate form
- `POST /api/forms/{form_id}/duplicate`
- Returns: duplicated `FormDetailOut` as draft

### Publish form
- `POST /api/forms/{form_id}/publish`
- Rule: at least one question required
- Returns: `FormDetailOut`

### Unpublish form
- `POST /api/forms/{form_id}/unpublish`
- Returns: `FormDetailOut`

### List responses for form
- `GET /api/forms/{form_id}/responses`
- Returns: `ResponseListItemOut[]`
- Includes computed `answer_count`

### Get one response
- `GET /api/forms/{form_id}/responses/{response_id}`
- Returns: `ResponseDetailOut`

### Export responses CSV
- `GET /api/forms/{form_id}/responses/export.csv`
- Returns: streaming CSV file
- Header format:
  - fixed columns: `response_id, started_at, submitted_at, completed`
  - then one column per question title

### Form summary analytics
- `GET /api/forms/{form_id}/summary`
- Returns: `FormSummaryOut`
- Includes:
  - totals and completion rate
  - per-question summary
    - choice/dropdown counts
    - yes/no counts
    - number/rating average
    - text sample answers (up to recent 5)

## 7.2 Public APIs (`/api/public`)

### Get published form by share slug
- `GET /api/public/forms/{share_slug}`
- Returns: `PublicFormOut`
- Only published forms are visible

### Submit response
- `POST /api/public/forms/{share_slug}/responses`
- Body:
  ```json
  {
    "completed": true,
    "answers": [
      { "question_id": 101, "value": "Jane" },
      { "question_id": 102, "value": "jane@example.com" },
      { "question_id": 103, "value": true }
    ]
  }
  ```
- Returns: `ResponseDetailOut`
- Validation behavior:
  - validates each form question by type
  - required checks on empty values
  - coercion examples:
    - number -> float
    - rating -> int
    - yes/no -> bool
- On validation failure:
  - HTTP 422
  - `detail.errors` array with entries:
    - `question_id`
    - `message`

## 8. Authentication Model (Current)

Creator auth is intentionally simplified.
- Backend uses `get_default_creator()` to always operate as one seeded/default creator.
- No login/session/JWT is required for creator APIs in this assignment implementation.

## 9. Seed Data Behavior

On backend startup:
- Tables are created via SQLAlchemy metadata.
- If no forms exist, demo data is inserted (multiple forms + sample responses).

This gives immediate content for dashboard, builder, and analytics pages.

## 10. Scripts and Commands

### Frontend
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - serve production build
- `npm run lint` - lint checks

### Backend
- `uvicorn app.main:app --reload --port 8000` - run API in dev mode

## 11. Troubleshooting

### Frontend cannot reach API
- Ensure backend runs on `:8000`.
- Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
- Restart frontend after env changes.

### Database reset
- Stop backend.
- Delete `backend/typeform.db`.
- Restart backend; schema + seed will regenerate.

### Public form shows unavailable
- Form must be published.
- Verify share slug and status.

## 12. Future Improvements

- Real authentication and role-based access
- Webhooks and third-party integrations
- Team collaboration and permissions
- Alembic migrations and multi-environment config
- Hardened production deployment setup
