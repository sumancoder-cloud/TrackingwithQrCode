import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col } from 'react-bootstrap';

const LandingPage = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.login-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLoginClick = (role) => {
    setShowDropdown(false);
    navigate(`/login/${role}`);
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <Navbar expand="lg" className="navbar">
        <Container>
          <Navbar.Brand href="#home" style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#4a148c',
            letterSpacing: '0.5px'
          }}>
            ADDWISE TRACKER
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="#features">Features</Nav.Link>
              <Nav.Link href="#about">About</Nav.Link>
              <Nav.Link href="#contact">Contact</Nav.Link>
              <div className="d-flex align-items-center gap-3">
                <button 
                  className="signup-btn"
                  onClick={handleSignupClick}
                  style={{
                    background: 'linear-gradient(45deg, #28a745, #20c997)',
                    border: 'none',
                    color: 'white',
                    padding: '8px 20px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  Sign Up
                </button>
                <div className="login-dropdown">
                  <button 
                    className="login-btn"
                    onClick={toggleDropdown}
                    style={{
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 20px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                  >
                    Login
                  </button>
                  {showDropdown && (
                    <div 
                      className="dropdown-content show"
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: '100%',
                        background: 'white',
                        borderRadius: '10px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        padding: '1rem',
                        minWidth: '250px',
                        zIndex: '1000',
                        marginTop: '0.5rem'
                      }}
                    >
                      <div className="text-center mb-3">
                        <h6 style={{ color: '#333', marginBottom: '0.5rem' }}>Select Your Role</h6>
                        <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>
                          Choose your role to login
                        </p>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <button
                          className="role-btn"
                          onClick={() => handleLoginClick('superadmin')}
                          style={{
                            background: '#fff',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#4a148c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}>SA</div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#333' }}>Super Admin</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Full system access</div>
                          </div>
                        </button>
                        <button
                          className="role-btn"
                          onClick={() => handleLoginClick('admin')}
                          style={{
                            background: '#fff',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#1976d2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}>AD</div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#333' }}>Admin</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Device management</div>
                          </div>
                        </button>
                        <button
                          className="role-btn"
                          onClick={() => handleLoginClick('user')}
                          style={{
                            background: '#fff',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#388e3c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}>US</div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#333' }}>User</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Device scanning</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <h1 className="hero-title">
            Addwise Tracker - Enterprise Asset Management
          </h1>
          <p className="hero-subtitle">
            Transform your business with our advanced QR code and GPS tracking system. 
            Monitor assets, reduce losses, and boost efficiency across warehouses, fleets, and facilities.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="signup-btn"
              onClick={handleSignupClick}
              style={{
                background: 'linear-gradient(45deg, #28a745, #20c997)',
                border: 'none',
                color: 'white',
                padding: '15px 35px',
                fontSize: '1.2rem',
                fontWeight: '600',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
               Start Free Trial
            </button>
            <div className="login-dropdown">
              <button className="login-btn" onClick={toggleDropdown}>
                 Login
              </button>
              <div className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
                <a 
                  className="dropdown-item" 
                  href="#superadmin"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoginClick('superadmin');
                  }}
                >
                Super Admin Login
                </a>
                <a 
                  className="dropdown-item" 
                  href="#admin"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoginClick('admin');
                  }}
                >
                  Admin Login
                </a>
                <a 
                  className="dropdown-item" 
                  href="#user"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoginClick('user');
                  }}
                >
                  User Login
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">
                 Why Choose Addwise Tracker?
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
                Enterprise-grade asset management solution trusted by leading companies
              </p>
            </Col>
          </Row>
          
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3 className="feature-title">Smart QR Code System</h3>
                <p className="feature-description">
                  Generate unique QR codes for instant asset identification and real-time tracking across your entire inventory.
                </p>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="feature-card">
                <div className="feature-icon">📍</div>
                <h3 className="feature-title">Live GPS Tracking</h3>
                <p className="feature-description">
                  Monitor asset locations in real-time with precision GPS tracking and interactive map visualization.
                </p>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3 className="feature-title">Role-Based Security</h3>
                <p className="feature-description">
                  Enterprise-grade access control with customizable permissions for Super Admin, Admin, and User roles.
                </p>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="feature-card">
                <div className="feature-icon">🗺️</div>
                <h3 className="feature-title">Interactive Dashboards</h3>
                <p className="feature-description">
                  Visualize all assets on interactive maps with real-time updates, clustering, and detailed analytics.
                </p>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3 className="feature-title">Advanced Analytics</h3>
                <p className="feature-description">
                  Comprehensive reporting and analytics to optimize asset utilization and reduce operational costs.
                </p>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">Enterprise Security</h3>
                <p className="feature-description">
                  Bank-level security with JWT authentication, encrypted data transmission, and compliance standards.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* About Section */}
      <section style={{ padding: '80px 0', background: '#f8f9fa' }} id="about">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h2 className="section-title">About Addwise Tracker</h2>
              <p className="section-description">
                Addwise Tracker is the leading enterprise asset management platform built with cutting-edge MERN stack technology.
              </p>
              <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.8' }}>
                Trusted by warehouses, delivery companies, hospitals, and Fortune 500 companies worldwide for reliable 
                asset management and real-time tracking solutions.
              </p>
            </Col>
            <Col lg={6} className="text-center">
              <div style={{ fontSize: '8rem', color: '#667eea' }}>🏢</div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 Addwise Tracker. Enterprise Asset Management Solution.</p>
      </footer>
    </div>
  );
};

export default LandingPage; 