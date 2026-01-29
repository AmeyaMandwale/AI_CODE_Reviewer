import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const orgId = localStorage.getItem('OrgId');
      const email = localStorage.getItem('Email');

      if (storedAuth === 'true' && orgId && email) {
        // Optional: Verify with backend
        const response = await fetch('/api/user/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orgId, email })
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          signOut();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      signOut();
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('OrgId');
    localStorage.removeItem('Email');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    navigate('/signin');
  };

  return { isAuthenticated, loading, signOut, checkAuth };
};