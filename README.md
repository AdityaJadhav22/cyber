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
