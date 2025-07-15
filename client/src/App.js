import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './styles/responsive.css';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import WelcomePage from './components/WelcomePage';
import TestMapPage from './components/TestMapPage';


function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/login/user" replace />} />
            <Route path="/login/:role" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/test-map" element={<TestMapPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
