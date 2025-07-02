# Progress Tracker App

A comprehensive project management system for Mysteel Construction with role-based access control and real-time collaboration features.

## 🚀 Features

### Core Modules
- **Sales Module** - Project creation and sales management
- **Design & Engineering** - Design workflow with partial/completed status
- **Production** - Manufacturing progress with milestone tracking
- **Installation** - Installation progress with photo uploads
- **Master Tracker** - Overview of all projects across modules
- **Complaints** - Issue tracking and resolution

### Key Capabilities
- **Role-Based Access Control** - Admin, Sales, Designer, Production, Installation roles
- **Real-time Collaboration** - Document locking and presence indicators
- **Offline-First Architecture** - Works without internet connection
- **Progressive Web App** - Install on mobile and desktop
- **Automatic Workflow** - Projects flow between modules automatically

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Firebase Firestore + Authentication
- **Build Tool**: Vite
- **Offline Storage**: IndexedDB
- **Real-time**: Firebase Realtime Listeners

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/WeBot-IT-Services/progress-tracker-app.git
   cd progress-tracker-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🔐 Demo Credentials

Use these credentials to test different roles:

- **Admin**: admin@mysteer.com / WR2024
- **Sales**: sales@mysteer.com / WR2024  
- **Designer**: design@mysteer.com / WR2024
- **Production**: production@mysteer.com / WR2024
- **Installation**: installation@mysteer.com / WR2024

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin panel
│   ├── sales/          # Sales module
│   ├── design/         # Design & Engineering
│   ├── production/     # Production module
│   ├── installation/   # Installation module
│   ├── tracker/        # Master Tracker
│   ├── complaints/     # Complaints module
│   └── common/         # Shared components
├── services/           # Business logic
│   ├── firebaseService.ts
│   ├── workflowService.ts
│   ├── collaborativeService.ts
│   └── offlineFirstService.ts
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## 🔄 Workflow

1. **Sales** creates projects
2. **Design** receives projects automatically
3. **Design** can mark as partial (stays in WIP) or completed (moves to History)
4. **Completed designs** flow to Production or Installation
5. **Production** manages milestones with image uploads
6. **Installation** tracks progress with photo documentation
7. **Master Tracker** provides overview across all modules

## 🚀 Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 📱 PWA Features

- Install on mobile devices
- Offline functionality
- Background sync
- Push notifications (future)

## 🔧 Development

- **Linting**: `npm run lint`
- **Type checking**: Built into Vite
- **Hot reload**: Automatic in dev mode

## 📄 License

Private project for Mysteel Construction.

## 🆘 Support

For technical support, contact: jinzhang@webotitservices.org

---

**Note**: All test files, documentation, and setup scripts have been moved to the `archive/` folder to keep the project clean.
