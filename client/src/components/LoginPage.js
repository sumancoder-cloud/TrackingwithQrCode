import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import usePreventNavigation from '../hooks/usePreventNavigation';
import api from '../services/api';
import Swal from 'sweetalert2';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { role = 'user' } = useParams();
  usePreventNavigation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP & Password
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Clear any existing error when role changes
  useEffect(() => {
    setError('');
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
  }, [role]);

  // Handle forgot password submission
  // Handle forgot password - Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setForgotPasswordLoading(true);

    const { email } = forgotPasswordData;

    if (!email) {
      setForgotPasswordError('Please enter your email address');
      setForgotPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setForgotPasswordSuccess(data.message);
        setForgotPasswordStep(2); // Move to OTP verification step
      } else {
        setForgotPasswordError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setForgotPasswordError('Network error. Please check your connection and try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Handle forgot password - Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setForgotPasswordLoading(true);

    const { email, otp, newPassword, confirmPassword } = forgotPasswordData;

    if (!otp || !newPassword || !confirmPassword) {
      setForgotPasswordError('Please fill in all fields');
      setForgotPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotPasswordError('Passwords do not match');
      setForgotPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setForgotPasswordError('Password must be at least 8 characters long');
      setForgotPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setForgotPasswordSuccess(data.message);

        // Clear form and close modal after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordStep(1);
          setForgotPasswordData({
            email: '',
            otp: '',
            newPassword: '',
            confirmPassword: ''
          });
          setForgotPasswordSuccess('');
        }, 3000);
      } else {
        setForgotPasswordError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setForgotPasswordError('Network error. Please check your connection and try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Handle forgot password form changes
  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Role switcher function
  const switchRole = (newRole) => {
    navigate(`/login/${newRole}`);
  };

  // Role display info
  const roleInfo = {
    user: {
      icon: '👤',
      title: 'User Login',
      description: 'Access device scanning and tracking features',
      color: '#007bff'
    },
    admin: {
      icon: '🛠️',
      title: 'Admin Login',
      description: 'Manage users and devices',
      color: '#28a745'
    },
    superadmin: {
      icon: '👑',
      title: 'Super Admin Login',
      description: 'Full system access and control',
      color: '#dc3545'
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      // Special handling for superadmin_1
      if (role === 'superadmin') {
        if (
          formData.username === 'superadmin_1' &&
          formData.password === 'Suman@2005'
        ) {
          // Always trigger OTP flow for superadmin_1, do not allow direct login
          await handleSuperAdminOTP();
          setLoading(false);
          return;
        } else {
          setError('Invalid superadmin credentials.');
          setLoading(false);
          return;
        }
      }
      // Use MongoDB API for login
      const response = await api.login({
        username: formData.username,
        password: formData.password,
        role: role
      });

      if (response.success && response.requiresOTP) {
        // Super admin needs OTP verification
        setLoading(false);
        await handleSuperAdminOTP();
        return;
      }

      if (response.success && response.data) {
        const userData = response.data.user;
        console.log('✅ Login successful:', userData);

        // Check if user role matches the requested role
        if (userData.role !== role) {
          setError(`This account is registered as a ${userData.role}. Redirecting you to the correct login page...`);
          setTimeout(() => {
            navigate(`/login/${userData.role}`);
          }, 2000);
          return;
        }

        // Show welcome message based on role
        const roleDisplay = {
          'user': 'User',
          'admin': 'Admin',
          'superadmin': 'Super Admin'
        }[userData.role];

        console.log('✅ Login successful from database:', userData);

        // Store only the authentication token - user data will be fetched from database
        localStorage.setItem('token', response.data.token);

        const result = await Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: `Welcome ${userData.firstName || userData.username} (${roleDisplay})`,
          confirmButtonText: 'Continue',
          confirmButtonColor: '#007bff'
        });

        if (result.isConfirmed) {
          console.log('🚀 Navigating to welcome page...');
          console.log('🔑 Authentication token stored, user data will be loaded from database');
          navigate('/welcome');
        }
      } else {
        setError('❌ Invalid response from server. Please try again.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);

      if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data?.message || err.message;
        console.log('📋 Server error message:', errorMessage);

        if (errorMessage.includes('password') || errorMessage.includes('credentials')) {
          setError('❌ Incorrect password. Please check your password and try again.');
        } else if (errorMessage.includes('username') || errorMessage.includes('account')) {
          setError('❌ Username not found. Please check your username or register a new account.');
        } else if (errorMessage.includes('role')) {
          setError(`❌ ${errorMessage}`);
        } else {
          setError(`❌ ${errorMessage}`);
        }
      } else if (err.message.includes('Cannot connect to server')) {
        setError('❌ Cannot connect to server. Please ensure the server is running on port 5001.');
      } else {
        setError('❌ Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  // Handle super admin OTP verification
  const handleSuperAdminOTP = async () => {
    try {
      // Send OTP request
      const otpResponse = await fetch('http://localhost:5001/api/auth/superadmin-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const otpData = await otpResponse.json();

      if (otpData.success) {
        // Show OTP input modal
        const { value: otpValue } = await Swal.fire({
          title: 'Enter OTP',
          text: 'Please check your email for the OTP sent to suman.tati2005@gmail.com',
          input: 'text',
          inputPlaceholder: 'Enter 6-digit OTP',
          inputValidator: (value) => {
            if (!value) {
              return 'Please enter the OTP';
            }
            if (value.length !== 6) {
              return 'OTP must be 6 digits';
            }
          },
          showCancelButton: true,
          confirmButtonText: 'Verify OTP',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#007bff',
          cancelButtonColor: '#6c757d',
          showLoaderOnConfirm: true,
          preConfirm: async (otp) => {
            try {
              const verifyResponse = await fetch('http://localhost:5001/api/auth/superadmin-verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ otp }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                return verifyData;
              } else {
                throw new Error(verifyData.message || 'OTP verification failed');
              }
            } catch (error) {
              Swal.showValidationMessage(`OTP verification failed: ${error.message}`);
            }
          },
          allowOutsideClick: () => !Swal.isLoading()
        });

        if (otpValue) {
          // OTP verification successful
          const userData = otpValue.data.user;
          const token = otpValue.data.token;
          
          console.log('✅ OTP verification successful:', userData);
          
          // Store user data and token in localStorage
          localStorage.setItem('userData', JSON.stringify(userData));
          localStorage.setItem('token', token);
          localStorage.setItem('isAuthenticated', 'true');

          // Show success notification (top-right) instead of popup for superadmin
          Swal.fire({
            icon: 'success',
            title: 'Logged in successfully',
            text: `Welcome back, ${userData.firstName} ${userData.lastName}!`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });

          console.log('🚀 Navigating to welcome page...');
          navigate('/welcome');
        }
      } else {
        setError(otpData.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP error:', error);
      setError('Failed to process OTP request. Please try again.');
    }
  };



  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">🏢</div>
            <h1>Welcome Back</h1>
            <p>Sign in to Addwise Tracker</p>
            
            {/* Role Switcher Buttons */}
            <div className="role-switcher" style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              marginTop: '1rem',
              marginBottom: '1rem'
            }}>
              <button
                onClick={() => switchRole('user')}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: role === 'user' ? '#007bff' : '#e9ecef',
                  color: role === 'user' ? 'white' : '#495057',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                👤 User
              </button>
              <button
                onClick={() => switchRole('admin')}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: role === 'admin' ? '#28a745' : '#e9ecef',
                  color: role === 'admin' ? 'white' : '#495057',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                🛠️ Admin
              </button>
              <button
                onClick={() => switchRole('superadmin')}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: role === 'superadmin' ? '#dc3545' : '#e9ecef',
                  color: role === 'superadmin' ? 'white' : '#495057',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                👑 Super Admin
              </button>
            </div>
          </div>

          <div className="role-info" style={{
            backgroundColor: `${roleInfo[role].color}10`,
            borderLeft: `4px solid ${roleInfo[role].color}`,
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: roleInfo[role].color }}>
              <span className="role-icon">{roleInfo[role].icon}</span>
              {roleInfo[role].title}
            </h4>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 0 }}>
              {roleInfo[role].description}
            </p>
          </div>

          {error && <Alert variant="danger" className="login-alert">{error}</Alert>}

          <Form onSubmit={handleSubmit} className="login-form">
            <Form.Group className="form-group">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </Form.Group>

            <Button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="forgot-password-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Forgot Password?
              </button>
            </div>



            <div className="signup-link">
              Don't have an account?{' '}
              <Link to="/signup" className="link">Create one</Link>
            </div>
          </Form>
        </div>

        {/* 📧 Forgot Password Modal with OTP */}
        {showForgotPassword && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}>
            <div className="modal-content" style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '450px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '1px solid #e9ecef'
            }}>
              {/* Modal Header */}
              <div className="modal-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                <h3 style={{
                  color: '#333',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: '1.5rem'
                }}>
                  {forgotPasswordStep === 1 ? 'Reset Password' : 'Verify & Reset'}
                </h3>
                <p style={{
                  color: '#666',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {forgotPasswordStep === 1
                    ? 'Enter your email address to receive a verification code'
                    : 'Enter the OTP sent to your email and set a new password'
                  }
                </p>
              </div>

              {/* Error Alert */}
              {forgotPasswordError && (
                <Alert variant="danger" style={{
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#f8d7da',
                  color: '#721c24'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>❌</span>
                    {forgotPasswordError}
                  </div>
                </Alert>
              )}

              {/* Success Alert */}
              {forgotPasswordSuccess && (
                <Alert variant="success" style={{
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#d4edda',
                  color: '#155724'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>✅</span>
                    {forgotPasswordSuccess}
                  </div>
                </Alert>
              )}

              {/* Step 1: Email Input */}
              {forgotPasswordStep === 1 && (
                <Form onSubmit={handleSendOTP}>
                  <Form.Group className="form-group" style={{ marginBottom: '2rem' }}>
                    <Form.Label style={{
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      📧 Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={forgotPasswordData.email}
                      onChange={(e) => setForgotPasswordData({
                        ...forgotPasswordData,
                        email: e.target.value
                      })}
                      placeholder="Enter your registered email address"
                      required
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #e9ecef',
                        fontSize: '1rem',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#007bff'}
                      onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                    />
                  </Form.Group>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordStep(1);
                        setForgotPasswordData({
                          email: '',
                          otp: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                        setForgotPasswordError('');
                        setForgotPasswordSuccess('');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={forgotPasswordLoading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: '500',
                        backgroundColor: '#007bff',
                        borderColor: '#007bff'
                      }}
                    >
                      {forgotPasswordLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Sending...
                        </>
                      ) : (
                        <>📧 Send OTP</>
                      )}
                    </Button>
                  </div>
                </Form>
              )}

              {/* Step 2: OTP Verification & Password Reset */}
              {forgotPasswordStep === 2 && (
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <Form.Label style={{
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      🔢 Verification Code (OTP)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="otp"
                      value={forgotPasswordData.otp}
                      onChange={(e) => setForgotPasswordData({
                        ...forgotPasswordData,
                        otp: e.target.value.replace(/\D/g, '').slice(0, 6)
                      })}
                      placeholder="Enter 6-digit OTP from email"
                      required
                      maxLength="6"
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #e9ecef',
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        letterSpacing: '0.5rem',
                        fontWeight: 'bold'
                      }}
                    />
                    <small style={{ color: '#666', fontSize: '0.8rem' }}>
                      Check your email for the 6-digit verification code
                    </small>
                  </Form.Group>

                  <Form.Group className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <Form.Label style={{
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      🔒 New Password
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={forgotPasswordData.newPassword}
                        onChange={(e) => setForgotPasswordData({
                          ...forgotPasswordData,
                          newPassword: e.target.value
                        })}
                        placeholder="Enter new password (min 8 characters)"
                        required
                        style={{
                          padding: '0.75rem',
                          paddingRight: '3rem',
                          borderRadius: '8px',
                          border: '2px solid #e9ecef',
                          fontSize: '1rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.2rem'
                        }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </Form.Group>

                  <Form.Group className="form-group" style={{ marginBottom: '2rem' }}>
                    <Form.Label style={{
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      🔒 Confirm New Password
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={forgotPasswordData.confirmPassword}
                        onChange={(e) => setForgotPasswordData({
                          ...forgotPasswordData,
                          confirmPassword: e.target.value
                        })}
                        placeholder="Confirm your new password"
                        required
                        style={{
                          padding: '0.75rem',
                          paddingRight: '3rem',
                          borderRadius: '8px',
                          border: '2px solid #e9ecef',
                          fontSize: '1rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.2rem'
                        }}
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </Form.Group>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => setForgotPasswordStep(1)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: '500'
                      }}
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      variant="success"
                      disabled={forgotPasswordLoading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: '500',
                        backgroundColor: '#28a745',
                        borderColor: '#28a745'
                      }}
                    >
                      {forgotPasswordLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Resetting...
                        </>
                      ) : (
                        <>🔐 Reset Password</>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 