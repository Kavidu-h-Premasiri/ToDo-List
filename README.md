🌐 Live Demo
Access the live application here: http://taskflow-sthree-225642768226-ap-south-1-an.s3-website.ap-south-1.amazonaws.com

✨ Features
🔐 Authentication & Authorization
User registration and login with JWT

Secure password hashing with bcrypt

Protected routes and API endpoints

Role-based access control (Admin/Member)

👥 Team Management
Create and manage teams

Invite members via email

Role-based permissions (Admin/Member)

Admin: Can manage team members, assign tasks, delete tasks

Member: Can view assigned tasks and update status

📋 Task Management
Create, read, update, delete tasks

Assign tasks to team members

Task status tracking (Pending, In Progress, Completed)

Priority levels (Low, Medium, High)

Due date management

Personal and team tasks

💬 Real-time Messaging
Team-based chat rooms

File attachments: Images, documents, and media securely hosted on Amazon S3

Message read receipts & unread message count

Real-time notifications

🔔 Notifications
Task assignment & status update notifications

New message notifications

Read/unread status management

Mark all as read feature

👤 User Profile
Profile photo upload: Handled via multi-part upload directly integrated with Amazon S3 storage

Edit profile information

View account details

🚀 Automated CI/CD Pipeline
Fully automated build and deployment strategy using an AWS Pipeline

Automated testing, containerization, and blue-green deployments to minimize downtime

🏗️ Architecture & CI/CD Pipeline
TaskFlow utilizes a modern DevOps lifecycle managed via an AWS CI/CD Pipeline (or GitHub Actions tied with AWS developer tools) ensuring rapid, reliable updates.

[ Developer Push ] ➡️ [ GitHub Repository ]
                              ⬇️ (Webhook Trigger)
                      [ AWS CodePipeline ]
                              ⬇️
                      [ AWS CodeBuild ] ➡️ (Compiles Go/Vite & Builds Docker Images)
                              ⬇
                      [ Amazon ECR ] ➡️ (Stores Secured Container Images)
                              ⬇
                      [ AWS EC2 / ECS ] ➡️ (Deploys multi-container App via Nginx)
                              ▲
                      [ Amazon S3 ] 🖥️ (Serves Static Profile Media & Chat Attachments)
Project Builder Config
The build pipeline utilizes multi-stage Dockerfiles serving as our reliable internal Project Builder.

Backend Builder: Compiles the Golang binaries in a lightweight Alpine environment.

Frontend Builder: Leverages Node environment to compile optimized static assets via Vite before passing them to Nginx.

🛠️ Tech Stack
Frontend
React 18 - UI Framework

TypeScript - Type safety

Tailwind CSS - Styling

Vite - Build tool

React Router DOM - Navigation

Lucide React - Icons

Backend
Go (Golang) 1.25 - Backend language

Gin - Web framework

GORM - ORM for PostgreSQL

JWT - Authentication

bcrypt - Password hashing

AWS SDK for Go v2 - For native Amazon S3 bucket management

Database & Storage
PostgreSQL 15 - Primary relational database

Amazon S3 (Simple Storage Service) - Secure, scalable cloud object storage for profile pictures and messaging attachments

DevOps & Cloud Infrastructure
AWS CodePipeline & CodeBuild - Continuous Integration / Continuous Deployment (CI/CD)

Docker & Docker Compose - Containerization and local multi-container orchestration

Nginx - Reverse proxy and static file server for the React frontend

📦 Prerequisites
Docker Desktop (v24.0.0 or higher)

Docker Compose (v2.0.0 or higher)

Git (for cloning the repository)

AWS Account (with S3 and Access Key permissions configured)

4GB RAM minimum (8GB recommended)

🚀 Quick Start
Method 1: Using Docker Hub Images (Recommended)
Bash
# Pull images from Docker Hub
docker pull kavidu272/taskflow-backend:v1
docker pull kavidu272/taskflow-frontend:v1

# Clone the repository
git clone https://github.com/Kavidu-h-Premasiri/ToDo-List.git
cd taskflow

# Update .env with your settings (Including AWS S3 configuration details)
# Edit .env file with your preferred editor

# Run the application
docker-compose up -d