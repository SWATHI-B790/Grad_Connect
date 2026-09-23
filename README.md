# Complete MERN Authentication System (User & Admin)

A complete, production-ready MERN stack web application featuring separate User Login and Admin Login, role-based authorization, JWT authentication stored securely in `httpOnly` cookies, and `bcrypt` password hashing.

---

## 🚀 System Architecture & Flow

1. **User Registration**:
   - `POST /api/auth/register` creates user with default `role: "user"`.
   - Passwords are validated (min 6 chars) and hashed using `bcrypt` (10 salt rounds).

2. **User & Admin Login**:
   - `POST /api/auth/login` verifies normal users.
   - `POST /api/auth/admin-login` verifies admin users and enforces `role === "admin"`.
   - On successful credentials check, `lastLogin` is updated in MongoDB and a signed JWT token is dispatched inside an `httpOnly` cookie (`sameSite: "lax"`).

3. **Admin Dashboard**:
   - `GET /api/admin/users` is guarded by `protect` and `adminOnly` middleware.
   - Non-admins or unauthenticated users receive HTTP `401` or `403` status codes.
   - Admin Dashboard displays total registered user statistics and live tabular user details.

4. **Persistent Session**:
   - `GET /api/auth/profile` checks the `httpOnly` cookie on app reload so browser refreshes maintain active session.

---

## 📋 Prerequisites

- **Node.js**: v18+ or v24+
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **npm**: v9+ or v10+

---

## 🛠️ Environment Variables Setup

Create a `.env` file inside `mern-auth-app/backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mern_auth_db
JWT_SECRET=supersecretlongrandomjwtkey_mern_auth_2026_secure
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPassword123!
```

---

## 🔑 Initial Admin Creation

Run the administrative creation script to seed or update the primary admin account using your `.env` credentials:

```bash
cd backend
node createAdmin.js
```

---

## 🚀 Running the Application

### 1. Backend Server Setup

```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 2. Frontend Application Setup

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔗 URLs & Endpoints

| Environment | URL |
|---|---|
| **Frontend Web App** | `http://localhost:5173` |
| **Backend API Base** | `http://localhost:5000/api` |
| **Health Check** | `GET http://localhost:5000/api/health` |

### API Endpoint Summary

- `POST /api/auth/register` - Public: Register new user
- `POST /api/auth/login` - Public: User login
- `POST /api/auth/admin-login` - Public: Admin login
- `POST /api/auth/logout` - Public: Clear httpOnly JWT cookie
- `GET /api/auth/profile` - Protected: Current user profile
- `GET /api/admin/users` - Protected (Admin Only): Fetch all registered users

---

## 🧪 Testing Credentials

### Admin Login
- **Email**: `admin@example.com`
- **Password**: `AdminPassword123!`

### Sample User Registration & Login
- **Name**: `Swathi`
- **Email**: `swathi@example.com`
- **Password**: `password123`
