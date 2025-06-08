# 🔥 Firebase 集成指南

## 📋 前置准备

### 1. 创建 Firebase 项目
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 "创建项目" 或 "Add project"
3. 项目名称: `mysteel-progress-tracker`
4. 启用 Google Analytics (推荐)
5. 选择 Analytics 账户或创建新账户

### 2. 配置 Web 应用
1. 在项目概览中点击 "Web" 图标 (`</>`)
2. 应用昵称: `Progress Tracker Web`
3. 勾选 "同时为此应用设置 Firebase Hosting"
4. 复制配置信息备用

## 🔧 Firebase 服务配置

### 1. Authentication 设置
```bash
# 在 Firebase Console 中:
# 1. 进入 Authentication > Sign-in method
# 2. 启用 "Email/Password"
# 3. 启用 "Email link (passwordless sign-in)" (可选)
```

### 2. Firestore Database 设置
```bash
# 在 Firebase Console 中:
# 1. 进入 Firestore Database
# 2. 创建数据库
# 3. 选择 "Start in test mode" (开发阶段)
# 4. 选择服务器位置 (推荐: asia-southeast1)
```

### 3. Storage 设置
```bash
# 在 Firebase Console 中:
# 1. 进入 Storage
# 2. 点击 "Get started"
# 3. 选择 "Start in test mode"
# 4. 选择存储位置 (与 Firestore 相同)
```

## 📁 数据库结构设计

### Firestore 集合结构
```
/users/{userId}
  - uid: string
  - email: string
  - name: string
  - role: 'admin' | 'sales' | 'designer' | 'production' | 'installation'
  - department?: string
  - createdAt: timestamp
  - updatedAt: timestamp

/projects/{projectId}
  - id: string
  - projectName: string
  - amount: number
  - estimatedCompletionDate: timestamp
  - status: 'sales' | 'dne' | 'production' | 'installation' | 'completed'
  - createdBy: string (userId)
  - createdAt: timestamp
  - updatedAt: timestamp

/projects/{projectId}/sales/{salesId}
  - submittedBy: string (userId)
  - submittedAt: timestamp
  - notes?: string

/projects/{projectId}/design/{designId}
  - status: 'pending' | 'partial' | 'completed'
  - partialCompletedAt?: timestamp
  - completedAt?: timestamp
  - assignedTo: string (userId)
  - notes?: string

/projects/{projectId}/production/{productionId}
  - milestones: array
    - id: string
    - name: string
    - status: 'pending' | 'in-progress' | 'completed'
    - startDate?: timestamp
    - completedDate?: timestamp
  - assignedTo: string (userId)
  - notes?: string

/projects/{projectId}/installation/{installationId}
  - milestones: array
    - id: string
    - name: string
    - status: 'pending' | 'in-progress' | 'completed'
    - photos: array
      - url: string
      - uploadedAt: timestamp
      - uploadedBy: string (userId)
  - assignedTo: string (userId)

/complaints/{complaintId}
  - projectId?: string
  - title: string
  - description: string
  - status: 'pending' | 'investigating' | 'resolved' | 'closed'
  - submittedBy: string (userId)
  - submittedAt: timestamp
  - resolution?: string
  - resolvedAt?: timestamp
```

## 🔐 Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'sales'];
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Sales subcollection
      match /sales/{salesId} {
        allow read, write: if request.auth != null;
      }
      
      // Design subcollection
      match /design/{designId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'designer'];
      }
      
      // Production subcollection
      match /production/{productionId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'production'];
      }
      
      // Installation subcollection
      match /installation/{installationId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'installation'];
      }
    }
    
    // Complaints collection
    match /complaints/{complaintId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.submittedBy || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Installation photos
    match /installation/{projectId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid != null &&
        resource.size < 10 * 1024 * 1024 && // 10MB limit
        resource.contentType.matches('image/.*');
    }
    
    // User avatars
    match /avatars/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        resource.size < 5 * 1024 * 1024 && // 5MB limit
        resource.contentType.matches('image/.*');
    }
  }
}
```

## 🔧 环境配置

### 1. 创建环境变量文件
```bash
# 复制示例文件
cp .env.example .env.local
```

### 2. 填入 Firebase 配置
```env
# .env.local
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=mysteel-progress-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mysteel-progress-tracker
VITE_FIREBASE_STORAGE_BUCKET=mysteel-progress-tracker.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## 🚀 部署配置

### 1. 安装 Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. 登录 Firebase
```bash
firebase login
```

### 3. 初始化项目
```bash
firebase init
# 选择:
# - Firestore
# - Hosting
# - Storage
# - Functions (可选)
```

### 4. 配置 firebase.json
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

## 📊 初始数据设置

### 创建管理员用户
```javascript
// 在 Firebase Console > Authentication 中手动创建
// 或使用 Firebase Admin SDK 脚本
const adminUser = {
  email: 'admin@mysteel.com',
  password: 'SecurePassword123!',
  displayName: 'System Administrator'
};
```

### 测试数据
```javascript
// 可以通过 Firebase Console 或脚本添加测试项目
const testProject = {
  projectName: 'Test Project 1',
  amount: 50000,
  estimatedCompletionDate: new Date('2025-06-30'),
  status: 'sales',
  createdBy: 'admin-uid',
  createdAt: new Date(),
  updatedAt: new Date()
};
```

## ✅ 验证清单

- [ ] Firebase 项目创建完成
- [ ] Authentication 配置完成
- [ ] Firestore 数据库创建完成
- [ ] Storage 配置完成
- [ ] Security Rules 部署完成
- [ ] 环境变量配置完成
- [ ] Firebase CLI 安装完成
- [ ] 初始用户创建完成
- [ ] 测试数据添加完成
- [ ] 本地开发环境测试通过

## 🔄 下一步

完成 Firebase 设置后，继续进行:
1. **认证系统升级** - 替换 Mock 认证
2. **数据服务层实现** - 创建 Firebase 服务
3. **实时数据同步** - 实现 Firestore 监听
4. **图片上传功能** - 集成 Storage 服务
