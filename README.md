# Mini LMS - Final Integrated Version 🎓

Welcome to the official repository for the **Mini Learning Management System**. This project was developed as the final submission for the **CSE 301 — Database Systems Project**.

It is a full-featured, production-ready system that vastly exceeds the standard CRUD requirements, featuring enterprise-grade security, interactive markdown, and local video streaming.

---

## 🚀 Project Overview
This system is a full-stack educational platform that manages courses, assignments, attendance, discussions, and grading. It supports three primary user roles: **Instructors, Assistants, and Students**, each with a dedicated and feature-rich dashboard.

---

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Zustand (State Management), `@uiw/react-md-editor` (Markdown + LaTeX).
- **Backend**: Node.js, Express.js, MSSQL (SQL Server).
- **Security**: JWT (Access & Refresh Tokens), Bcrypt (Password Hashing), Helmet, Zod (Data Validation), Rate Limiting.
- **Media**: Multer (File Uploads), React-Player (Local Video Streaming).

---

## 🏆 CSE 301 Deliverables Included
This repository contains everything needed for the **CSE 301 Database Project** defense:
1. **Frontend & Backend Source Code**: Fully integrated and working.
2. **`LMS_Backend/database.sql`**: The DDL script for generating the entire SQL Server relational schema.
3. **`LMS_Backend/CSE301_Phase5_Queries.sql`**: The Phase 5 script containing:
   - Meaningful Sample Data (15+ records per table).
   - 10 Advanced SQL Queries (INNER/LEFT JOIN, GROUP BY, HAVING, AVG, SUM).
   - `UPDATE` and `DELETE` operations.
   - 2 SQL Views (Student Academic Info & Course Enrollment Summary).
   - 2 Stored Procedures (Safe Student Enrollment & Final Grade Calculation).

---

## ✨ Features

### 🛡️ Enterprise Security & Backend
- **Advanced Authentication**: JWT access and refresh token rotation, bcrypt password hashing.
- **Role-Based Access Control**: Route guards and API middleware restricted by Instructor, Assistant, or Student roles.
- **Security Hardening**: Zod schema validation to prevent SQL injection, Express Rate Limiting to prevent brute force attacks, and an Audit Log that tracks security events.
- **Account Lockout**: Automatic 15-minute account lockout after 5 failed login attempts.

### 🎨 Premium UI/UX
- **Glassmorphism Design**: High-end interface using CSS Glassmorphism, modern typography (Outfit font), and deep navy gradients.
- **Dark Mode**: Fully supported Light and Dark mode themes, managed via local storage.
- **Framer Motion Animations**: Smooth page transitions, modal popups, and micro-interactions.
- **In-App Notifications**: Real-time polling dropdown notification bell.

### 📚 Advanced Learning Tools (v2)
- **Interactive Markdown**: Discussion forums support rich text, code block syntax highlighting, and LaTeX math equations (via KaTeX).
- **Local Video Streaming**: Course materials automatically detect `.mp4`/`.webm` files and render an embedded cinematic video player that streams directly from the Node backend (No AWS required).
- **Student Analytics**: A dedicated dashboard for students to track their GPA, assignment scores, and attendance visually.

---

## 💻 How to Run Locally

### 1. Database Setup
1. Open SQL Server Management Studio (SSMS).
2. Create a new database named `LMS`.
3. Execute `LMS_Backend/database.sql` to build the tables.
4. Execute `LMS_Backend/CSE301_Phase5_Queries.sql` to populate the sample data and create the Views/Procedures.

### 2. Backend
```bash
cd LMS_Backend
npm install
# Copy .env.example to .env and configure your SQL Server credentials
node app.js
```

### 3. Frontend
```bash
cd mini-lms-frontend
npm install
npm run dev
```

---
**Developed for Mini Engineering - CSE Department.**
