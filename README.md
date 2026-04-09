# Municipal Grievance Management System

This project is a small end-to-end system for municipalities to:

- Accept public complaints (no login)
- Let users check complaint status using an ID
- Give admins a dashboard (analytics) and a management screen to update complaint status

## How It Works

### 1) Raise a complaint (public)
- The user submits a description (and optionally ward/area/location) from the React UI.
- The backend cleans and normalizes the input:
	- normalizes description (lowercase + whitespace collapse)
	- auto-detects category using keywords (water / garbage / road / electricity)
- The complaint is stored in MongoDB with default status `pending`.

### 2) Deduplication (avoid repeated spam)
- MongoDB has a unique index on `(normalizedDescription, wardKey)`.
- If the same complaint is submitted again (same normalized description + ward), the API returns the existing complaint instead of inserting a duplicate.

### 3) Check status (public)
- Users paste their complaint ID into the UI.
- The frontend calls `GET /complaints/{id}` and shows `status` (pending / in-progress / resolved).

### 4) Admin actions (protected)
Admin routes require a request header:

- `admin-password: <your ADMIN_PASSWORD>`

Admins can:
- List complaints: `GET /complaints`
- Update status: `PUT /complaints/{id}` with `{ "status": "in-progress" }`
- View insights: `GET /insights` (aggregation-based analytics)

## Tech Stack

- Backend: FastAPI + PyMongo + Pydantic
- Database: MongoDB
- Frontend: React (Vite) + Tailwind + Recharts

## Run Locally (Windows / PowerShell)

### Backend
1. Ensure MongoDB is running.
2. Create a `.env` file (copy from `.env.example`) and set:
	 - `MONGODB_URI`
	 - `MONGODB_DB`
	 - `MONGODB_COLLECTION` (optional)
	 - `ADMIN_PASSWORD`
3. Install and run:

```powershell
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (or the next available port).

Optional: set the backend URL for the frontend by creating `frontend/.env`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## UI Pages

- **Raise Complaint**: submit complaint + check status by ID
- **Dashboard**: admin insights (requires admin password)
- **Complaints**: admin list + status update (requires admin password)