import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import AdminPayrollDashboard from "./pages/AdminPayrollDashboard";
import IntelligenceDashboard from "./pages/IntelligenceDashboard";
import ManagerPortal from "./pages/ManagerPortal";
import AuditLogViewer from "./pages/AuditLogViewer";
import SystemSettings from "./pages/SystemSettings";
import CRMDashboard from "./pages/CRMDashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={() => setIsAuthenticated(true)} />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Signup />
          }
        />
        <Route
          path="/admin/signup"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <AdminSignup />
          }
        />

        {/* Protected route */}
        <Route
          path="/"
          element={
            isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />
          }
          
        />

      <Route path="/attendance" element={<Attendance/>} />
      <Route path="/leave" element={<Leave/>} />
        <Route
          path="/admin/payroll"
          element={
            isAuthenticated ? <AdminPayrollDashboard /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/admin/intelligence"
          element={
            isAuthenticated ? <IntelligenceDashboard /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/admin/team"
          element={
            isAuthenticated ? <ManagerPortal /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/admin/audit"
          element={
            isAuthenticated ? <AuditLogViewer /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/admin/settings"
          element={
            isAuthenticated ? <SystemSettings /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/admin/crm"
          element={
            isAuthenticated ? <CRMDashboard /> : <Navigate to="/login" replace />
          }
        />
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
