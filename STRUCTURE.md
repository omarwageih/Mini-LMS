# Project Structure Guide 🗺️

This document explains what every folder and key file in the **LMS Project** does, so you can easily navigate and understand the code.

---

## 🏗️ 1. LMS Backend (`/LMS_Backend`)
The "brain" of the application. It handles data storage, security, and logic.

- **`app.js`**: The main entry point. It sets up the server, security (Helmet, CORS), and routes.
- **`socket.js`**: Handles real-time connections using WebSockets (for instant notifications).
- **`/config/db.js`**: Connects the app to your SQL Server database.
- **`/routes/`**: Defines the "URLs" of the API (e.g., `/api/auth`, `/api/student`).
- **`/controllers/`**: Contains the logic for each route (e.g., how to login, how to submit an assignment).
- **`/middleware/`**: Functions that run before reaching the logic (e.g., checking if a user is logged in).
- **`/database/`**: Contains `migrate.js`, which automatically builds your database tables.

---

## 🎨 2. LMS Frontend (`/mini-lms-frontend`)
The user interface that students and instructors see.

- **`src/main.jsx`**: The starting point of the React app.
- **`src/App.jsx`**: The "Router". It decides which page to show based on the URL and user role.
- **`/src/pages/`**: Contains the actual screens (Dashboard, Login, Course Details, etc.).
- **`/src/components/`**: Reusable parts of the UI like the Sidebar, Breadcrumbs, and Buttons.
- **`/src/services/`**: API service layer using Axios for backend communication.
- **`/src/stores/`**: State management using Zustand.

---

## 📝 3. Root Files
- **`docker-compose.yml`**: Used to run the entire system inside "Containers" (advanced setup).
- **`README.md`**: The main "How-to" guide for the project.

---

## 💡 Quick Tips
- **Where is the logic?** Look in `LMS_Backend/controllers`.
- **Where are the designs?** Look in `LMS_Frontend/src/pages`.
- **How is the database connected?** Check `LMS_Backend/config/db.js`.
