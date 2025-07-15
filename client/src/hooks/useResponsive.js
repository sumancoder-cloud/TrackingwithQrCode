import { useState, useEffect } from 'react';

// Custom hook for responsive design
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
      
      // Detect if DevTools might be open (rough estimation)
      // This is not 100% accurate but gives a good indication
      const screenHeight = window.screen?.height || 1080;
      const screenWidth = window.screen?.width || 1920;
      const heightRatio = height / screenHeight;
      const widthRatio = width / screenWidth;

      // If the viewport is significantly smaller than the screen, DevTools might be open
      setIsDevToolsOpen(heightRatio < 0.75 || widthRatio < 0.75);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isDevToolsOpen,
    // Utility functions
    getResponsiveValue: (mobile, tablet, desktop) => {
      if (isMobile) return mobile;
      if (isTablet) return tablet;
      return desktop;
    },
    getResponsivePadding: () => {
      if (isDevToolsOpen) return '0.25rem';
      if (isMobile) return '0.5rem';
      return '1rem';
    },
    getResponsiveModalSize: () => {
      if (isMobile) return 'sm';
      if (isTablet) return 'lg';
      return 'xl';
    }
  };
};

// Hook for detecting DevTools specifically
export const useDevTools = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const heightDiff = window.outerHeight - window.innerHeight;
      const widthDiff = window.outerWidth - window.innerWidth;
      
      // DevTools is likely open if there's a significant difference
      setIsOpen(heightDiff > threshold || widthDiff > threshold);
    };

    // Check on resize
    window.addEventListener('resize', detectDevTools);
    
    // Initial check
    detectDevTools();

    return () => window.removeEventListener('resize', detectDevTools);
  }, []);

  return isOpen;
};

export default useResponsive;
