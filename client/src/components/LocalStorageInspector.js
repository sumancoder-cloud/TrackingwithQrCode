import React, { useState } from 'react';
import { Button, Card, Form, Alert } from 'react-bootstrap';

const LocalStorageInspector = () => {
  const [showInspector, setShowInspector] = useState(false);
  const [message, setMessage] = useState('');

  const checkLocalStorage = () => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = localStorage.getItem('currentUser');
      
      console.log('=== LOCALSTORAGE DEBUG ===');
      console.log('Users array:', users);
      console.log('Current user:', currentUser);
      console.log('Users count:', users.length);
      
      if (users.length > 0) {
        console.log('User details:');
        users.forEach((user, index) => {
          console.log(`User ${index + 1}:`, {
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password ? 'SET' : 'NOT SET'
          });
        });
      }
      
      setMessage(`Found ${users.length} users in localStorage. Check console for details.`);
    } catch (error) {
      console.error('Error reading localStorage:', error);
      setMessage('Error reading localStorage: ' + error.message);
    }
  };

  const createTestUser = () => {
    try {
      const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        company: 'Test Company',
        phone: '1234567890',
        password: 'Test123!',
        signupTime: new Date().toISOString()
      };

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if test user already exists
      const existingUser = users.find(u => u.username === 'testuser');
      if (existingUser) {
        setMessage('Test user already exists!');
        return;
      }

      users.push(testUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      console.log('Test user created:', testUser);
      setMessage('Test user created successfully! Username: testuser, Password: Test123!');
    } catch (error) {
      console.error('Error creating test user:', error);
      setMessage('Error creating test user: ' + error.message);
    }
  };

  const recreateYourUser = () => {
    try {
      const yourUser = {
        username: 'suman2_user',
        email: 'suman@example.com',
        role: 'user',
        firstName: 'Suman',
        lastName: 'Yadav',
        company: 'Your Company',
        phone: '1234567890',
        password: 'Suman123!',
        signupTime: new Date().toISOString()
      };

      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // Remove existing user with same username if exists
      const filteredUsers = users.filter(u => u.username !== 'suman2_user');
      filteredUsers.push(yourUser);

      localStorage.setItem('users', JSON.stringify(filteredUsers));

      console.log('Your user recreated:', yourUser);
      setMessage('Your user recreated! Username: suman2_user, Password: Suman123!');
    } catch (error) {
      console.error('Error recreating your user:', error);
      setMessage('Error recreating your user: ' + error.message);
    }
  };

  const regenerateQRCodes = () => {
    try {
      // Generate a proper 16-digit numeric code
      const generate16DigitCode = () => {
        let code = '';
        for (let i = 0; i < 16; i++) {
          code += Math.floor(Math.random() * 10).toString();
        }
        return code;
      };

      const deviceRequests = JSON.parse(localStorage.getItem('deviceRequests') || '[]');
      let updatedCount = 0;

      const updatedRequests = deviceRequests.map(request => {
        const updatedDevices = request.devices.map(device => {
          if (device.status === 'approved' && device.qrCode) {
            try {
              const oldQrData = JSON.parse(device.qrCode);
              const newQrData = {
                ...oldQrData,
                deviceId: generate16DigitCode(), // New 16-digit code
                generatedAt: new Date().toISOString()
              };
              updatedCount++;
              return {
                ...device,
                qrCode: JSON.stringify(newQrData)
              };
            } catch (error) {
              console.error('Error updating QR code:', error);
              return device;
            }
          }
          return device;
        });
        return { ...request, devices: updatedDevices };
      });

      localStorage.setItem('deviceRequests', JSON.stringify(updatedRequests));
      setMessage(`Regenerated ${updatedCount} QR codes with new 16-digit codes!`);
      console.log('QR codes regenerated:', updatedRequests);
    } catch (error) {
      console.error('Error regenerating QR codes:', error);
      setMessage('Error regenerating QR codes: ' + error.message);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL localStorage data?')) {
      localStorage.clear();
      setMessage('All localStorage data cleared!');
      console.log('All localStorage cleared');
    }
  };

  if (!showInspector) {
    return (
      <div style={{ position: 'fixed', bottom: '70px', right: '20px', zIndex: 1000 }}>
        <Button 
          variant="warning" 
          size="sm" 
          onClick={() => setShowInspector(true)}
          style={{ opacity: 0.7 }}
        >
          🔍 Storage Inspector
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '70px', 
      right: '20px', 
      zIndex: 1000,
      maxWidth: '400px'
    }}>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>🔍 LocalStorage Inspector</span>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowInspector(false)}
          >
            ✕
          </Button>
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={message.includes('Error') ? 'danger' : 'info'} className="mb-3">
              {message}
            </Alert>
          )}
          
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={checkLocalStorage}>
              Check Current Data
            </Button>
            
            <Button variant="success" onClick={createTestUser}>
              Create Test User
            </Button>
            
            <Button variant="info" onClick={recreateYourUser}>
              Recreate "suman2_user"
            </Button>

            <Button variant="warning" onClick={regenerateQRCodes}>
              Regenerate 16-Digit Codes
            </Button>

            <Button variant="danger" onClick={clearAllData}>
              Clear All Data
            </Button>
          </div>
          
          <div className="mt-3">
            <small className="text-muted">
              Use browser console (F12) to see detailed logs
            </small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LocalStorageInspector;
