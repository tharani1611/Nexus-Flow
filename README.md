# NexusFlow — Industry-Level Project Management Platform

<div align="center">
  <h3>🚀 Next-Generation Project Management, Built for Modern Teams</h3>
  <p>Inspired by Jira · ClickUp · Asana · Monday.com</p>

  ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
  ![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
  ![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io)
  ![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap)
  ![License](https://img.shields.io/badge/License-MIT-blue)
</div>

--- 

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Authentication System
- JWT + Refresh Token authentication
- User Registration & Login
- Email Verification workflow
- Forgot / Reset Password
- Update Profile & Upload Avatar
- Secure Bcrypt password hashing

### 🏢 Organization Workspaces
- Create and manage multiple workspaces
- Role-based access control (Super Admin, Admin, Manager, Team Lead, Developer, Tester, Viewer)
- Invite team members by email
- Remove or leave workspaces

### 📁 Project Management
- Create, update, delete, and archive projects
- Project types: Personal, Team, Client
- Priority levels, budgets, and deadlines
- Duplicate and clone project structures

### 🗂️ Kanban Board
- Drag-and-drop between columns (Backlog → Todo → In Progress → Review → Testing → Done)
- Real-time board synchronization via Socket.io
- Quick task creation from the board
- Sprint-filtered views

### 🏃 Sprint Management
- Create and manage Agile sprints
- Start sprint, complete sprint with task rollover
- Team capacity and story point tracking
- Sprint goal definitions

### ✅ Task Management
- Rich task fields: title, description, priority, status, due date, story points, labels, assignee, reporter
- Unlimited subtasks with progress tracking
- Checklists with item-level checkboxes
- File attachments (images, PDF, DOCX, XLSX)
- Task duplication, archival, and deletion
- Work time tracking with start/pause/stop timer

### 💬 Comments System
- Threaded comments with nested replies
- Real-time comment updates

### 🗣️ Team Chat
- Workspace general channel
- Per-project channels
- Direct messages between users
- Real-time typing indicators
- Online/offline user status

### 📹 Video Meeting Integration
- Create meeting rooms
- Join active rooms
- Real-time participant tiles with mic/camera status indicators
- Socket.io-based signaling system

### 📅 Calendar
- Monthly calendar grid view
- Task deadlines plotted on calendar days
- Navigate between months

### 🔔 Notifications
- Bell notification center
- Real-time notification delivery
- Mark individual and all-as-read
- Types: Task Assigned, Comment Added, Project Updated, Meeting Scheduled

### 📖 Activity Logs
- Complete workspace audit trail
- Tracks user, action, entity, and timestamp

### 📂 File Manager
- Upload images, PDFs, Word, and Excel documents
- Attach files to specific tasks or projects
- Download and delete file attachments

### 📊 Dashboard Analytics
- Project, Task, Team, Sprint count metrics
- Task Status Pie Chart (Chart.js)
- Priority Distribution Bar Chart (Chart.js)
- Recent activity feed

### ⏱️ Time Tracking
- Start, Pause, Stop timer per task
- Total time spent tracking (stored in seconds)

### 🕐 Attendance Module
- Clock In / Clock Out buttons
- Work hours auto-calculated
- Attendance history with totals, averages

### 🤖 AI Assistant
- Generate descriptive task templates using AI
- AI-powered priority suggestions
- Estimate completion time from story points
- Sprint planning suggestions (optimal capacity allocation)

### 📚 Knowledge Base (Wiki)
- Create and edit wiki/documentation pages
- Versioned article history
- Full-text search across wiki pages

### 🧑‍💼 Client Portal
- Read-only project delivery progress dashboards
- Progress bars and task completion metrics
- Deadline status indicators

### 📄 Reporting System
- Generate PDF Reports (using PDFKit)
- Generate Excel Reports (using ExcelJS)
- Download and manage report history

### 🔍 Global Search
- Search tasks and wiki pages from any view
- Keyboard shortcut (Enter) to trigger search

### 🌙 Dark Mode
- Dark / Light toggle with persistent localStorage preference

### 📱 Mobile Responsive
- Collapsible sidebar on small screens
- Bootstrap 5 responsive grid throughout

---

## 🛠️ Tech Stack

| Layer          | Technology                  |
|----------------|-----------------------------|
| Frontend       | HTML5, CSS3, Vanilla JavaScript (ES Modules), Bootstrap 5, Bootstrap Icons |
| Charts         | Chart.js 4.x               |
| Real-Time      | Socket.io 4.x              |
| Backend        | Node.js 18+, Express.js 4  |
| Database       | MongoDB, Mongoose 8         |
| Authentication | JWT, Bcryptjs, Refresh Tokens |
| File Upload    | Multer                      |
| PDF Export     | PDFKit                      |
| Excel Export   | ExcelJS                     |
| Security       | Helmet, CORS, express-rate-limit |
| Testing        | Mocha, Supertest            |

---

## 📁 Folder Structure

```
NexusFlow/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── upload.js             # Multer file upload configuration
│   ├── controllers/
│   │   ├── activityController.js
│   │   ├── aiController.js
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── fileController.js
│   │   ├── meetingController.js
│   │   ├── notificationController.js
│   │   ├── projectController.js
│   │   ├── reportController.js
│   │   ├── sprintController.js
│   │   ├── taskController.js
│   │   ├── wikiController.js
│   │   └── workspaceController.js
│   ├── middlewares/
│   │   ├── auth.js               # JWT verification middleware
│   │   ├── rateLimiter.js        # Rate limiting (API + Auth)
│   │   ├── roles.js              # Role-based access control
│   │   └── validation.js         # Input validation
│   ├── models/
│   │   ├── Activity.js
│   │   ├── Attendance.js
│   │   ├── Checklist.js
│   │   ├── Comment.js
│   │   ├── File.js
│   │   ├── Meeting.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Project.js
│   │   ├── Report.js
│   │   ├── Sprint.js
│   │   ├── Subtask.js
│   │   ├── Task.js
│   │   ├── User.js
│   │   ├── Wiki.js
│   │   └── Workspace.js
│   ├── routes/
│   │   ├── activityRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── meetingRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── sprintRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── wikiRoutes.js
│   │   └── workspaceRoutes.js
│   ├── services/
│   │   ├── aiService.js          # AI assistant logic
│   │   └── exportService.js      # PDF & Excel generation
│   ├── sockets/
│   │   └── socketHandler.js      # Socket.io event handler
│   ├── tests/
│   │   ├── auth.test.js
│   │   └── task.test.js
│   ├── uploads/                  # Multer uploaded files
│   │   └── reports/              # Generated PDF & Excel reports
│   ├── utils/
│   │   └── mailer.js             # Email utility (console-based mock)
│   └── server.js                 # Application entry point
│
├── frontend/
│   ├── css/
│   │   └── styles.css            # Custom glassmorphism design system
│   ├── js/
│   │   ├── api.js                # Fetch API wrapper with auth
│   │   ├── app.js                # SPA Router & Layout
│   │   ├── socket.js             # Socket.io client service
│   │   ├── state.js              # Client-side state management
│   │   └── views/
│   │       ├── attendanceView.js
│   │       ├── authView.js
│   │       ├── calendarView.js
│   │       ├── chatView.js
│   │       ├── clientPortalView.js
│   │       ├── components.js     # Shared UI components
│   │       ├── dashboardView.js
│   │       ├── kanbanView.js
│   │       ├── meetingView.js
│   │       ├── projectView.js
│   │       ├── reportView.js
│   │       ├── taskDetailView.js
│   │       ├── wikiView.js
│   │       └── workspaceView.js
│   └── index.html                # SPA shell
│
├── .env                          # Local environment variables
├── .env.example                  # Environment template
├── docker-compose.yml            # Docker Compose config
├── Dockerfile                    # Docker build file
├── package.json                  # NPM dependencies and scripts
└── README.md                     # This file
```

---

## ✅ Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** 9+
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** for version control

---

## 💻 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nexusflow.git
cd nexusflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nexusflow
JWT_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
```

> **For MongoDB Atlas**: Replace `MONGO_URI` with your Atlas connection string:
> ```env
> MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nexusflow?retryWrites=true&w=majority
> ```

---

## ⚙️ Configuration

### Environment Variables

| Variable             | Description                        | Default                        |
|----------------------|------------------------------------|--------------------------------|
| `PORT`               | Server port                        | `5000`                         |
| `MONGO_URI`          | MongoDB connection URI              | `mongodb://localhost:27017/nexusflow` |
| `JWT_SECRET`         | JWT access token secret            | (required)                     |
| `JWT_REFRESH_SECRET` | JWT refresh token secret           | (required)                     |

---

## 🚀 Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Access the app at: **http://localhost:5000**

> The backend serves the frontend SPA directly. No separate server needed.

---

## 🧪 Testing

```bash
npm test
```

Tests use **Mocha** + **Supertest** to test API endpoints end-to-end.

**Test Coverage:**
- `auth.test.js` — Registration, Login, Profile, Token Refresh, Logout
- `task.test.js` — Task CRUD, Subtasks, Checklists, Comments, Duplication, Archive, Delete

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require:
```
Authorization: Bearer <access_token>
```

### Endpoints Overview

#### 🔐 Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get tokens |
| GET  | `/auth/verify?token=` | Verify email |
| POST | `/auth/forgot-password` | Send reset link |
| POST | `/auth/reset-password?token=` | Reset password |
| POST | `/auth/refresh-token` | Get new access token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET  | `/auth/profile` | Get user profile *(protected)* |
| PUT  | `/auth/profile` | Update profile *(protected)* |
| POST | `/auth/avatar` | Upload avatar *(protected)* |

#### 🏢 Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workspaces` | Create workspace |
| GET  | `/workspaces` | Get user's workspaces |
| GET  | `/workspaces/:id` | Get workspace details |
| PUT  | `/workspaces/:id` | Update workspace |
| DELETE | `/workspaces/:id` | Delete workspace |
| POST | `/workspaces/:id/invite` | Invite user |
| POST | `/workspaces/:id/remove` | Remove member |
| POST | `/workspaces/:id/leave` | Leave workspace |

#### 📁 Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/workspace/:wsId` | Create project |
| GET  | `/projects/workspace/:wsId` | List workspace projects |
| GET  | `/projects/:id` | Get project details |
| PUT  | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |
| POST | `/projects/:id/archive` | Toggle archive |
| POST | `/projects/:id/duplicate` | Duplicate project |
| POST | `/projects/:id/clone` | Clone project |

#### ✅ Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/workspace/:wsId` | Create task |
| GET  | `/tasks/project/:projId` | List project tasks |
| GET  | `/tasks/:id` | Task details + subtasks + checklists + comments |
| PUT  | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/:id/archive` | Toggle archive |
| POST | `/tasks/:id/duplicate` | Duplicate task |
| POST | `/tasks/:id/timer` | Timer control (start/pause/stop) |
| POST | `/tasks/:id/subtasks` | Add subtask |
| PUT  | `/tasks/subtasks/:id` | Update subtask status |
| DELETE | `/tasks/subtasks/:id` | Delete subtask |
| POST | `/tasks/:id/checklists` | Create checklist |
| POST | `/tasks/checklists/:id/items` | Add checklist item |
| PUT  | `/tasks/checklists/:id/items/:itemId/toggle` | Toggle item |
| DELETE | `/tasks/checklists/:id` | Delete checklist |
| POST | `/tasks/:id/comments` | Add comment |
| DELETE | `/tasks/comments/:id` | Delete comment |

#### 🏃 Sprints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sprints/project/:projId` | Create sprint |
| GET  | `/sprints/project/:projId` | List project sprints |
| POST | `/sprints/:id/start` | Start sprint |
| POST | `/sprints/:id/complete` | Complete sprint |
| PUT  | `/sprints/:id` | Update sprint |
| DELETE | `/sprints/:id` | Delete sprint |

#### 🤖 AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/description` | Generate task description |
| POST | `/ai/priority` | Suggest task priority |
| POST | `/ai/estimate` | Estimate completion time |
| POST | `/ai/sprint-plan` | Sprint planning suggestions |

#### Additional Endpoints
- `/chat/*` — Workspace, Project, Direct messages
- `/meetings/*` — Create, join, end meetings
- `/attendance/*` — Clock in/out, status, logs
- `/wikis/*` — CRUD and search wiki pages
- `/files/*` — Upload, list, delete files
- `/reports/*` — Generate and list reports
- `/notifications/*` — Get, mark-read notifications
- `/activities/*` — Workspace activity logs

---

## 🐳 Deployment

### Docker (Recommended)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Access at `http://localhost:5000`

### Render.com Deployment

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variables from `.env.example`
6. Deploy!

### Railway Deployment

1. Create a project on [railway.app](https://railway.app)
2. Add a **MongoDB** plugin to the project
3. Deploy your repository
4. Set environment variables under **Variables** tab

### Vercel (Frontend Only)

If deploying only the frontend separately:

1. Set the root directory to `frontend/`
2. Configure build settings for static export
3. Update `BASE_URL` in `frontend/js/api.js` to point to your backend URL

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `setup` | `{ userId, workspaceIds }` | Initialize user rooms |
| `join_workspace` | `workspaceId` | Join workspace room |
| `join_project` | `projectId` | Join project room |
| `task_moved` | `{ taskId, project, workspace, sourceStatus, targetStatus }` | Kanban move |
| `send_message` | `{ chatType, targetId, content }` | Send chat message |
| `typing` | `{ workspaceId?, projectId?, recipientId?, userName }` | Typing indicator |
| `join_meeting` | `{ roomName, userName, audioActive, videoActive }` | Join meeting room |
| `meeting_media_toggle` | `{ roomName, audioActive, videoActive }` | Toggle mic/cam |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `user_status` | `{ userId, status }` | Online/Offline status |
| `task_moved_update` | Task data | Kanban sync update |
| `message_received` | Message data | New chat message |
| `typing_update` | Typing data | Typing indicator |
| `notification_received` | Notification data | New notification |
| `user_joined_meeting` | Peer data | Meeting peer joined |
| `user_media_updated` | Media data | Peer media toggled |
| `user_left_meeting` | Peer data | Peer left meeting |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-awesome-feature`
3. Commit your changes: `git commit -m 'Add some awesome feature'`
4. Push to the branch: `git push origin feature/my-awesome-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🏗️ Built With

- **NexusFlow** was designed and developed as an industry-grade project management platform incorporating real-world patterns from tools like Jira, ClickUp, Asana, and Monday.com.
- Powered by a modern Node.js + MongoDB backend with a premium glassmorphism SPA frontend.

---

<div align="center">
  <p>⭐ If you found this project useful, please give it a star!</p>
  <p>Made with ❤️ by the NexusFlow Team</p>
</div>
