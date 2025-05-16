import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children }) => {
    // Check for authentication token
    const token = Cookies.get('token');
    const userRole = Cookies.get('userRole');

    // If no token or role is found, redirect to login
    if (!token || !userRole) {
        console.log('ProtectedRoute: No token or role found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the protected component
    return children;
};

export default ProtectedRoute; 