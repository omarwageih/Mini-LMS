# Mini LMS & Discord Bot Suite 🚀

Welcome to the unified **Mini LMS (Learning Management System)** and **Discord Bot** project. This suite is designed to provide a comprehensive educational platform integrated with community engagement tools.

## 📂 Project Structure

The project is organized into three main components:

- **[LMS_Backend](./LMS_Backend)**: A Node.js Express server that handles the database, authentication, and API logic.
- **[LMS_Frontend](./LMS_Frontend)**: A modern React application (Vite-based) for students, instructors, and assistants.


---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Express or Developer edition)
- A Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))

### 2. Database Setup
1. Create a database named `MiniLMS`.
2. Configure your credentials in `LMS_Backend/.env`.
3. The backend will automatically run migrations on startup to create the necessary tables.

### 3. Installation
Install dependencies for each part:

```bash
# Backend
cd LMS_Backend
npm install

# Frontend
cd LMS_Frontend
npm install

# Discord Bot
cd Discord_Bot
npm install
```

### 4. Running the Project
```bash
# Start Backend (Port 3000)
cd LMS_Backend
npm start

# Start Frontend (Port 5173)
cd LMS_Frontend
npm run dev
```


---

## 📖 Documentation
- For a detailed breakdown of what every file does, check out [STRUCTURE.md](./STRUCTURE.md).
- Detailed comments have been added directly to the source code to help you understand the logic.

---

## 👥 Roles
- **Students**: Can view courses, submit assignments, and check grades.
- **Instructors**: Can manage courses, students, assistants, and grade submissions.
- **Assistants**: Can help with grading and manage course activities.

---
*Created for CSE 301 Database Project.*
