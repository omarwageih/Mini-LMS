<div align="center">
  <img src="./assets/logo.png" alt="Mini LMS Logo" width="160">
  
  # 🎓 Mini LMS: Full-Stack University Portal
  
  **A sophisticated, role-based Learning Management System designed for modern education.**
  
  ---
  
  [![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/Frontend-React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/en-us/sql-server)
  [![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
  [![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=flat-square)](#)

  *Bridging the gap between students, instructors, and assistants through a unified, glassmorphism-inspired digital environment.*
  
  ---
  
  ### 📱 System Preview
  <img src="./assets/dashboard.png" alt="Dashboard Preview" width="850" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</div>

---

## 💎 Core Experience

### 🚀 **Empowered Learning**
Every student gets a personalized workspace to track their **academic journey**. From instant grade notifications to seamless assignment submissions, the platform is built for speed.

### 🏛️ **Academic Governance**
Instructors wield total control over their courses. Manage **Syllabi**, oversee **Assistant** performance, and handle **Student Enrollment** with a single click.

### ⚡ **Real-Time Synergy**
Powered by **WebSockets**, our system ensures you never miss a beat. Messages and notifications arrive instantly, keeping the academic community connected 24/7.

---

## 🛠️ Architectural Blueprint

<details>
<summary><b>📡 Backend Infrastructure</b></summary>
<br>
<blockquote>
The backend is a robust Node.js cluster utilizing Express for API routing and SQL Server for enterprise-grade data persistence. 
</blockquote>

- **Security**: Hardened with JWT, Helmet, and Rate Limiting.
- **Data**: Complex relational schema with cascaded deletions and automated migrations.
- **Logic**: Clean controller-service pattern for maximum maintainability.
</details>

<details>
<summary><b>🎨 Frontend Excellence</b></summary>
<br>
<blockquote>
A premium React application built on Vite, featuring a custom-crafted CSS design system with full Dark Mode support.
</blockquote>

- **Design**: Modern glassmorphism UI with smooth role-based navigation.
- **State**: Global authentication and theme contexts.
- **Performance**: Optimized asset loading and component memoization.
</details>

---

## 📂 Project Navigation

| Module | Purpose | Key Technologies |
| :--- | :--- | :--- |
| **`LMS_Backend`** | API Services & DB | `Node.js`, `MS SQL`, `JWT` |
| **`mini-lms-frontend`** | UI & User Experience | `React`, `Vite`, `Vanilla CSS` |
| **`assets`** | Brand Identity | `Media`, `Logos` |

> [!IMPORTANT]
> To understand the deep-level logic of each file, please refer to our comprehensive [**STRUCTURE.md**](./STRUCTURE.md).

---

## ⚙️ Deployment Guide

### 1. Environment Prep
Ensure you have **Node.js v16+** and **SQL Server** installed and running on your local machine.

### 2. Ignition
```bash
# Clone the vision
git clone https://github.com/omarwageih/MUST-University-LMS.git

# Ignite Backend
cd LMS_Backend
npm install && npm start

# Launch Frontend
cd ../mini-lms-frontend
npm install && npm run dev
```

---

<div align="center">
  <br>
  <sub><b>CSE 301 Database Project</b></sub><br>
  <sub><i>Crafted with precision for the MUST University community.</i></sub>
</div>
