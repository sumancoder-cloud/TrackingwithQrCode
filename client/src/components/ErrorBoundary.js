import React from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <Card>
            <Card.Header className="bg-danger text-white">
              <h4>⚠️ Something went wrong</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="danger">
                <Alert.Heading>Application Error</Alert.Heading>
                <p>
                  The application encountered an unexpected error. This is usually caused by:
                </p>
                <ul>
                  <li>Server connection issues (check if backend is running on port 5001)</li>
                  <li>Missing dependencies or libraries</li>
                  <li>JavaScript runtime errors</li>
                </ul>
              </Alert>

              <div className="mt-3">
                <Button 
                  variant="primary" 
                  onClick={() => window.location.reload()}
                  className="me-2"
                >
                  🔄 Reload Page
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => window.location.href = '/'}
                >
                  🏠 Go Home
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary>Error Details (Development Mode)</summary>
                  <pre className="mt-2 p-3 bg-light border rounded">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </Card.Body>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
