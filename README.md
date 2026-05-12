<div align="center">
  <img src="./assets/preview.png" alt="LMS Preview" width="800">
  
  # 🚀 Mini LMS & Discord Suite
  
  **A Comprehensive Learning Management System with Real-Time Engagement**
  
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/en-us/sql-server)
  [![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  *Empowering education through seamless integration of management tools and community communication.*
</div>

---

## 🌟 Key Features

- **👨‍🎓 Student Portal**: Track course progress, submit assignments, and receive real-time feedback.
- **👨‍🏫 Instructor Dashboard**: Comprehensive course management, student oversight, and grading tools.
- **🛡️ Assistant Access**: Specialized role for grading support and course activity management.
- **💬 Real-Time Messaging**: Built-in instant messaging for students and staff.
- **🔔 Smart Notifications**: Stay updated with instant alerts via WebSockets.
- **🌓 Adaptive Theme**: Seamless switching between stunning Light and Dark modes.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: Microsoft SQL Server
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React.js (Vite)
- **State Management**: React Context API
- **Styling**: Vanilla CSS (Modern Design System)
- **Routing**: React Router

---

## 📂 Project Structure

- **[`LMS_Backend`](./LMS_Backend)**: The core API server, database controllers, and business logic.
- **[`mini-lms-frontend`](./mini-lms-frontend)**: The user interface built for performance and aesthetics.

> [!TIP]
> For a deep dive into the file architecture, check out our [**STRUCTURE.md**](./STRUCTURE.md).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v16+)
- **SQL Server** (Express or Developer edition)

### 2. Database Setup
1. Create a database named `MiniLMS`.
2. Configure your credentials in `LMS_Backend/.env`.
3. The system will automatically run migrations on startup.

### 3. Installation & Run

```bash
# Setup Backend
cd LMS_Backend
npm install
npm start

# Setup Frontend
cd ../mini-lms-frontend
npm install
npm run dev
```

---

## 👥 Roles & Permissions

| Role | Course View | Manage Students | Grading | Admin Panel |
| :--- | :---: | :---: | :---: | :---: |
| **Instructor** | ✅ | ✅ | ✅ | ✅ |
| **Assistant** | ✅ | ❌ | ✅ | ❌ |
| **Student** | ✅ | ❌ | ❌ | ❌ |

---

<div align="center">
  <sub>Created for the CSE 301 Database Project. Built with ❤️ for better learning.</sub>
</div>
