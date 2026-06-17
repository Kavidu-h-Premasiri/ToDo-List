# 🚀 TaskFlow - Smart Task Management System

A full-stack task management application with team collaboration features, real-time messaging, and role-based access control.

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login with JWT
- Secure password hashing with bcrypt
- Protected routes and API endpoints
- Role-based access control (Admin/Member)

### 👥 Team Management
- Create and manage teams
- Invite members via email
- Role-based permissions (Admin/Member)
- Admin: Can manage team members, assign tasks, delete tasks
- Member: Can view assigned tasks and update status

### 📋 Task Management
- Create, read, update, delete tasks
- Assign tasks to team members
- Task status tracking (Pending, In Progress, Completed)
- Priority levels (Low, Medium, High)
- Due date management
- Personal and team tasks

### 💬 Real-time Messaging
- Team-based chat rooms
- File attachments (images, documents, etc.)
- Message read receipts
- Unread message count
- Real-time notifications

### 🔔 Notifications
- Task assignment notifications
- Task status update notifications
- New message notifications
- Read/unread status
- Mark all as read

### 👤 User Profile
- Profile photo upload
- Edit profile information
- View account details

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router DOM** - Navigation
- **Lucide React** - Icons

### Backend
- **Go (Golang) 1.25** - Backend language
- **Gin** - Web framework
- **GORM** - ORM for PostgreSQL
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Database
- **PostgreSQL 15** - Primary database
- **GORM** - Database ORM

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy for frontend

## 📦 Prerequisites

- **Docker Desktop** (v24.0.0 or higher)
- **Docker Compose** (v2.0.0 or higher)
- **Git** (for cloning the repository)
- **4GB RAM** minimum (8GB recommended)

## 🚀 Quick Start

### Method 1: Using Docker Hub Images (Recommended)

```bash
# Pull images from Docker Hub
docker pull kavidu272/taskflow-backend:v1
docker pull kavidu272/taskflow-frontend:v1

# Clone the repository
git clone https://github.com/Kavidu-h-Premasiri/ToDo-List.git
cd taskflow

# Update .env with your settings(Optional)
# Edit .env file with your preferred editor

# Run the application
docker-compose up -d