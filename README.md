# Cloud-Based HR Management System (Secure Demo)

Full-stack HR Management System focused on cybersecurity concepts for final year project demos.

## Stack

- Frontend: React + Tailwind CSS (`client/`)
- Backend: Node.js + Express (`server/`)
- Database: MongoDB + Mongoose
- Auth: JWT + RBAC + bcrypt + mock MFA

## Implemented Features

- Authentication: signup/login, hashed passwords, JWT, role-based permissions
- Roles: `Admin`, `HR Manager`, `Employee`, `Auditor`
- Employee management: CRUD with role restrictions and self-profile access
- Payroll: controlled salary access/update by authorized roles only
- Leave management: employee apply, HR/Admin approve or reject
- Dashboard:
  - Admin: total employees, suspicious activities, pending leaves
  - Employee: profile and leave status

## Cybersecurity Controls

- `helmet` security headers
- strict CORS allowlist from env
- login rate limiting via `express-rate-limit`
- validation middleware to block NoSQL injection patterns
- RBAC middleware on protected routes
- session inactivity timeout middleware
- audit logging model for login, employee changes, salary updates, leave actions
- anomaly/rule-based detection:
  - multiple failed login attempts (account lock + critical log)
  - large dataset access warnings
- canary token simulation endpoint: `GET /api/fake-salary` logs critical alert
- HTTPS-ready deployment note in backend startup log (for reverse-proxy TLS)

## STRIDE Mapping (Project Narrative)

- **Spoofing**: JWT verification, MFA step in login flow
- **Tampering**: validation middleware + mongoose validation
- **Repudiation**: centralized audit logs with actor, action, timestamp, IP
- **Information Disclosure**: RBAC + least privilege route guards
- **Denial of Service**: login rate limiting
- **Elevation of Privilege**: role checks on all sensitive endpoints

## Project Structure

```text
client/
server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
```

## Run Locally

1. **Backend**
   - `cd server`
   - `npm install`
   - copy `.env.example` to `.env` and fill values
   - `npm run dev`

2. **Frontend**
   - `cd client`
   - `npm install`
   - copy `.env.example` to `.env`
   - `npm run dev`

3. Open `http://localhost:5173`

## HTTPS Deployment Note

Use a reverse proxy (Nginx/Caddy) with TLS certificate and forward traffic to the Node app on internal HTTP.
Set secure CORS origin and strong `JWT_SECRET` in production.

## Deploy Online (Vercel + Render + Atlas)

### 1) Backend on Render

- Push this repo to GitHub (already done)
- In Render, create a **Web Service** from this repo
- Render will auto-detect `render.yaml` from repo root
- Set secret env vars in Render dashboard:
  - `MONGO_URI` = MongoDB Atlas connection string
  - `JWT_SECRET` = strong random secret
  - `CLIENT_ORIGIN` = your Vercel frontend URL (example: `https://your-app.vercel.app`)
- After deploy, verify backend health:
  - `https://<render-service>.onrender.com/api/health`

### 2) Frontend on Vercel

- Import this same repo to Vercel
- Set **Root Directory** to `client`
- Build settings:
  - Build command: `npm run build`
  - Output directory: `dist`
- Add environment variable:
  - `VITE_API_URL` = `https://<render-service>.onrender.com/api`
- Deploy

### 3) Final Check

- Open your Vercel URL
- Test login, dashboard, employee actions, and leave flow
- Ensure there are no CORS errors in browser console
