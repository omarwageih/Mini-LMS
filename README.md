# 🎓 MUST University LMS

A full-stack Learning Management System built for **Misr University for Science and Technology (MUST)**.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)
![React](https://img.shields.io/badge/React-v19-blue?logo=react)
![SQL Server](https://img.shields.io/badge/SQL_Server-2019+-red?logo=microsoftsqlserver)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)

---

## 📸 Screenshots

| Login | Student Dashboard |
|-------|------------------|
| Glassmorphic login page | Role-based dashboard with stats |

---

## ✨ Features

### 👨‍🎓 Student Portal
- Dashboard with course progress, grades, and attendance
- View assignments (submitted / pending / missed)
- View quizzes with scores and completion status
- Attendance history with color-coded statuses
- Real-time notifications

### 👨‍🏫 Instructor Portal
- Dashboard with course stats and class averages
- Grade management with manual override support
- Attendance recording (MERGE-based upsert)
- Activity log for system-wide audit

### 👨‍💼 Assistant Portal
- Assigned courses overview
- Submission grading with automatic student notifications
- Pending grading counter

### 🔧 System Features
- **JWT Authentication** with bcrypt + SHA2_256 password support
- **Role-based access control** (Student, Instructor, Assistant)
- **Activity logging** for all critical operations
- **Soft delete** across all entities
- **Real-time notification system** with unread badges

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | Microsoft SQL Server (MSSQL) |
| **Auth** | JWT + bcrypt |

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # API business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── studentController.js
│   │   ├── instructorController.js
│   │   ├── assistantController.js
│   │   ├── courseController.js
│   │   ├── notificationController.js
│   │   └── activityLogController.js
│   ├── middleware/       # JWT auth middleware
│   ├── routes/           # API route definitions
│   └── server.js         # Express entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/   # DashboardLayout
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # All page components
│   │   ├── services/     # Axios API service
│   │   └── App.jsx       # Route definitions
│   └── index.html
│
└── Final_LMS_MUST.sql    # Complete database schema
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **SQL Server** (Express or higher)
- **npm** v9+

### 1. Database Setup
```sql
-- Open SQL Server Management Studio
-- Execute the schema file:
Final_LMS_MUST.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
DB_USER=sa
DB_PASSWORD=your_password
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=MUST_University_LMS
JWT_SECRET=your_jwt_secret
PORT=5000
```

Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`

---

## 📡 API Endpoints

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register new user |

### Student
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/student/dashboard` | Student dashboard |
| GET | `/api/student/courses` | Enrolled courses |
| GET | `/api/student/attendance` | Attendance records |
| GET | `/api/student/assignments` | Assignments & submissions |
| GET | `/api/student/quizzes` | Quizzes & results |

### Instructor
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/instructor/dashboard` | Instructor dashboard |
| GET | `/api/instructor/courses/:id/students` | Students in course |
| POST | `/api/instructor/grade` | Update student grade |
| POST | `/api/instructor/sync-grades` | Sync calculated grades |
| POST | `/api/instructor/attendance` | Record attendance |

### Courses & Notifications
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/courses` | List all courses |
| GET/PUT | `/api/notifications` | Notifications CRUD |
| GET | `/api/activity-log` | Activity history |

---

## 👥 Test Accounts

| Email | Password | Role |
|-------|----------|------|
| `sharaf@eng.must.edu.eg` | `123` | Instructor |
| `ali@eng.must.edu.eg` | `123` | Student |
| `mona@eng.must.edu.eg` | `123` | Student |

---

## 📄 License

This project is for educational purposes at MUST University.
