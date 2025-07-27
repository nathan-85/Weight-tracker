import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useUserContext } from '../contexts/UserContext';

const ProtectedRoute = ({ children, requiresProfile = false }) => {
  const { currentAccount, loading: authLoading } = useContext(AuthContext);
  const { users, loading: userLoading } = useUserContext();
  const [hasCheckedUsers, setHasCheckedUsers] = useState(false);

  useEffect(() => {
    if (!authLoading && !userLoading && currentAccount) {
      setHasCheckedUsers(true);
    }
  }, [authLoading, userLoading, currentAccount, users]);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!currentAccount) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfile) {
    if (userLoading) {
      return <div>Loading...</div>;
    }
    
    // Only check for redirect after we've actually loaded and checked users
    if (hasCheckedUsers && users.length === 0) {
      return <Navigate to="/profile/new" replace />;
    }
    
    // If we haven't checked users yet, show loading
    if (!hasCheckedUsers) {
      return <div>Loading...</div>;
    }
  }

  return children;
};

export default ProtectedRoute; 