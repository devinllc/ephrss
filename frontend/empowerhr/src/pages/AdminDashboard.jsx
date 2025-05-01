import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import CreateEmployee from '../components/CreateEmployee';
import { authenticatedFetch, parseJsonResponse, resetEmployeeDevice } from '../utils/api';

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-lightest">
            {/* Navigation Bar */}
            <nav className="bg-gradient-primary text-white p-4 shadow-md">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">EmpowerHR</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-white">{adminData.name || 'Admin'}</span>
                        <button
                            onClick={handleLogout}
                            className=" bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg text-sm font-medium text-primary transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="bg-error bg-opacity-10 border-l-4 border-error text-error p-4 mb-6 rounded-lg shadow">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8 card">
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-dark mb-6">Employee Management</h2>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex-1 w-full sm:max-w-xs">
                                <div className="relative w-full max-w-md">
                                    {/* <span className="search-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </span> */}
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <select
                                    className="block py-3 px-4 border border-gray-light bg-white rounded-xl shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm transition"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <button
                                    onClick={openCreateEmployeeModal}
                                    className="btn btn-primary flex items-center space-x-2 px-4 py-2.5 rounded-lg shadow-md"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>Create Employee</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-xl border border-gray-light">
                            <table className="min-w-full divide-y divide-gray-light">
                                <thead className="bg-gray-lightest">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-dark uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-dark uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-dark uppercase tracking-wider">
                                            Department
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-dark uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-dark uppercase tracking-wider">
                                            Device
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-dark uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-light">
                                    {sortedEmployees.length > 0 ? (
                                        sortedEmployees.map((employee) => (
                                            <tr key={employee._id} className="hover:bg-gray-lightest transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-dark">{employee.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray">{employee.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray">{employee.department}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`badge ${employee.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                                                        {employee.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {employee.deviceId ? (
                                                        <span className="badge badge-secondary">
                                                            Device registered
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray">No device</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={() => handleViewEmployee(employee)}
                                                            className="action-button action-button-view"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                            </svg>
                                                            View
                                                        </button>

                                                        <button
                                                            onClick={() => navigate(`/admin-payroll?employeeId=${employee._id}`)}
                                                            className="action-button action-button-payroll"
                                                            title="Generate Payroll"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                            </svg>
                                                            Payroll
                                                        </button>

                                                        <button
                                                            onClick={() => alert(`Edit employee: ${employee.name}`)}
                                                            className="action-button action-button-edit"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={() => openResetDeviceModal(employee)}
                                                            className="action-button action-button-reset"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                            </svg>
                                                            Reset Device
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
                                                                    alert(`Deleted: ${employee.name}`);
                                                                }
                                                            }}
                                                            className="action-button action-button-delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray bg-gray-lightest">
                                                {searchTerm || filterStatus !== 'all' ? (
                                                    <div>
                                                        <p className="font-medium">No matching employees found</p>
                                                        <p className="mt-1">Try adjusting your search or filter</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="font-medium">No employees found</p>
                                                        <p className="mt-1">Add employees to get started</p>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Employee Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 overflow-y-auto z-50">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh]">
                            <div className="bg-white px-6 pt-5 pb-6 max-h-[90vh] overflow-visible">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">Add New Employee</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <CreateEmployee onSuccess={handleEmployeeCreated} onClose={() => setShowCreateModal(false)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Device Modal */}
            {showResetDeviceModal && selectedEmployee && (
                <div className="fixed inset-0 overflow-y-auto z-50">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                {resetSuccess ? (
                                    <div className="text-center">
                                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="mt-3 text-lg leading-6 font-medium text-gray-900">{resetSuccess}</h3>
                                    </div>
                                ) : (
                                    <>
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                                                <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                                <h3 className="text-lg leading-6 font-medium text-gray-900">Reset Device ID</h3>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-500">
                                                        Are you sure you want to reset the device ID for {selectedEmployee.name}? This will log them out of their current device and require re-login.
                                                    </p>
                                                </div>
                                                {error && (
                                                    <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-4">
                                                        <p className="text-sm text-red-700">{error}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="button"
                                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${resetLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                onClick={() => handleResetDevice(selectedEmployee._id)}
                                                disabled={resetLoading}
                                            >
                                                {resetLoading ? 'Processing...' : 'Reset Device'}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                                onClick={() => setShowResetDeviceModal(false)}
                                                disabled={resetLoading}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Details Modal */}
            {showEmployeeDetails && selectedEmployeeDetails && (
                <div className="fixed inset-0 overflow-y-auto z-50">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEmployeeDetails(false)}
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Employee Details</h3>

                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-xl font-bold">{selectedEmployeeDetails.name}</h4>
                                                <span className={`badge ${selectedEmployeeDetails.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                                                    {selectedEmployeeDetails.status}
                                                </span>
                                            </div>
                                            <p className="text-gray mb-1">{selectedEmployeeDetails.email}</p>
                                            <p className="text-gray mb-1">{selectedEmployeeDetails.phone || 'No phone number'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-500">Department</p>
                                                <p className="font-medium">{selectedEmployeeDetails.department || 'Not assigned'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-500">Employment Type</p>
                                                <p className="font-medium">{selectedEmployeeDetails.employmentType || 'Not specified'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-500">Device Status</p>
                                                <p className="font-medium">
                                                    {selectedEmployeeDetails.deviceId ? 'Registered' : 'No device'}
                                                </p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-500">Join Date</p>
                                                <p className="font-medium">
                                                    {selectedEmployeeDetails.joinDate ? new Date(selectedEmployeeDetails.joinDate).toLocaleDateString() : 'Not available'}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedEmployeeDetails.address && (
                                            <div className="mt-4 bg-white p-3 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-500">Address</p>
                                                <p className="font-medium">{selectedEmployeeDetails.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowEmployeeDetails(false)}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => {
                                        setShowEmployeeDetails(false);
                                        alert(`Edit employee: ${selectedEmployeeDetails.name}`);
                                    }}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard; 