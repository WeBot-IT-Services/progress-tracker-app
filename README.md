# Progress Tracker App - Mysteel Construction

A comprehensive progress tracking web application for Mysteel Construction Sdn Bhd, built with React.js, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   - Navigate to `http://localhost:5174` (or the port shown in terminal)

## 🧪 Testing the Application

### Test Accounts (Password: `password123`)
- **Admin**: `admin@mysteel.com` - Full access to all modules
- **Sales**: `sales@mysteel.com` - Sales module access
- **Designer**: `designer@mysteel.com` - Design module access
- **Production**: `production@mysteel.com` - Production module access
- **Installation**: `installation@mysteel.com` - Installation module access

### Features to Test

1. **🔐 Authentication**
   - Login with any test account
   - Try registration (creates new mock user)
   - Logout functionality

2. **🏠 Dashboard**
   - Role-based module visibility
   - Module navigation cards
   - User profile display

3. **📊 Sales Module**
   - Submit new projects
   - View project history
   - Tab navigation

4. **🎨 Design Module**
   - Mark projects as partial/completed
   - WIP and History tabs
   - Status management

5. **🏭 Other Modules**
   - Production, Installation, Tracker, Complaints
   - Placeholder components ready for development

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS
- **Authentication**: Mock service (Firebase-ready)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📱 Features

- ✅ **Responsive Design** - Works on mobile and desktop
- ✅ **Role-based Access Control** - Different users see different modules
- ✅ **Mock Authentication** - No Firebase setup required for testing
- ✅ **Beautiful UI** - Matches design mockups
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **PWA Ready** - Progressive Web App capabilities

## 🔧 Development

- **Hot Reload**: Changes update automatically
- **TypeScript**: Full type checking
- **ESLint**: Code quality enforcement
- **Vite**: Fast build tool

## 📞 Support

- **Developer**: WeBot-IT-Services
- **Email**: jinzhang@webotitservices.org
- **Project Cost**: RM4,500

---

© 2025 Mysteel Construction Sdn Bhd. All rights reserved.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
