import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const usePreventNavigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Store the current path when component mounts
    const currentPath = window.location.pathname;

    // Handle browser back/forward buttons
    const handlePopState = (event) => {
      // Prevent the default navigation
      event.preventDefault();
      
      // Force navigation back to the current path
      navigate(currentPath, { replace: true });
      
      // Push a new state to prevent further back/forward navigation
      window.history.pushState(null, '', currentPath);
    };

    // Push initial state
    window.history.pushState(null, '', currentPath);

    // Add event listener for popstate
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);
};

export default usePreventNavigation; 