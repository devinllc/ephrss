import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminSignup from './pages/AdminSignup';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ApplyLeave from './pages/ApplyLeave';
import LoginTest from './components/LoginTest';
import AdminPayrollDashboard from './pages/AdminPayrollDashboard';
import AttendanceList from './pages/Attendance';
import './App.css'
import LeaveList from './pages/Leave';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/apply-leave" element={<ApplyLeave />} />
        <Route path="/test-api" element={<LoginTest />} />
        <Route path="/admin-payroll" element={<AdminPayrollDashboard />} />
        <Route path="/attendance" element={<AttendanceList />} />
        <Route path="/leave" element={<LeaveList />} />
      </Routes>
    </Router>
  );
}

export default App;
