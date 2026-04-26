# MUST University LMS - Final Integrated Version 🎓

Welcome to the official repository for the **MUST University Learning Management System**. This project has been significantly upgraded from a basic prototype to a full-featured, production-ready system.

---

## 🚀 Project Overview
This system is a full-stack educational platform that manages courses, assignments, attendance, and grading. It supports three primary user roles: **Instructors, Assistants, and Students**, each with a dedicated and feature-rich dashboard.

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express.js, MSSQL (SQL Server).
- **Security**: JWT (Authentication), Bcrypt (Password Hashing).
- **Files**: Multer (File Upload Handling).

---

## 📟 For the BACKEND TEAM
We have transformed the backend into a robust API service. Here is what happened:

### ✅ What we Added:
- **Role-Based Controllers**: Created specialized controllers for `Instructor`, `Assistant`, and `Student` to handle complex business logic.
- **Automatic Migrations**: Added a `migrate.js` system that automatically ensures the database schema is up-to-date (e.g., adding the `FilePath` column to Submissions).
- **File Upload Engine**: Integrated `Multer` to handle physical file storage for student assignments.
- **Seed Data Management**: Implemented a hybrid authentication check that supports both seeded plain-text passwords and secure Bcrypt hashes.

### ⚡ Enhancements:
- **Database Pooling**: Refactored `db.js` to use connection pooling, drastically improving performance under load.
- **Environment Isolation**: Moved all sensitive credentials (DB Port, User, Password) to a `.env` file structure.
- **Clean Routing**: Separated routes into logical entities (`auth`, `instructor`, `assistant`, `student`) for easier maintenance.

---

## 🎨 For the FRONTEND TEAM
The UI has been completely redesigned to offer a premium, glassmorphic experience.

### ✅ What we Added:
- **Instructor Suite**: New pages for managing courses, students, and teaching assistants.
- **Assistant Dashboard**: Dedicated interface for viewing student submissions and recording grades.
- **Dynamic File Handling**: Added file upload components that interact with the backend storage system.
- **Role-based Navigation**: The sidebar and dashboard content now adapt dynamically based on the user's role.

### ⚡ Enhancements:
- **Visual Polish**: implemented a high-end interface using CSS Glassmorphism and modern typography (Inter/Roboto).
- **Centralized API Logic**: All API calls are now managed through a unified service layer to simplify debugging.
- **Responsive Design**: The entire application is now fully responsive, supporting both desktop and mobile users.

---

## 🏁 What we Completed
- **Seamless Integration**: The bridge between React and SQL Server is now fully stable.
- **The Grading Workflow**: Students can upload -> Assistants can grade -> Instructors can monitor.
- **Database Resilience**: Fixed all previous "Login Failed" and "Table not found" errors by standardizing the connection settings.

---

## 💻 How to Run
1.  **Backend**:
    - `cd LMS_Backend`
    - `npm install`
    - Configure your `.env` file.
    - `node app.js`
2.  **Frontend**:
    - `cd must-lms-frontend`
    - `npm install`
    - `npm run dev`

---

**Original Project Forked and Enhanced by the MUST Engineering Team.**
