# Firestore Setup Guide for mysteel Construction

## 🔥 Firebase Authentication Users

Create these users in Firebase Authentication:

### 1. Admin User
- **Email**: `admin@mysteel.com`
- **Password**: `MS2024!Admin#Secure`
- **Role**: admin

### 2. Sales User
- **Email**: `sales@mysteel.com`
- **Password**: `MS2024!Sales#Manager`
- **Role**: sales

### 3. Design User
- **Email**: `design@mysteel.com`
- **Password**: `MS2024!Design#Engineer`
- **Role**: designer

### 4. Production User
- **Email**: `production@mysteel.com`
- **Password**: `MS2024!Prod#Manager`
- **Role**: production

### 5. Installation User
- **Email**: `installation@mysteel.com`
- **Password**: `MS2024!Install#Super`
- **Role**: installation

---

## 📊 Firestore Collections

### Collection: `users`

Create documents for each user with the following structure:

#### Document 1: Admin User
```json
{
  "uid": "[Firebase Auth UID]",
  "name": "System Administrator",
  "email": "admin@mysteel.com",
  "role": "admin",
  "department": "Administration",
  "status": "active",
  "createdAt": "[Timestamp]",
  "lastLogin": "[Timestamp]"
}
```

#### Document 2: Sales User
```json
{
  "uid": "[Firebase Auth UID]",
  "name": "Sales Manager",
  "email": "sales@mysteel.com",
  "role": "sales",
  "department": "Sales",
  "status": "active",
  "createdAt": "[Timestamp]",
  "lastLogin": "[Timestamp]"
}
```

#### Document 3: Design User
```json
{
  "uid": "[Firebase Auth UID]",
  "name": "Design Engineer",
  "email": "design@mysteel.com",
  "role": "designer",
  "department": "Design & Engineering",
  "status": "active",
  "createdAt": "[Timestamp]",
  "lastLogin": "[Timestamp]"
}
```

#### Document 4: Production User
```json
{
  "uid": "[Firebase Auth UID]",
  "name": "Production Manager",
  "email": "production@mysteel.com",
  "role": "production",
  "department": "Production",
  "status": "active",
  "createdAt": "[Timestamp]",
  "lastLogin": "[Timestamp]"
}
```

#### Document 5: Installation User
```json
{
  "uid": "[Firebase Auth UID]",
  "name": "Installation Supervisor",
  "email": "installation@mysteel.com",
  "role": "installation",
  "department": "Installation",
  "status": "active",
  "createdAt": "[Timestamp]",
  "lastLogin": "[Timestamp]"
}
```

---

### Collection: `projects`

Create sample projects:

#### Project 1: Sales Stage
```json
{
  "name": "Warehouse Racking System - KL",
  "description": "Complete warehouse racking solution for Kuala Lumpur facility",
  "amount": 150000,
  "completionDate": "2025-03-15",
  "status": "sales",
  "progress": 10,
  "createdBy": "sales@mysteel.com",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

#### Project 2: Design Stage
```json
{
  "name": "Industrial Storage - Johor",
  "description": "Heavy-duty industrial storage system for manufacturing plant",
  "amount": 280000,
  "completionDate": "2025-04-20",
  "status": "dne",
  "progress": 25,
  "createdBy": "sales@mysteel.com",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

#### Project 3: Production Stage
```json
{
  "name": "Cold Storage Racking - Penang",
  "description": "Specialized cold storage racking system with temperature resistance",
  "amount": 320000,
  "completionDate": "2025-02-28",
  "status": "production",
  "progress": 60,
  "createdBy": "sales@mysteel.com",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

#### Project 4: Installation Stage
```json
{
  "name": "Automated Storage - Selangor",
  "description": "Automated storage and retrieval system integration",
  "amount": 450000,
  "completionDate": "2025-05-10",
  "status": "installation",
  "progress": 85,
  "createdBy": "sales@mysteel.com",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

#### Project 5: Completed
```json
{
  "name": "Retail Display System - Melaka",
  "description": "Custom retail display and storage solution",
  "amount": 95000,
  "completionDate": "2024-12-15",
  "status": "completed",
  "progress": 100,
  "createdBy": "sales@mysteel.com",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

---

### Collection: `complaints`

Create sample complaints:

#### Complaint 1: Installation Department
```json
{
  "title": "Delayed Installation Schedule",
  "description": "Installation team arrived 2 days late, causing project delays",
  "customerName": "ABC Manufacturing Sdn Bhd",
  "projectId": "[Project ID from above]",
  "status": "open",
  "priority": "high",
  "department": "installation",
  "createdBy": "[Sales User UID]",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

#### Complaint 2: Design Department
```json
{
  "title": "Design Specification Issue",
  "description": "Racking dimensions do not match warehouse specifications",
  "customerName": "XYZ Logistics Sdn Bhd",
  "projectId": "[Project ID from above]",
  "status": "in-progress",
  "priority": "medium",
  "department": "designer",
  "createdBy": "[Design User UID]",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

#### Complaint 3: Production Department
```json
{
  "title": "Quality Control Concern",
  "description": "Some welding joints show signs of poor quality",
  "customerName": "DEF Storage Solutions",
  "projectId": "[Project ID from above]",
  "status": "resolved",
  "priority": "high",
  "department": "production",
  "createdBy": "[Production User UID]",
  "createdAt": "[Timestamp]",
  "updatedAt": "[Timestamp]"
}
```

---

## 🚀 Quick Setup Steps

1. **Clear Firestore**: Delete all existing collections and documents
2. **Create Auth Users**: Add the 5 users in Firebase Authentication
3. **Create Collections**: Add the collections and documents as shown above
4. **Test Login**: Use the quick demo buttons on the login page

---

## 🔐 Login Credentials Summary

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mysteel.com | MS2024!Admin#Secure |
| Sales | sales@mysteel.com | MS2024!Sales#Manager |
| Design | design@mysteel.com | MS2024!Design#Engineer |
| Production | production@mysteel.com | MS2024!Prod#Manager |
| Installation | installation@mysteel.com | MS2024!Install#Super |
