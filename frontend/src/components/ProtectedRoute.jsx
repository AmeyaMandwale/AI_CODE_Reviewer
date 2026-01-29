import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const orgId = localStorage.getItem('OrgId');
      const email = localStorage.getItem('Email');

      if (!isAuthenticated || !orgId || !email) {
        navigate('/signin', { 
          state: { message: 'Please sign in to access this page' } 
        });
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Get authentication status
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const orgId = localStorage.getItem('OrgId');
  const email = localStorage.getItem('Email');

  // Show loading or nothing while checking
  if (!isAuthenticated || !orgId || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;