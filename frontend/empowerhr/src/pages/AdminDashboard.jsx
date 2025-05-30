import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import CreateEmployee from '../components/CreateEmployee';
import { authenticatedFetch, parseJsonResponse, resetEmployeeDevice } from '../utils/api';
import AttendanceList from './Attendance';
import { FiCheckCircle, FiPlus,  FiClipboard } from 'react-icons/fi';
import TaskForm from '../components/TaskForm';
import { motion, AnimatePresence } from 'framer-motion';
// Mock data function for fallback
const getMockEmployees = () => {
    return [
        {
            _id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            department: 'Engineering',
            status: 'active',
            phone: '1234567890',
            employmentType: 'Full-time'
        },
        {
            _id: '2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            department: 'HR',
            status: 'active',
            phone: '9876543210',
            employmentType: 'Full-time'
        },
        {
            _id: '3',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            department: 'Marketing',
            status: 'inactive',
            phone: '5555555555',
            employmentType: 'Part-time'
        }
    ];
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState({});
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResetDeviceModal, setShowResetDeviceModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showDropdown, setShowDropdown] = useState(null);
    const [resetError, setResetError] = useState({ id: null, message: '' });
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [adminId, setAdminId] = useState(null);

    const handleClick = () => {
        navigate('/attendance');
    };
    const handleLeaveClick = () => {
        navigate('/attendance');
    };

    useEffect(() => {
        // Check if user is logged in and is admin
        const token = Cookies.get('token');
        const userRole = Cookies.get('userRole');

        if (!token || userRole !== 'admin') {
            navigate('/login');
            return;
        }

        // Load admin data from cookies
        try {
            const userDataString = Cookies.get('userData');
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                setAdminData(userData);
            } else {
                console.warn('No admin data found in cookies');
                setAdminData({});
            }
        } catch (error) {
            console.error('Error parsing admin data from cookies:', error);
            setAdminData({});
        }

        fetchEmployees();

        // Fetch admin ID when component mounts
        const fetchAdminId = async () => {
            try {
                // Get admin ID from userData in cookies instead of making an API call
                const userDataString = Cookies.get('userData');
                if (userDataString) {
                    const userData = JSON.parse(userDataString);
                    if (userData._id) {
                        setAdminId(userData._id);
                        return;
                    }
                }
                // Fallback to token payload if userData is not available
                const token = Cookies.get('token');
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.id) {
                        setAdminId(payload.id);
                    }
                }
            } catch (err) {
                console.error('Error getting admin ID:', err);
            }
        };
        fetchAdminId();
    }, [navigate]);

    const fetchEmployees = async () => {
        setLoading(true);
        setError('');

        try {
            console.log('Fetching employees list');
            // Use a relative path that will work with our proxy
            const response = await authenticatedFetch('/employees/all');

            if (response.ok) {
                const data = await parseJsonResponse(response);

                // Handle the specific response structure from the API
                if (data && data.data && Array.isArray(data.data)) {
                    setEmployees(data.data);
                    console.log(`Successfully loaded ${data.data.length} employees`);
                } else {
                    console.warn('Response does not contain expected data array', data);
                    setEmployees([]);
                }
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(
                    errorData?.message ||
                    errorData?.error ||
                    `Failed to fetch employees (${response.status})`
                );
            }
        } catch (err) {
            console.error('Error in fetchEmployees:', err);
            setError('Failed to load employees. Using mock data.');
            setEmployees(getMockEmployees());
        } finally {
            setLoading(false);
        }
    };

    const handleResetDevice = async (employeeId) => {
        setResetLoading(true);
        setResetSuccess('');
        setError('');

        try {
            console.log(`Resetting device for employee ${employeeId}`);
            const result = await resetEmployeeDevice(employeeId);
            console.log('Reset device result:', result);

            setResetSuccess(result.message || 'Device reset successfully');

            // Update the employee list to reflect the change
            setEmployees(prevEmployees =>
                prevEmployees.map(emp =>
                    emp._id === employeeId ? { ...emp, deviceId: null } : emp
                )
            );

            // Close the modal after a delay
            setTimeout(() => {
                setShowResetDeviceModal(false);
                setSelectedEmployee(null);
                setResetSuccess('');
            }, 2000);
        } catch (err) {
            console.error('Error resetting device:', err);
            setError(err.message || 'Failed to reset device');
        } finally {
            setResetLoading(false);
        }
    };

    const handleLogout = () => {
        // Clear cookies
        Cookies.remove('token');
        Cookies.remove('userRole');
        Cookies.remove('userData');

        // Don't remove deviceId from localStorage to maintain device recognition
        console.log('Admin logging out - deviceId preserved for future employee login');

        navigate('/login');
    };

    // Add this new function to verify authentication
    const verifyAdminAuthentication = () => {
        // Check for authentication token from multiple sources
        const token = Cookies.get('token') || localStorage.getItem('authToken');
        const userRole = Cookies.get('userRole');

        if (!token) {
            setError('Authentication required. Please log in again.');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
            return false;
        }

        if (userRole !== 'admin') {
            setError('Admin privileges required for this action.');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
            return false;
        }

        // Ensure token is set in cookie if it was found elsewhere
        if (!Cookies.get('token') && token) {
            Cookies.set('token', token, { expires: 1 });
        }

        return true;
    };

    // Update the function that opens the create employee modal
    const openCreateEmployeeModal = () => {
        if (verifyAdminAuthentication()) {
            setShowCreateModal(true);
        }
    };

    const handleEmployeeCreated = (newEmployeeData) => {
        setShowCreateModal(false);

        // Immediately add the new employee to the list for instant feedback
        if (newEmployeeData) {
            setEmployees(prevEmployees => [newEmployeeData, ...prevEmployees]);
        }

        // Then verify authentication and refresh the complete list from server
        if (verifyAdminAuthentication()) {
            fetchEmployees(); // Refresh the employees list
        }
    };

    const openResetDeviceModal = (employee) => {
        setSelectedEmployee(employee);
        setShowResetDeviceModal(true);
        setResetSuccess('');
        setError('');
    };

    // Filter employees based on search term and status
    const filteredEmployees = employees.filter(employee => {
        const matchesSearch =
            employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.department?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Handle sorting
    const handleSort = (field) => {
        // Implementation of handleSort function
    };

    // Sort employees
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        // Implementation of sorting logic
    });

    // New function to view employee details
    const handleViewEmployee = (employee) => {
        setSelectedEmployeeDetails(employee);
        setShowEmployeeDetails(true);
    };

    const handleCreateTask = async (taskData) => {
        try {
            const response = await fetch('https://ephrssbackend.vercel.app/task/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...taskData,
                    createdBy: adminId,
                    token: Cookies.get('token')
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to create task');
            }

            const data = await response.json();
            if (data) {
                setShowTaskModal(false);
                // Refresh the page to show the new task
                window.location.reload();
            }
        } catch (err) {
            console.error('Error creating task:', err);
            throw new Error(err.message || 'Failed to create task');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    {/* Navigation Bar */}
    <nav className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">EmpowerHR</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium">{adminData.name || 'Admin'}</span>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="bg-white rounded-xl shadow flex items-center p-6 cursor-pointer"
          onClick={openCreateEmployeeModal}
        >
          <FiPlus className="text-indigo-600 text-3xl mr-4" />
          <div>
            <div className="text-lg font-semibold">Add Employee</div>
            <div className="text-sm text-gray-500">Create a new employee record</div>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="bg-white rounded-xl shadow flex items-center p-6 cursor-pointer"
          onClick={() => setShowTaskModal(true)}
        >
          <FiClipboard className="text-green-600 text-3xl mr-4" />
          <div>
            <div className="text-lg font-semibold">All Tasks</div>
            <div className="text-sm text-gray-500">Assign or view tasks</div>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="bg-white rounded-xl shadow flex items-center p-6 cursor-pointer"
          onClick={handleClick}
        >
          <FiCheckCircle className="text-yellow-500 text-3xl mr-4" />
          <div>
            <div className="text-lg font-semibold">Attendance / Leave</div>
            <div className="text-sm text-gray-500">View attendance & leave</div>
          </div>
        </motion.div>
      </div>

      {/* Employee Management Table */}
      <motion.div
        className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Employee Management</h2>
            <button
              onClick={openCreateEmployeeModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition font-semibold"
            >
              <FiPlus /> Add Employee
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
              />
              <span className="absolute left-3 top-3 text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
            </div>
            <select
              className="py-3 px-4 border border-gray-300 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-indigo-400 text-sm transition"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Employee List Table */}
          <div className="overflow-x-auto">
            <motion.table
              className="min-w-full bg-white rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <thead>
                <tr className="bg-indigo-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedEmployees.map((employee) => (
                    <motion.tr
                      key={employee._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-indigo-50 transition"
                    >
                      <td className="px-4 py-3 font-medium">{employee.name}</td>
                      <td className="px-4 py-3">{employee.email}</td>
                      <td className="px-4 py-3">{employee.department}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{employee.phone}</td>
                      <td className="px-4 py-3">{employee.employmentType}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openResetDeviceModal(employee)}
                          className="text-red-500 hover:text-red-700 font-semibold text-xs"
                        >
                          Reset Device
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </motion.table>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
              <CreateEmployee
                onClose={() => setShowCreateModal(false)}
                onEmployeeCreated={handleEmployeeCreated}
              />
            </div>
          </motion.div>
        )}
        {showTaskModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
              <TaskForm
                onClose={() => setShowTaskModal(false)}
                onTaskCreated={handleCreateTask}
                adminId={adminId}
              />
            </div>
          </motion.div>
        )}
        {showEmployeeDetails && selectedEmployeeDetails && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Employee Details</h3>
              <div className="mb-2"><b>Name:</b> {selectedEmployeeDetails.name}</div>
              <div className="mb-2"><b>Email:</b> {selectedEmployeeDetails.email}</div>
              <div className="mb-2"><b>Department:</b> {selectedEmployeeDetails.department}</div>
              <div className="mb-2"><b>Status:</b> {selectedEmployeeDetails.status}</div>
              <div className="mb-2"><b>Phone:</b> {selectedEmployeeDetails.phone}</div>
              <div className="mb-2"><b>Type:</b> {selectedEmployeeDetails.employmentType}</div>
              <button
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                onClick={() => setShowEmployeeDetails(false)}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
        {showResetDeviceModal && selectedEmployee && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reset Device for {selectedEmployee.name}?</h3>
              <p className="mb-4 text-gray-700">Are you sure you want to reset the device for this employee?</p>
              <div className="flex gap-4">
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  onClick={() => handleResetDevice(selectedEmployee._id)}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Resetting...' : 'Yes, Reset'}
                </button>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                  onClick={() => setShowResetDeviceModal(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </button>
              </div>
              {resetSuccess && (
                <div className="mt-4 text-green-600 font-semibold">{resetSuccess}</div>
              )}
              {resetError.id === selectedEmployee._id && (
                <div className="mt-4 text-red-600 font-semibold">{resetError.message}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  </div>
);
};

export default AdminDashboard; 