# 🌍 ADDWISE GPS Tracker

> A comprehensive, full-stack GPS tracking application with real-time location monitoring, QR code management, and multi-role authentication system.

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Live Demo

[**View Live Application**](your-deployed-url-here) | [**Figma Design**](https://www.figma.com/board/49hoyUBYUHItrS0RG32UvK/Untitled?t=QI2t9O0mf4NhGyLQ-)

## 📱 Features

### 🔐 Authentication System
- **Multi-role Authentication** (User, Admin, Super Admin)
- **Google OAuth Integration** with seamless sign-in
- **Role-based Access Control** and secure routing
- **Forgot Password** functionality

### 🌍 GPS Tracking
- **Real-time Location Tracking** with high accuracy
- **Enhanced GPS for Proddatur Region** with custom optimization
- **Location History** tracking and storage
- **GPS Debug Panel** for advanced analysis

### 📱 QR Code Management
- **Dynamic QR Code Generation** for devices
- **Camera-based QR Scanning** with real-time detection
- **Device Association** and comprehensive tracking
- **Scan History Analytics** with detailed audit trails

### 👨‍💼 Admin Dashboard
- **Comprehensive Analytics** with real-time charts
- **Device Request Management** with approval workflow
- **User Management** with CRUD operations
- **System Monitoring** and performance metrics

### 🎨 Professional UI/UX
- **Responsive Design** for all screen sizes
- **Professional Interface** with clean, modern styling
- **Mobile-first Approach** with touch-friendly controls
- **Accessibility Features** and intuitive navigation

## 🛠️ Tech Stack

### Frontend
- **React.js 18+** - Modern component-based architecture
- **React Bootstrap** - Professional UI components
- **React Router** - Client-side routing and navigation
- **HTML5 QR Code Scanner** - Camera-based QR scanning
- **Axios** - HTTP client for API communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure token-based auth
- **bcryptjs** - Password hashing and security
- **QRCode** - Server-side QR code generation
- **CORS** - Cross-origin resource sharing
- **Custom Middleware** - Authentication and validation

### Authentication & Security
- **Google Identity Services** - OAuth 2.0 integration
- **JWT Tokens** - Secure session management
- **Role-based Security** - Access control system

### Development Tools
- **Create React App** - Development environment
- **npm** - Package management
- **Git** - Version control
- **Figma** - UI/UX design and prototyping

## 📁 Project Structure

```
gpstracker/
├── client/                     # React frontend application
│   ├── public/
│   │   ├── index.html         # Main HTML template
│   │   └── favicon.ico        # Application icon
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── WelcomePage.js # Main dashboard component
│   │   │   ├── LoginPage.js   # Authentication component
│   │   │   ├── SignupPage.js  # User registration
│   │   │   └── GoogleSignIn.js # OAuth integration
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.js             # Main application component
│   │   └── index.js           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── .env                   # Environment variables
├── server/                     # Node.js backend
│   ├── server.js              # Express server setup
│   └── package.json           # Backend dependencies
├── docs/                       # Documentation
│   ├── API.md                 # API documentation
│   └── DEPLOYMENT.md          # Deployment guide
└── README.md                  # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Modern web browser with camera support
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/addwise-gps-tracker.git
   cd addwise-gps-tracker
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up MongoDB**
   ```bash
   # Install MongoDB locally or use MongoDB Atlas
   # For local installation: https://docs.mongodb.com/manual/installation/

   # Create database and sample data
   node install.js
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

5. **Set up environment variables**
   ```bash
   # In server/.env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/gps_tracker
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000

   # In client/.env
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
   REACT_APP_API_URL=http://localhost:5000/api
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm run dev  # or npm start for production
   # Backend will run on http://localhost:5000

   # Terminal 2: Start frontend application
   cd client
   npm start
   # Frontend will run on http://localhost:3000
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔑 Default Login Credentials

After running the installation script (`node install.js`), you can use these default accounts:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | `superadmin` | `SuperAdmin@123` | superadmin@assettrack.com |
| Admin | `admin` | `Admin@123` | admin@assettrack.com |
| User | `suman2_user` | `Suman123!` | suman@example.com |
| Test User | `testuser` | `Test123!` | test@example.com |

## 📖 Usage Guide

### For Users
1. **Sign Up/Login** - Create account or use Google Sign-In
2. **Request Device** - Submit device tracking requests
3. **Scan QR Codes** - Use camera to scan device QR codes
4. **Track Location** - Monitor real-time GPS coordinates
5. **View History** - Access location and scan history

### For Admins
1. **Dashboard Access** - View comprehensive analytics
2. **Approve Requests** - Manage device approval workflow
3. **Generate QR Codes** - Create QR codes for approved devices
4. **User Management** - Administer user accounts and roles
5. **System Monitoring** - Monitor application performance

## 🔧 Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Identity API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)

### Environment Variables
```env
# Client Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_API_URL=http://localhost:5000

# Server Configuration (future)
PORT=5000
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
```

## 📊 Features in Detail

### GPS Tracking System
- **High Accuracy Mode** - Enhanced location precision
- **Proddatur Optimization** - Custom GPS enhancement for local region
- **Real-time Updates** - Live location monitoring
- **Offline Caching** - Location storage for offline access

### QR Code Technology
- **Dynamic Generation** - Device-specific QR codes with metadata
- **Camera Integration** - Real-time scanning with permission handling
- **Data Validation** - Secure QR code verification and parsing
- **History Tracking** - Comprehensive scan audit trails

### Admin Analytics
- **User Metrics** - Registration and activity statistics
- **Device Analytics** - Approval rates and usage patterns
- **Performance Monitoring** - System health and response times
- **Visual Charts** - Real-time data visualization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**[Your Name]**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Google** for OAuth and Identity Services
- **Bootstrap Team** for the UI components
- **HTML5 QR Code** library for scanning functionality
- **Figma** for design and prototyping tools

## 📈 Project Stats

- **Development Time**: 15 days
- **Components**: 20+ React components
- **Features**: 25+ implemented features
- **Lines of Code**: 5000+ lines
- **Test Coverage**: Comprehensive manual testing

---

⭐ **Star this repository if you found it helpful!**

📧 **Questions?** Feel free to reach out or open an issue.
