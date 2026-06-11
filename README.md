# Ihub Academy Hub  no for cloning 

A comprehensive learning management system for tech education in Rwanda, featuring student portals, trainer dashboards, admin management, and super admin configuration.

## 🏗️ Project Structure

```
ihub-academy-hub/
├── frontend/          # React + Vite frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/          # Node.js + GraphQL backend
│   ├── src/          # Backend source code
│   └── package.json  # Backend dependencies
└── supabase/         # Database migrations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (running locally or remote connection)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ihub-academy-hub
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend
npm install
```

4. **Configure Environment Variables**

Create `.env` files in both `frontend` and `backend` directories:

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:4000/graphql
```

**Backend `.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/ihub-academy
JWT_SECRET=your-secret-key-here
PORT=4000
```

### Running the Application

**Option 1: Run Both Servers Separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Option 2: Run from Root (Coming Soon)**
```bash
npm run dev
```

## 📱 Application Features

### Student Portal
- Course enrollment and progress tracking
- Interactive lessons with quizzes
- Project submissions
- Certificate generation
- Internship applications
- Personal schedule management

### Trainer Portal
- Student management and grading
- Course content creation
- Assignment tracking
- Live session scheduling
- Mentorship program

### Admin Portal
- User management (students, trainers)
- Course administration
- Payment tracking
- Badge management
- Analytics dashboard

### Super Admin Portal
- Admin account management
- Platform configuration
- System-wide settings
- Advanced analytics

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** Apollo Client
- **Routing:** React Router v6
- **Animations:** Framer Motion
- **Forms:** React Hook Form
- **Notifications:** Sonner

### Backend
- **Runtime:** Node.js
- **API:** GraphQL (Apollo Server)
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Password Hashing:** bcryptjs
- **Real-time:** Socket.IO

## 📚 Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev      # Start with nodemon
npm start        # Start production server
```

## 🔐 Authentication & Authorization

The application uses role-based access control (RBAC) with four user roles:
- **Student:** Access to learning materials and personal progress
- **Trainer:** Course management and student grading
- **Admin:** Platform administration and user management
- **Super Admin:** Full system access and configuration

## 🎨 Design System

The application features a premium design with:
- Custom color palette (Gold accent: #EAB308)
- Dark/Light mode support
- Responsive layouts for all screen sizes
- Smooth animations and transitions
- Accessible UI components

## 📦 Database Models

- **User:** Student, trainer, admin, and super admin accounts
- **Course:** Course information with modules and lessons
- **Enrollment:** Student course enrollments
- **Grade:** Student grades and feedback
- **Badge:** Achievement badges
- **Internship:** Internship opportunities
- **Booking:** Mentorship session bookings
- **Config:** Platform configuration settings

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

### Backend (Render/Railway)
```bash
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Developed by the Ihub Academy team.

## 📞 Support

For support, email support@bootskills.com or join our Discord community.

---

**Made with ❤️ in Rwanda**
