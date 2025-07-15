# 🌍 GPS Tracker Application(tati Suman Yadav)

> A comprehensive, full-stack GPS tracking system with real-time location monitoring, QR code management, database-only authentication, and advanced mapping capabilities using Geoapify.

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Application Overview

**Frontend**: http://localhost:3000
**Backend API**: http://localhost:5001
**Database**: MongoDB (gpstracker)

## ✨ Features

### 🔐 Database-Only Authentication System
- **Pure MongoDB Authentication**: No localStorage dependency
- **JWT Token Security**: Secure token-based authentication with 30-second timeout handling
- **Multi-Role Access Control**: User, Admin, and Super Admin roles
- **Secure Password Management**: bcrypt hashing with password change functionality
- **Account Management**: Profile updates, password changes, account deletion
- **Token Verification**: Real-time database verification for all requests

### 🌍 Advanced GPS Tracking & Mapping
- **Geoapify Maps Integration**: Professional mapping with carto tile style
- **Real-Time Location Tracking**: Live GPS coordinate updates with accuracy indicators
- **Multiple Registration Methods**:
  - 📷 Camera QR code scanning
  - 📁 QR code image upload
  - ⌨️ Manual 16-digit code entry
- **Path Visualization**: Connected location points with red path lines
- **Location History**: Chronological tracking with timestamps and coordinates
- **Automatic Map Updates**: Real-time coordinate updates via Postman API testing
- **Enhanced Timeout Handling**: 30-second GPS timeout with fallback to network location

### 📱 Comprehensive QR Code System
- **Admin QR Generation**: Admins generate QR codes and distribute via email/WhatsApp
- **Smart Device Registration**: QR codes permanently assigned to users
- **Duplicate Prevention**: Existing QR codes redirect directly to GPS tracking
- **Device Association**: Automatic user-device linking with purpose/description storage
- **Real-Time Scanning**: Immediate GPS location display after successful scan

### 👨‍💼 Advanced Admin Dashboard
- **User Management**: Complete CRUD operations for all users from database
- **QR Code Management**: Full CRUD operations with database cleanup features
- **Device Oversight**: Monitor all registered devices with tracking history
- **System Analytics**: Real-time user activity and device statistics
- **Database Integration**: All admin functions connected to MongoDB

### 🎯 Advanced Features
- **Calendar-Based Route Tracking**: View routes by date range with detailed path information
- **Persistent Data Storage**: All application state persists across page refreshes
- **Responsive Design**: Compatible with all devices, maintains layout when F12 developer tools are opened
- **Real-Time Updates**: Automatic map updates when coordinates change via API
- **Location Accuracy**: GPS accuracy badges and measurements
- **Sidebar History**: Recent locations displayed in neat tables in sidebar

## 🛠️ Technology Stack

### Frontend
- **React.js 18+** - Modern functional components with hooks
- **React Bootstrap** - Responsive UI components with professional styling
- **React Router DOM** - Client-side routing and navigation
- **HTML5 QR Code Scanner** - Camera-based QR scanning with real-time detection
- **SweetAlert2** - Beautiful alert dialogs and notifications
- **Axios** - HTTP client for API communication
- **Geoapify Maps** - Professional mapping service with carto tiles

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework with middleware
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling and validation
- **JWT (jsonwebtoken)** - Secure token-based authentication
- **bcryptjs** - Password hashing and security
- **CORS** - Cross-origin resource sharing
- **Nodemailer** - Email functionality for notifications
- **Custom Middleware** - Authentication, error handling, and validation

### Database & Security
- **MongoDB Atlas/Local** - Database hosting with gpstracker database
- **JWT Tokens** - Secure session management with userId field consistency
- **Role-based Access Control** - User, Admin, Super Admin permissions
- **Password Encryption** - bcrypt with salt rounds for security
- **Database-Only Auth** - No localStorage dependency for authentication

### Development & Deployment
- **Nodemon** - Development server auto-restart
- **Concurrently** - Run frontend and backend simultaneously
- **dotenv** - Environment variable management
- **ESLint** - Code linting and quality assurance
- **Create React App** - Development environment setup

## 📁 Project Structure

```
gpstracker/
├── client/                          # React frontend application
│   ├── public/
│   │   ├── index.html              # Main HTML template
│   │   └── favicon.ico             # Application icon
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── WelcomePage.js      # Main dashboard with GPS tracking
│   │   │   ├── LoginPage.js        # Database authentication
│   │   │   ├── SignupPage.js       # User registration with validation
│   │   │   ├── GeoapifyGPSTracker.js # Advanced GPS tracking component
│   │   │   └── RealTimePathMap.js  # Real-time path visualization
│   │   ├── services/
│   │   │   └── api.js              # API service configuration
│   │   ├── App.js                  # Main application with routing
│   │   └── index.js                # Application entry point
│   ├── package.json                # Frontend dependencies
│   └── .env                        # Environment variables
├── server/                          # Node.js backend
│   ├── server.js                   # Express server with MongoDB connection
│   ├── models/                     # Mongoose data models
│   │   ├── User.js                 # User schema with roles
│   │   ├── Device.js               # Device tracking schema
│   │   ├── GPSLocation.js          # GPS coordinates schema
│   │   └── QRCode.js               # QR code management schema
│   ├── routes/                     # API route handlers
│   │   ├── auth.js                 # Authentication endpoints
│   │   ├── users.js                # User management endpoints
│   │   ├── devices.js              # Device management endpoints
│   │   └── gps.js                  # GPS tracking endpoints
│   ├── middleware/                 # Custom middleware
│   │   ├── auth.js                 # JWT authentication middleware
│   │   └── errorHandler.js         # Error handling middleware
│   ├── package.json                # Backend dependencies
│   └── .env                        # Server environment variables
├── package.json                     # Root package.json for concurrent scripts
└── README.md                       # Comprehensive project documentation
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
