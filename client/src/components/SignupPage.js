import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  
  // Add useEffect to create default admin user if no users exist
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
      const defaultAdmin = {
        username: 'admin',
        email: 'admin@assettrack.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        company: 'Addwise Tracker',
        phone: '1234567890',
        password: 'Admin@123',
        signupTime: new Date().toISOString()
      };
      localStorage.setItem('users', JSON.stringify([defaultAdmin]));
      console.log('Default admin user created');
    }
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    company: '',
    phone: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.username || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username must be 3-20 characters long and can only contain letters, numbers, and underscores');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Use MongoDB API for registration
      const response = await api.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        phone: formData.phone,
        role: formData.role,
        agreeToTerms: formData.agreeToTerms
      });

      if (response.success) {
        console.log('User created successfully:', response.user);
        
        // Store user data if provided in response
        if (response.data && response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('isAuthenticated', 'true');
          
          Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            text: `Welcome to Addwise Tracker, ${formData.firstName}!`,
            confirmButtonText: 'Continue',
            confirmButtonColor: '#007bff'
          });
          navigate('/welcome');
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            text: `Welcome to Addwise Tracker, ${formData.firstName}!`,
            confirmButtonText: 'Continue',
            confirmButtonColor: '#007bff'
          });
          navigate(`/login/${formData.role}`);
        }
      }

    } catch (err) {
      console.error('❌ Signup error:', err);

      if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data?.message || err.message;
        console.log('📋 Server error message:', errorMessage);

        if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
          setError('❌ Username or email already exists. Please choose different credentials.');
        } else if (errorMessage.includes('password')) {
          setError('❌ Password requirements not met. Please check password strength.');
        } else if (errorMessage.includes('email')) {
          setError('❌ Invalid email format. Please enter a valid email address.');
        } else if (errorMessage.includes('username')) {
          setError('❌ Invalid username. Please use 3-20 characters with letters, numbers, and underscores only.');
        } else if (errorMessage.includes('terms')) {
          setError('❌ Please agree to the terms and conditions to continue.');
        } else {
          setError(`❌ ${errorMessage}`);
        }
      } else if (err.message.includes('Cannot connect to server')) {
        setError('❌ Cannot connect to server. Please ensure the server is running on port 5001.');
      } else {
        setError('❌ Signup failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <div className="logo">🏢</div>
            <h1>Create Account</h1>
            <p>Join Addwise Tracker</p>
          </div>

          {error && <Alert variant="danger" className="signup-alert">{error}</Alert>}

          <Form onSubmit={handleSubmit} className="signup-form">
            <Row>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="form-group">
              <Form.Label>Username *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose username"
                required
              />
              <Form.Text>3-20 characters, letters, numbers, underscores</Form.Text>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create password"
                    required
                  />
                  <Form.Text>Min 8 chars, uppercase, lowercase, numbers</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Company name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="form-group">
              <Form.Label>Account Type *</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="user">👤 User - Device scanning</option>
                <option value="admin">🛠️ Admin - Device management</option>
                <option value="superadmin">👑 Super Admin - Full access</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="form-group terms-group">
              <Form.Check
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                label={
                  <span>
                    I agree to the{' '}
                    <a href="#terms" className="terms-link">Terms</a>
                    {' '}and{' '}
                    <a href="#privacy" className="terms-link">Privacy</a>
                  </span>
                }
                required
              />
            </Form.Group>

            <div className="form-actions">
              <Button
                type="submit"
                className="signup-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>



              <div className="login-link">
                Have an account? <Link to="/login" className="link">Login</Link>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 