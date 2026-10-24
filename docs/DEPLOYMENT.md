# Anas Khan Deployment & Operations Guide

## 1. Local Development Setup

### Prerequisites
- Node.js 18+ (20+ recommended)
- Python 3.10+
- npm or pnpm

### Quickstart
1. Install Node.js packages:
   ```bash
   npm install
   ```
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run automated backend tests:
   ```bash
   PYTHONPATH=backend pytest backend/tests/test_api.py -v
   ```
4. Start development server (boots both Express proxy & FastAPI on port 3000):
   ```bash
   npm run dev
   ```

---

## 2. Docker Deployment

Build and launch the complete production container:
```bash
docker-compose up --build -d
```
Access the application at `http://localhost:3000`.

---

## 3. Split Cloud Deployment (Static Frontend + Python Backend)

### Frontend (Vercel / Netlify / Cloudflare Pages)
1. Build the production static distribution:
   ```bash
   npm run build
   ```
2. Set build output directory to `dist`.
3. Configure `VITE_API_URL` to point to your hosted FastAPI backend (e.g., `https://api.yourdomain.com`).

### Backend (Google Cloud Run / Render / Railway)
1. Deploy `backend/` directory using the provided `requirements.txt`.
2. Start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. Ensure CORS origins in `backend/app/main.py` include your production frontend URL.
