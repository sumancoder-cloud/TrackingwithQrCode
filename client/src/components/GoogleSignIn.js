import React, { useEffect, useRef, useCallback } from 'react';

const GoogleSignIn = ({ onSuccess, onError, buttonText = "Sign in with Google", role = "user" }) => {
  const googleButtonRef = useRef(null);

  // Helper function to decode JWT token
  const parseJwt = useCallback((token) => {
    try {
      console.log('🔍 Parsing JWT token...');

      // Validate token format
      if (!token || typeof token !== 'string') {
        throw new Error('Token is not a valid string');
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token does not have 3 parts');
      }

      const base64Url = parts[1];
      if (!base64Url) {
        throw new Error('Token payload is empty');
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Add padding if needed
      const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);

      const jsonPayload = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const parsed = JSON.parse(jsonPayload);
      console.log('✅ JWT parsed successfully');
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing JWT:', error.message);
      throw new Error(`Invalid token: ${error.message}`);
    }
  }, []);

  const handleCredentialResponse = useCallback(async (response) => {
    try {
      console.log('🔐 Google Sign-In Response:', response);

      // Validate response structure
      if (!response || !response.credential) {
        throw new Error('Invalid response from Google Sign-In');
      }

      // Decode the JWT token to get user information
      let userInfo;
      try {
        userInfo = parseJwt(response.credential);
        console.log('✅ Successfully decoded user info:', userInfo);
      } catch (parseError) {
        console.error('❌ Token parsing failed:', parseError);
        throw new Error('Invalid token format');
      }

      // Validate required user information
      if (!userInfo.email || !userInfo.sub) {
        throw new Error('Incomplete user information from Google');
      }

      // Create user object with Google data
      const googleUser = {
        username: userInfo.email.split('@')[0], // Use email prefix as username
        email: userInfo.email,
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'User',
        lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
        fullName: userInfo.name || `${userInfo.given_name || 'User'} ${userInfo.family_name || ''}`.trim(),
        picture: userInfo.picture || '',
        googleId: userInfo.sub || userInfo.id,
        role: role, // Use the role passed as prop
        signupTime: new Date().toISOString(),
        loginTime: new Date().toISOString(),
        authProvider: 'google'
      };

      console.log('👤 Created Google user object:', googleUser);

      // Check if this is login or signup based on existing users
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = existingUsers.find(user => user.email === googleUser.email);

      if (existingUser) {
        // Login: Update existing user with Google data and login time
        const updatedUser = { ...existingUser, ...googleUser, loginTime: new Date().toISOString() };
        const updatedUsers = existingUsers.map(user => 
          user.email === googleUser.email ? updatedUser : user
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        onSuccess(updatedUser, 'login');
      } else {
        // Signup: Add new user
        const newUsers = [...existingUsers, googleUser];
        localStorage.setItem('users', JSON.stringify(newUsers));
        onSuccess(googleUser, 'signup');
      }
    } catch (error) {
      console.error('❌ Google Sign-In Error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Google Sign-In failed';
      if (error.message.includes('Invalid token')) {
        errorMessage = 'Invalid token received from Google. Please try again.';
      } else if (error.message.includes('Incomplete user information')) {
        errorMessage = 'Unable to get complete user information from Google.';
      } else if (error.message.includes('Invalid response')) {
        errorMessage = 'Invalid response from Google Sign-In service.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onError(errorMessage);
    }
  }, [onSuccess, onError, role, parseJwt]);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    console.log('🚀 GoogleSignIn component mounted');
    console.log('🔑 Client ID:', clientId ? 'Found' : 'Missing');
    console.log('🌐 Window.google:', window.google ? 'Available' : 'Not available');

    if (!clientId) {
      console.error('❌ Google Client ID not found in .env file');
      onError('Google Sign-In configuration missing. Please contact support.');
      return;
    }

    console.log('🔧 Initializing Google Sign-In with Client ID:', clientId.substring(0, 20) + '...');

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total

    const initializeGoogleSignIn = () => {
      attempts++;
      console.log(`🔄 Attempt ${attempts}/${maxAttempts} to initialize Google Sign-In`);

      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          console.log('✅ Google API loaded, initializing...');

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(
              googleButtonRef.current,
              {
                theme: "outline",
                size: "large",
                text: "signin_with",
                shape: "rectangular",
                logo_alignment: "left",
                width: "300"  // Fixed width instead of percentage
              }
            );
            console.log('✅ Google Sign-In button rendered successfully');
          } else {
            console.warn('⚠️ Google button ref not available');
          }
        } catch (error) {
          console.error('❌ Google Sign-In initialization error:', error);
          onError('Failed to initialize Google Sign-In. Please refresh the page.');
        }
      } else {
        if (attempts < maxAttempts) {
          console.log(`⏳ Waiting for Google API to load... (attempt ${attempts})`);
          setTimeout(initializeGoogleSignIn, 100);
        } else {
          console.error('❌ Google API failed to load after 5 seconds');
          onError('Google Sign-In service is not available. Please try again later.');
        }
      }
    };

    setTimeout(initializeGoogleSignIn, 100);
  }, [onError, handleCredentialResponse]);

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      {/* Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '1rem 0',
        color: '#666'
      }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
        <span style={{ padding: '0 1rem', fontSize: '0.9rem' }}>or</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
      </div>

      {/* Google Sign-In Button Container */}
      <div ref={googleButtonRef} style={{ width: '100%', minHeight: '40px' }}>
        {/* Fallback button in case Google API doesn't load */}
        <button
          onClick={() => {
            console.log('🖱️ Fallback Google button clicked');
            if (window.google && window.google.accounts) {
              window.google.accounts.id.prompt();
            } else {
              onError('Google Sign-In is not available. Please refresh the page.');
            }
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#3c4043',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'Roboto, sans-serif'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {buttonText}
        </button>
      </div>

      <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
        <small style={{ color: '#666', fontSize: '0.8rem' }}>
          Continue with your Google account
        </small>
      </div>
    </div>
  );
};

export default GoogleSignIn;
