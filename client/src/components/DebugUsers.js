import React, { useState, useEffect } from 'react';
import { Button, Card, Table } from 'react-bootstrap';

const DebugUsers = () => {
  const [users, setUsers] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const loadUsers = () => {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        setUsers(storedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      }
    };

    loadUsers();
    // Refresh every 2 seconds to show real-time updates
    const interval = setInterval(loadUsers, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearAllUsers = () => {
    if (window.confirm('Are you sure you want to clear all users? This cannot be undone.')) {
      localStorage.removeItem('users');
      localStorage.removeItem('currentUser');
      setUsers([]);
      alert('All users cleared!');
    }
  };

  if (!showDebug) {
    return (
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <Button 
          variant="info" 
          size="sm" 
          onClick={() => setShowDebug(true)}
          style={{ opacity: 0.7 }}
        >
          🐛 Debug Users
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 1000,
      maxWidth: '600px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>🐛 Debug: Stored Users ({users.length})</span>
          <div>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={clearAllUsers}
              className="me-2"
            >
              Clear All
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowDebug(false)}
            >
              ✕
            </Button>
          </div>
        </Card.Header>
        <Card.Body style={{ padding: '10px' }}>
          {users.length === 0 ? (
            <p className="text-muted mb-0">No users found in localStorage</p>
          ) : (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Name</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge bg-${
                        user.role === 'admin' ? 'success' : 
                        user.role === 'superadmin' ? 'danger' : 'primary'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td style={{ fontSize: '0.8em', fontFamily: 'monospace' }}>
                      {user.password?.substring(0, 10)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          <div className="mt-2">
            <small className="text-muted">
              Current User: {localStorage.getItem('currentUser') ? 
                JSON.parse(localStorage.getItem('currentUser')).username : 'None'}
            </small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DebugUsers;
