import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';

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

      {/* Contact Section */}
      <section id="contact" style={{ padding: '80px 0', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: 'white'
              }}>
                Get In Touch
              </h2>
              <p style={{
                fontSize: '1.2rem',
                opacity: '0.9',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Ready to transform your asset management? Contact our team for a personalized demo and consultation.
              </p>
            </Col>
          </Row>

          <Row>
            <Col lg={4} md={6} className="mb-4">
              <Card style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '15px',
                padding: '2rem',
                height: '100%',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="text-center">
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>📧</div>
                  <h4 style={{ color: 'white', marginBottom: '1rem' }}>Email Us</h4>
                  <p style={{ opacity: '0.9', marginBottom: '1rem' }}>
                    Get in touch with our support team
                  </p>
                  <a
                    href="mailto:support@addwisetracker.com"
                    style={{
                      color: '#ffd700',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '1.1rem'
                    }}
                  >
                    support@addwisetracker.com
                  </a>
                </div>
              </Card>
            </Col>

            <Col lg={4} md={6} className="mb-4">
              <Card style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '15px',
                padding: '2rem',
                height: '100%',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="text-center">
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>📞</div>
                  <h4 style={{ color: 'white', marginBottom: '1rem' }}>Call Us</h4>
                  <p style={{ opacity: '0.9', marginBottom: '1rem' }}>
                    Speak directly with our experts
                  </p>
                  <a
                    href="tel:+1-800-ADDWISE"
                    style={{
                      color: '#ffd700',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '1.1rem'
                    }}
                  >
                    +1 (800) ADD-WISE
                  </a>
                  <div style={{ opacity: '0.8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Mon-Fri: 9AM-6PM EST
                  </div>
                </div>
              </Card>
            </Col>

            <Col lg={4} md={12} className="mb-4">
              <Card style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '15px',
                padding: '2rem',
                height: '100%',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="text-center">
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>🏢</div>
                  <h4 style={{ color: 'white', marginBottom: '1rem' }}>Visit Us</h4>
                  <p style={{ opacity: '0.9', marginBottom: '1rem' }}>
                    Our headquarters location
                  </p>
                  <div style={{
                    color: '#ffd700',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    lineHeight: '1.5'
                  }}>
                    123 Innovation Drive<br/>
                    Tech Valley, CA 94025<br/>
                    United States
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row className="mt-5">
            <Col className="text-center">
              <h4 style={{ marginBottom: '2rem', color: 'white' }}>Follow Us</h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {[
                  {
                    name: 'LinkedIn',
                    url: 'https://linkedin.com/company/addwise-tracker',
                    color: '#0077b5',
                    svg: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )
                  },
                  {
                    name: 'Twitter',
                    url: 'https://twitter.com/addwise_tracker',
                    color: '#1da1f2',
                    svg: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    )
                  },
                  {
                    name: 'Facebook',
                    url: 'https://facebook.com/addwisetracker',
                    color: '#4267b2',
                    svg: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )
                  },
                  {
                    name: 'Instagram',
                    url: 'https://instagram.com/addwise_tracker',
                    color: '#e4405f',
                    svg: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    )
                  },
                  {
                    name: 'YouTube',
                    url: 'https://youtube.com/@addwisetracker',
                    color: '#ff0000',
                    svg: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    )
                  }
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'white',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      const icon = e.currentTarget.querySelector('.social-icon');
                      icon.style.background = social.color;
                      icon.style.boxShadow = `0 8px 25px ${social.color}40`;
                      icon.style.borderColor = social.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      const icon = e.currentTarget.querySelector('.social-icon');
                      icon.style.background = 'rgba(255, 255, 255, 0.1)';
                      icon.style.boxShadow = 'none';
                      icon.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <div
                      className="social-icon"
                      style={{
                        marginBottom: '0.5rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                    >
                      {social.svg}
                    </div>
                    <span style={{ fontSize: '0.9rem', opacity: '0.9', fontWeight: '500' }}>
                      {social.name}
                    </span>
                  </a>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Enhanced Footer */}
      <footer style={{
        background: '#2c3e50',
        color: 'white',
        padding: '3rem 0 2rem',
        borderTop: '4px solid #3498db'
      }}>
        <Container>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <h5 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#3498db'
              }}>
                ADDWISE GPS Tracker
              </h5>
              <p style={{
                opacity: '0.8',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                Leading enterprise asset management platform with real-time GPS tracking,
                QR code management, and comprehensive analytics.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Badge bg="success" style={{ fontSize: '0.8rem' }}>✅ SOC 2 Compliant</Badge>
                <Badge bg="info" style={{ fontSize: '0.8rem' }}>🔒 GDPR Ready</Badge>
              </div>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h6 style={{ fontWeight: '600', marginBottom: '1rem', color: '#ecf0f1' }}>Product</h6>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                {['Features', 'Pricing', 'API Docs', 'Integrations', 'Security'].map((item) => (
                  <li key={item} style={{ marginBottom: '0.5rem' }}>
                    <a href="#" style={{
                      color: '#bdc3c7',
                      textDecoration: 'none',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#3498db'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#bdc3c7'}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h6 style={{ fontWeight: '600', marginBottom: '1rem', color: '#ecf0f1' }}>Company</h6>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                {['About Us', 'Careers', 'Press', 'Partners', 'Blog'].map((item) => (
                  <li key={item} style={{ marginBottom: '0.5rem' }}>
                    <a href="#" style={{
                      color: '#bdc3c7',
                      textDecoration: 'none',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#3498db'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#bdc3c7'}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </Col>

            <Col lg={4} md={6} className="mb-4">
              <h6 style={{ fontWeight: '600', marginBottom: '1rem', color: '#ecf0f1' }}>Stay Updated</h6>
              <p style={{ opacity: '0.8', marginBottom: '1rem' }}>
                Get the latest updates on new features and industry insights.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    flex: '1',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
                <Button
                  style={{
                    background: '#3498db',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  Subscribe
                </Button>
              </div>
              <div style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                📧 Join 10,000+ professionals getting weekly updates
              </div>
            </Col>
          </Row>

          <hr style={{ margin: '2rem 0', opacity: '0.3' }} />

          <Row className="align-items-center">
            <Col md={6}>
              <p style={{ margin: '0', opacity: '0.8' }}>
                © 2024 ADDWISE GPS Tracker. All rights reserved. Enterprise Asset Management Solution.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    style={{
                      color: '#bdc3c7',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#3498db'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#bdc3c7'}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage; 