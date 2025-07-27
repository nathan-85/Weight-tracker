import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useUserContext } from '../contexts/UserContext';

const ProtectedRoute = ({ children, requiresProfile = false }) => {
  const { currentAccount, loading: authLoading } = useContext(AuthContext);
  const { users, loading: userLoading } = useUserContext();

  if (authLoading || (requiresProfile && userLoading)) {
    return <div>Loading...</div>;
  }

  if (!currentAccount) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfile && users.length === 0) {
    return <Navigate to="/profile/new" replace />;
  }

  return children;
};

export default ProtectedRoute; 