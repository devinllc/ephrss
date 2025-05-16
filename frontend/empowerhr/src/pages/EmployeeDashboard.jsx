import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCalendar, FiUser, FiMail, FiBriefcase, FiPhone, FiCheck, FiX, FiCheckCircle, FiList, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { getAttendanceStatus, authenticatedFetch, parseJsonResponse, getAttendanceStatusWithTokenInBody } from '../utils/api';

// Global axios config
axios.defaults.withCredentials = true;

const EmployeeDashboard = () => {
    const [userData, setUserData] = useState({});
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [isLoadingPayroll, setIsLoadingPayroll] = useState(false);
    const [payrollError, setPayrollError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attendanceError, setAttendanceError] = useState(null);
    const [isPunchedIn, setIsPunchedIn] = useState(false);
    const [isPunchingOut, setIsPunchingOut] = useState(false);
    const [isPunchingIn, setIsPunchingIn] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [showFallbackOption, setShowFallbackOption] = useState(false);
    const [fallbackAction, setFallbackAction] = useState(null);
    const [defaultOfficeLocation, setDefaultOfficeLocation] = useState({
        latitude: 37.7749, // Default (San Francisco)
        longitude: -122.4194,
        accuracy: 1000,
        isDefault: true
    });
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);
    const [taskError, setTaskError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = Cookies.get('token');
        const role = Cookies.get('userRole');
        const deviceId = localStorage.getItem('deviceId') || navigator.userAgent;

        console.log('EmployeeDashboard - Token:', token);
        console.log('EmployeeDashboard - Role:', role);
        console.log('EmployeeDashboard - DeviceId:', deviceId);

        if (!token || role !== 'employee') {
            console.log('EmployeeDashboard - Auth check failed, redirecting to login');
            navigate('/login');
            return;
        }

        // CRITICAL: Make sure token is set as cookie with name 'token'
        // The backend specifically looks for this cookie
        Cookies.set('token', token, { expires: 1 });

        // Try to get company office location from localStorage or set default
        try {
            const storedLocation = localStorage.getItem('companyLocation');
            if (storedLocation) {
                const locationData = JSON.parse(storedLocation);
                setDefaultOfficeLocation({
                    ...locationData,
                    accuracy: 1000,
                    isDefault: true
                });
            }
        } catch (error) {
            console.error('Error loading company location:', error);
            // Keep the default location
        }

        // Enable credentials for cross-origin requests
        axios.defaults.withCredentials = true;

        // Set auth header as backup
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Store token in localStorage for backup authentication
        localStorage.setItem('authToken', token);

        // Load user data from localStorage
        try {
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
                setUserData(JSON.parse(storedUserData));
            } else {
                // Try fallback to cookies if localStorage is empty
                const cookieData = Cookies.get('userData');
                if (cookieData) {
                    try {
                        setUserData(JSON.parse(cookieData));
                    } catch (e) {
                        console.error('Error parsing userData from cookies:', e);
                        setUserData({});
                    }
                } else {
                    setUserData({});
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setUserData({});
        }

        // Fetch data
        fetchAttendanceStatus();
        fetchLeaveRequests();
        fetchPayrollStatus();
        fetchTasks();

        // Attendance history is a premium feature - empty array for now
        setAttendanceHistory([]);
        setIsLoadingHistory(false);

        // Set up interval for refreshing
        const intervalId = setInterval(() => {
            fetchAttendanceStatus();
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [navigate]);

    // Add a useEffect to check login status on page load and on token changes
    useEffect(() => {
        const token = Cookies.get('token');

        if (token) {
            // If token exists, verify it works by refreshing attendance data
            fetchAttendanceStatus();
        } else {
            // If token is missing, redirect to login
            console.log('No authentication token found, redirecting to login');
            navigate('/login');
        }

        // Set up cookie expiration listener
        const checkTokenInterval = setInterval(() => {
            const currentToken = Cookies.get('token');
            if (!currentToken) {
                console.log('Token expired or removed, redirecting to login');
                clearInterval(checkTokenInterval);
                navigate('/login');
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkTokenInterval);
    }, [navigate]);

    // Add this effect to update isPunchedIn whenever attendanceStatus changes
    useEffect(() => {
        if (attendanceStatus && attendanceStatus.punchInTime && !attendanceStatus.punchOutTime) {
            console.log('Force updating isPunchedIn state to true based on attendance data');
            setIsPunchedIn(true);
        }
    }, [attendanceStatus]);

    // Update the getFormattedTime function to ensure consistent local time display
    const getFormattedTime = (dateValue) => {
        if (!dateValue) return 'Not Punched';

        try {
            // Try to parse the date
            const date = new Date(dateValue);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error('Invalid date value:', dateValue);
                // Return current time if invalid date is passed
                return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            }

            // Format with consistent options
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (error) {
            console.error('Error formatting date:', error);
            // Return current time as fallback
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        }
    };

    // Clean up formatUTCtoLocalTime function by removing debug logs
    const formatUTCtoLocalTime = (utcTimeString) => {
        if (!utcTimeString) return 'Not Punched';

        try {
            // Parse the UTC time string
            const date = new Date(utcTimeString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error('Invalid UTC date:', utcTimeString);
                return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            // Format with desired time format
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            return date.toLocaleTimeString([], options);
        } catch (error) {
            console.error('Error formatting UTC date:', error);
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    // Update the fetchAttendanceStatus function to handle date parsing more carefully
    const fetchAttendanceStatus = async () => {
        setIsLoading(true);
        setAttendanceError(null);

        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            console.log('Fetching attendance status with token');

            // Method 3 from LoginTest: Fetch with token in URL worked
            const response = await authenticatedFetch('/attendence/status');
            // Handle response parsing with helper function
            const data = await parseJsonResponse(response);
            console.log('Attendance response:', data);

            if (data && data.attendance) {
                const attendanceData = data.attendance;

                // Get formatted times
                const punchInTime = attendanceData.punchIn && attendanceData.punchIn.time ?
                    formatUTCtoLocalTime(attendanceData.punchIn.time) : null;

                const punchOutTime = attendanceData.punchOut && attendanceData.punchOut.time ?
                    formatUTCtoLocalTime(attendanceData.punchOut.time) : null;

                const formattedStatus = {
                    date: attendanceData.date,
                    punchInTime: punchInTime,
                    punchOutTime: punchOutTime,
                    status: attendanceData.status || 'absent',
                    totalHours: attendanceData.totalHours || 0,
                    verified: attendanceData.verified || false,
                    location: attendanceData.punchIn ? attendanceData.punchIn.location : null,
                    rawJson: data
                };

                setAttendanceStatus(formattedStatus);

                // Simplified logic to determine if user needs to punch in or out
                const shouldShowPunchOut =
                    // If status is present, always show punch-out button
                    attendanceData.status === 'present' ||
                    // Or if there's a punch-in but status isn't completed or absent
                    (!!punchInTime && !attendanceData.status.includes('complet') && attendanceData.status !== 'absent');

                console.log('Setting isPunchedIn to:', shouldShowPunchOut, 'status:', attendanceData.status);
                setIsPunchedIn(shouldShowPunchOut);

                if (shouldShowPunchOut) {
                    console.log('Employee is currently punched in');
                    // Removed reference to setPunchInTime that was causing errors
                }

                setAttendanceError(null);
            } else {
                throw new Error('Invalid response format from attendance API');
            }
        } catch (error) {
            console.error('Error fetching attendance status:', error);

            // For debugging
            if (error.response) {
                console.log('Error details:', error.response.data || 'No response data');
            }

            setAttendanceError('Could not fetch attendance status: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLeaveRequests = async () => {
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            console.log('Fetching leave requests with token');

            // Use authenticatedFetch with correct endpoint
            const response = await authenticatedFetch('/leave/requests');
            const data = await parseJsonResponse(response);

            // Show raw JSON data for debugging
            console.log('Raw leave data:', JSON.stringify(data, null, 2));
            console.log('Leave requests response:', data);

            if (data && data.leaveRequests) {
                const formattedLeaveRequests = data.leaveRequests.map(leave => ({
                    _id: leave._id,
                    from: leave.fromDate?.split('T')[0] || leave.from,
                    to: leave.toDate?.split('T')[0] || leave.to,
                    reason: leave.reason,
                    type: leave.type,
                    status: leave.status,
                    appliedOn: leave.appliedAt?.split('T')[0] || leave.appliedOn
                }));

                setLeaveRequests(formattedLeaveRequests);
                setError(null);
            } else {
                setLeaveRequests([]);
                setError('No leave requests found or invalid response format');
            }
        } catch (error) {
            console.error('Error fetching leave requests:', error);

            // For debugging
            if (error.response) {
                console.log('Error details:', error.response.data || 'No response data');
                console.log('Error status:', error.response.status || 'No status code');
                console.log('Error headers:', error.response.headers || 'No headers');
            }

            // Log cookies for debugging
            console.log('Current cookies:', document.cookie);

            // Set empty array and error message instead of mock data
            setLeaveRequests([]);
            setError('Failed to load leave requests: ' + (error.message || 'Unknown error'));
        }
    };

    const fetchPayrollStatus = async () => {
        setIsLoadingPayroll(true);
        setPayrollError(null);

        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            console.log('Fetching payroll status with token');

            // Use authenticatedFetch with CORRECT endpoint
            const response = await authenticatedFetch('/payrole/status');
            const data = await parseJsonResponse(response);

            console.log('Payroll response:', data);

            if (data && data.payrolls) {
                setPayrolls(data.payrolls);
                setPayrollError(null);
            } else {
                setPayrolls([]);
                setPayrollError('No payroll records found or invalid response format');
            }
        } catch (error) {
            console.error('Error fetching payroll status:', error);
            setPayrolls([]);
            setPayrollError('Failed to load payroll information: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoadingPayroll(false);
        }
    };

    const handlePunchIn = async () => {
        setIsPunchingIn(true);
        setError(null);
    
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });
    
            const { latitude, longitude } = position.coords;
            console.log(`Location: ${latitude}, ${longitude}`);
    
            const deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                setError('Device ID not found. Please log out and log in again.');
                return;
            }
    
            const locationData = {
                lat: latitude,
                lng: longitude,
            };
    
            // ✅ Fixed payload to match backend schema
            const response = await authenticatedFetch('/attendence/punch-in', {
                method: 'POST',
                body: JSON.stringify({
                    punchIn: {
                        location: locationData
                    },
                    deviceId,
                }),
            });
    
            const data = await parseJsonResponse(response);
    
            if (response.ok && data.success) {
                const serverPunchTime = data.attendance?.punchIn?.time
                    ? formatUTCtoLocalTime(data.attendance.punchIn.time)
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
                setError(`${data.message || "Successfully punched in"} at ${serverPunchTime}`);
                setTimeout(() => setError(null), 3000);
    
                setAttendanceStatus({
                    date: data.attendance.date,
                    punchInTime: serverPunchTime,
                    punchOutTime: null,
                    status: data.attendance.status || 'present',
                    totalHours: data.attendance.totalHours || 0,
                    verified: data.attendance.verified || false,
                    location: data.attendance.punchIn?.location || null,
                    rawJson: data,
                    originalPunchInTime: data.attendance.punchIn?.time || null,
                });
    
                setIsPunchedIn(true);
                setTimeout(() => fetchAttendanceStatus(), 1000);
            } else {
                const errMsg = data?.message || data?.error || 'Unknown error';
                setError('Failed to punch in: ' + errMsg);
    
                if (errMsg.includes('Already punched in')) {
                    setIsPunchedIn(true);
                    fetchAttendanceStatus();
                }
            }
        } catch (error) {
            console.error('Punch-in error:', error);
    
            if (error.code !== undefined) {
                const locationErrors = {
                    1: 'Location access denied. Please enable location permission in your browser settings.',
                    2: 'Unable to determine your location. Please check if location services are enabled on your device.',
                    3: 'Location request timed out. Please try again in an area with better signal.',
                };
                setError(locationErrors[error.code] || 'Location access required.');
                if (error.code === 2) {
                    setShowFallbackOption(true);
                    setFallbackAction('in');
                }
            } else {
                if (error?.message?.includes('Already punched in')) {
                    setIsPunchedIn(true);
                    fetchAttendanceStatus();
                }
                setError('Failed to punch in. Please try again.');
            }
        } finally {
            setIsPunchingIn(false);
        }
    };
    
    
    

    const handlePunchOut = async () => {
        setIsPunchingOut(true);
        setError(null);

        try {
            // Try to get geolocation
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        console.log(`Location: ${latitude}, ${longitude}`);

                        // Get the device ID from localStorage (same as used during login)
                        const deviceId = localStorage.getItem('deviceId');
                        if (!deviceId) {
                            setError('Device ID not found. Please log out and log in again.');
                            return;
                        }

                        // Prepare location data
                        const locationData = {
                            latitude,
                            longitude,
                            accuracy: position.coords.accuracy
                        };

                        console.log('Making punch-out request with location data and device ID');

                        // Use authenticatedFetch with token in headers and body
                        const response = await authenticatedFetch('/attendence/punch-out', {
                            method: 'POST',
                            body: JSON.stringify({
                                location: locationData,
                                deviceId: deviceId
                            })
                        });

                        // Parse response
                        const data = await parseJsonResponse(response);

                        // Check if the request was successful
                        if (response.ok && data.success) {
                            console.log('Punch out successful:', data);

                            // Display success message with current device time
                            const successMsg = data.message || "Successfully punched out";
                            const punchTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                            // Show success message briefly
                            setError(`${successMsg} at ${punchTime}`);

                            // Clear the error message after 3 seconds
                            setTimeout(() => setError(null), 3000);

                            // Update the attendance status with the new data
                            if (data.attendance) {
                                // Use UTC-to-local conversion for both times
                                const punchInServerTime = data.attendance.punchIn && data.attendance.punchIn.time
                                    ? formatUTCtoLocalTime(data.attendance.punchIn.time)
                                    : null;

                                const punchOutServerTime = data.attendance.punchOut && data.attendance.punchOut.time
                                    ? formatUTCtoLocalTime(data.attendance.punchOut.time)
                                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                                setAttendanceStatus({
                                    date: data.attendance.date,
                                    punchInTime: punchInServerTime,
                                    punchOutTime: punchOutServerTime,
                                    status: data.attendance.status || 'present',
                                    totalHours: data.attendance.totalHours || 0,
                                    verified: data.attendance.verified || false,
                                    rawJson: data,
                                    originalPunchInTime: data.attendance.punchIn ? data.attendance.punchIn.time : null,
                                    originalPunchOutTime: data.attendance.punchOut ? data.attendance.punchOut.time : null
                                });

                                // Update UI to show punch in button
                                setIsPunchedIn(false);
                            }

                            // Refresh attendance status after successful punch out
                            setTimeout(() => fetchAttendanceStatus(), 1000);
                        } else {
                            setError('Failed to punch out: ' + (data?.message || data?.error || 'Unknown error'));
                        }
                    } catch (err) {
                        console.error('Error during punch-out request:', err);
                        setError('Failed to punch out. Please try again.');
                    }
                },
                (error) => {
                    console.error('Location error:', error);
                    // Provide more specific error message based on error code
                    const errorMessages = {
                        1: 'Location access denied. Please enable location permission in your browser settings.',
                        2: 'Unable to determine your location. Please check if location services are enabled on your device.',
                        3: 'Location request timed out. Please try again in an area with better signal.'
                    };

                    setError(errorMessages[error.code] || 'Location access required for punching out.');

                    // Option to proceed with approximate location after warning
                    if (error.code === 2) {
                        setShowFallbackOption(true);
                        setFallbackAction('out');
                    }
                }
            );
        } catch (error) {
            console.error('Error in handlePunchOut:', error);
            setError('Failed to punch out. Please try again.');
        } finally {
            setIsPunchingOut(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('userRole');
        localStorage.removeItem('userData');

        // Clear deviceId when logging out but keep it in localStorage 
        // so the same device can be identified on next login
        console.log('Logging out - deviceId preserved for future login');

        navigate('/login');
    };

    // Update attemptTokenRefresh to better handle auth issues
    const attemptTokenRefresh = () => {
        // Clear any current error
        setError(null);

        // Display refreshing message
        setError("Attempting to refresh authentication...");

        // Try to refresh the token from any possible source
        const localToken = localStorage.getItem('authToken');
        const cookieToken = Cookies.get('token');
        const sessionToken = sessionStorage.getItem('token');

        console.log('Available tokens for refresh:',
            { localStorage: localToken, cookie: cookieToken, sessionStorage: sessionToken });

        // Ensure the token is set as a cookie with the exact name 'token'
        if (localToken && !cookieToken) {
            Cookies.set('token', localToken, { expires: 1 });
            setError("Token restored from local storage, retrying connection...");

            // Retry fetching data
            fetchAttendanceStatus();
            fetchLeaveRequests();
            fetchPayrollStatus();

            setTimeout(() => setError(null), 3000);
            return;
        }

        // If we have a token, try refreshing the page data
        if (cookieToken) {
            setError("Retrying with available authentication...");

            // Clear and re-fetch all data
            setAttendanceStatus(null);
            setLeaveRequests([]);
            setPayrolls([]);
            fetchAttendanceStatus();
            fetchLeaveRequests();
            fetchPayrollStatus();

            setTimeout(() => setError(null), 3000);
            return;
        }

        // If all tokens are missing, redirect to login
        setError("Session expired. Redirecting to login page...");
        setTimeout(() => {
            navigate('/login');
        }, 1500);
    };

    // Update the handleFallbackPunch function to use the default office location
    const handleFallbackPunch = async (action) => {
        const isIn = action === 'in';

        if (isIn) {
            setIsPunchingIn(true);
        } else {
            setIsPunchingOut(true);
        }

        setError(null);

        try {
            console.log(`Using default location for punch-${action}: ${defaultOfficeLocation.latitude}, ${defaultOfficeLocation.longitude}`);

            // Get the device ID from localStorage
            const deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                setError('Device ID not found. Please log out and log in again.');
                return;
            }

            // Use authenticatedFetch with the proper endpoint
            const endpoint = isIn ? '/attendence/punch-in' : '/attendence/punch-out';
            const response = await authenticatedFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    location: defaultOfficeLocation,
                    deviceId: deviceId,
                    useDefaultLocation: true // Flag for the backend to know this is a fallback
                })
            });

            // Parse response
            const data = await parseJsonResponse(response);

            // Handle success
            if (response.ok && data.success) {
                console.log(`Fallback punch-${action} successful:`, data);

                // Display success message with current device time
                const punchTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                setError(`${isIn ? 'Punched in' : 'Punched out'} with approximate location at ${punchTime}. Your HR may need to verify this attendance.`);

                // Clear the error message after 3 seconds
                setTimeout(() => setError(null), 3000);

                // Update attendance status
                if (data.attendance) {
                    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                    // Use UTC-to-local conversion for server times if available
                    const punchInTime = isIn ? currentTime :
                        (data.attendance.punchIn ? formatUTCtoLocalTime(data.attendance.punchIn.time) : null);

                    const punchOutTime = !isIn ? currentTime :
                        (data.attendance.punchOut ? formatUTCtoLocalTime(data.attendance.punchOut.time) : null);

                    setAttendanceStatus({
                        date: data.attendance.date,
                        punchInTime: punchInTime,
                        punchOutTime: punchOutTime,
                        status: data.attendance.status || 'present',
                        totalHours: data.attendance.totalHours || 0,
                        verified: false, // Mark as unverified since location is default
                        location: defaultOfficeLocation,
                        rawJson: data
                    });

                    // Update UI state
                    setIsPunchedIn(isIn);
                }

                // Refresh attendance status
                setTimeout(() => fetchAttendanceStatus(), 1000);
            } else {
                setError(`Failed to punch ${action}: ` + (data?.message || data?.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(`Error during fallback punch-${action}:`, err);
            setError(`Failed to punch ${action}. Please try again or contact support.`);
        } finally {
            if (isIn) {
                setIsPunchingIn(false);
            } else {
                setIsPunchingOut(false);
            }

            setShowFallbackOption(false);
            setFallbackAction(null);
        }
    };

    // Add this function after attemptTokenRefresh
    const setCompanyLocation = (latitude, longitude) => {
        const locationData = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        };

        try {
            localStorage.setItem('companyLocation', JSON.stringify(locationData));
            setDefaultOfficeLocation({
                ...locationData,
                accuracy: 1000,
                isDefault: true
            });

            return true;
        } catch (error) {
            console.error('Error saving company location:', error);
            return false;
        }
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Helper function to get month name
    const getMonthName = (month) => {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthNames[month - 1];
    };

    // Add function to open the payroll modal
    const openPayrollDetails = (payroll) => {
        setSelectedPayroll(payroll);
        setShowPayrollModal(true);
    };

    // Add new function to fetch tasks
    const fetchTasks = async () => {
        setIsLoadingTasks(true);
        setTaskError(null);
        try {
            const response = await authenticatedFetch('/task/user/assigned');
            if (response.ok) {
                const data = await parseJsonResponse(response);
                if (data && Array.isArray(data)) {
                    setTasks(data);
                } else {
                    setTasks([]);
                }
            } else {
                throw new Error('Failed to fetch tasks');
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setTaskError('Failed to load tasks');
            setTasks([]);
        } finally {
            setIsLoadingTasks(false);
        }
    };

    // Add function to update task status
    const handleTaskStatusUpdate = async (taskId, newStatus) => {
        try {
            const response = await authenticatedFetch(`/task/${taskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus, token: Cookies.get('token') })
            });

            if (response.ok) {
                // Update the task in the local state
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task._id === taskId ? { ...task, status: newStatus } : task
                    )
                );
            } else {
                throw new Error('Failed to update task status');
            }
        } catch (err) {
            console.error('Error updating task status:', err);
            setTaskError('Failed to update task status');
        }
    };

    // Add helper function for task status color
    const getTaskStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Add helper function for task priority color
    const getTaskPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="employee-dashboard">
            <div className="flex flex-col min-h-screen bg-gray-lightest">
                {/* Navigation Bar */}
                <nav className="bg-gradient-primary text-white p-4 shadow-md">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">EmpowerHR</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-white">{userData.name || 'Employee'}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-white bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg text-sm font-medium text-primary transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="flex-1 p-6 md:p-8">
                    {/* Welcome Section with Profile Info */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 md:mb-0 md:mr-6">
                                {userData.name ? userData.name.charAt(0) : 'E'}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">{userData.name || 'Welcome Employee'}</h2>
                                <p className="text-gray-600 mb-2">{userData.email || 'Login to view your email'}</p>
                                <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
                                    {userData.department || 'Employee'}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    <div className="bg-gray-50 rounded-lg p-3 transform transition hover:shadow-md">
                                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                                        <p className="font-medium text-gray-800">{userData.phone || 'Update Profile'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 transform transition hover:shadow-md">
                                        <p className="text-xs text-gray-500 uppercase">Employment</p>
                                        <p className="font-medium text-gray-800 capitalize">{userData.employmentType || 'Full-time'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 transform transition hover:shadow-md">
                                        <p className="text-xs text-gray-500 uppercase">Status</p>
                                        <p className={`font-medium capitalize ${userData.status === 'active' ? 'text-green-600' : userData.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                                            {userData.status || 'Active'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 transform transition hover:shadow-md">
                                        <p className="text-xs text-gray-500 uppercase">Joined</p>
                                        <p className="font-medium text-gray-800">{userData.joinDate ? formatDate(userData.joinDate) : 'Recent'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Attendance Status Section */}
                        <div className="md:col-span-1">
                            <div className="card hover-lift attendance-card">
                                <h3 className="section-title text-xl font-semibold mb-4">Today's Attendance</h3>
                                {isLoading ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-8 bg-gray-light rounded-md w-1/3"></div>
                                        <div className="h-20 bg-gray-light rounded-md"></div>
                                        <div className="h-10 bg-gray-light rounded-md w-1/2"></div>
                                    </div>
                                ) : (
                                    <>
                                        {attendanceError ? (
                                            <div className="text-center p-4 mb-4 bg-red-50 rounded-lg">
                                                <p className="text-red-500">{attendanceError}</p>
                                            </div>
                                        ) : null}

                                        {showFallbackOption && (
                                            <div className="p-4 mb-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                                                <p className="text-yellow-800 mb-3">Unable to get your precise location. Do you want to proceed with an approximate location?</p>
                                                <p className="text-sm text-yellow-700 mb-4">Note: Your HR may require verification for attendance with approximate location.</p>
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleFallbackPunch(fallbackAction)}
                                                        className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        Use Approximate Location
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowFallbackOption(false);
                                                            setFallbackAction(null);
                                                        }}
                                                        className="py-2 px-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {attendanceStatus ? (
                                            <>
                                                <div className="mb-6">
                                                    <div className="text-xl font-semibold mb-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${attendanceStatus?.status === 'present' ? 'bg-green-100 text-green-800' :
                                                        attendanceStatus?.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {attendanceStatus?.status === 'present' && !attendanceStatus?.punchOutTime ? (
                                                            <>
                                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                                                Punched In
                                                            </>
                                                        ) : attendanceStatus?.status === 'on_leave' ? (
                                                            <>
                                                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                                                On Leave
                                                            </>
                                                        ) : attendanceStatus?.status === 'present' && attendanceStatus?.punchOutTime ? (
                                                            <>
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                                Completed
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                                                                Not Punched In
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="stat-card transform transition hover:shadow-md">
                                                        <div className="text-sm text-gray-500">Punch In</div>
                                                        <div className="font-semibold text-gray-800">
                                                            {attendanceStatus?.punchInTime || 'Not Punched'}
                                                        </div>
                                                    </div>
                                                    <div className="stat-card transform transition hover:shadow-md">
                                                        <div className="text-sm text-gray-500">Punch Out</div>
                                                        <div className="font-semibold text-gray-800">
                                                            {attendanceStatus?.punchOutTime || 'Not Punched'}
                                                        </div>
                                                    </div>
                                                    <div className="stat-card transform transition hover:shadow-md">
                                                        <div className="text-sm text-gray-500">Total Hours</div>
                                                        <div className="font-semibold text-gray-800">{attendanceStatus?.totalHours || '0'} hrs</div>
                                                    </div>
                                                    <div className="stat-card transform transition hover:shadow-md">
                                                        <div className="text-sm text-gray-500">Status</div>
                                                        <div className="font-semibold capitalize">
                                                            {attendanceStatus?.status === 'present' ? (
                                                                <span className="text-green-600">Present</span>
                                                            ) : attendanceStatus?.status === 'absent' ? (
                                                                <span className="text-red-600">Absent</span>
                                                            ) : attendanceStatus?.status === 'leave' ? (
                                                                <span className="text-yellow-600">On Leave</span>
                                                            ) : (
                                                                attendanceStatus?.status || 'Unknown'
                                                            )}
                                                            {attendanceStatus?.location?.isDefault && (
                                                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Approx. Location</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4 mb-4">
                                                <p className="text-gray-500">No attendance record for today.</p>
                                            </div>
                                        )}

                                        {/* Modified punch button display logic - improved by checking both status and timestamps */}
                                        {(isPunchedIn ||
                                            (attendanceStatus?.status === 'present' && attendanceStatus?.punchInTime && !attendanceStatus?.punchOutTime)) ? (
                                            <button
                                                onClick={handlePunchOut}
                                                disabled={isPunchingOut}
                                                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                                            >
                                                {isPunchingOut ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                        Punch Out
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handlePunchIn}
                                                disabled={isPunchingIn}
                                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                                            >
                                                {isPunchingIn ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                        Punch In
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Leave Requests Section */}
                        <div className="md:col-span-1">
                            <div className="card hover-lift">
                                <h3 className="section-title text-xl font-semibold mb-4">Leave Requests</h3>
                                {leaveRequests.length > 0 ? (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                        {leaveRequests.map((leave) => (
                                            <div key={leave._id} className="leave-request-card p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition bg-white">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-2">
                                                            <span className="font-semibold mr-2 capitalize">{leave.type} Leave</span>
                                                            <span className={`leave-status px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(leave.status)}`}>
                                                                {leave.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600 mb-2 text-sm">{leave.reason}</p>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <FiCalendar className="mr-1" />
                                                            <span>{formatDate(leave.from)} - {formatDate(leave.to)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 md:mt-0 text-xs text-gray-400">
                                                        Applied on {formatDate(leave.appliedOn)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">{error || 'No leave requests found'}</p>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <button
                                        onClick={() => navigate('/apply-leave')}
                                        className="btn-outline-primary"
                                    >
                                        Apply for Leave
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Payroll Section - Now in the grid next to leave requests */}
                        <div className="md:col-span-1">
                            <div className="card hover-lift h-full">
                                <h3 className="section-title text-xl font-semibold mb-4">Payroll Information</h3>

                                {isLoadingPayroll ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-8 bg-gray-light rounded-md w-1/3"></div>
                                        <div className="h-20 bg-gray-light rounded-md"></div>
                                    </div>
                                ) : payrollError ? (
                                    <div className="text-center p-4 mb-4 bg-blue-50 rounded-lg">
                                        <p className="text-blue-500">{payrollError}</p>
                                    </div>
                                ) : payrolls.length > 0 ? (
                                    <div>
                                        {/* Latest Payroll Summary */}
                                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                                            <h4 className="font-medium mb-3">Latest Payroll</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Period:</span>
                                                    <span className="font-medium">{getMonthName(payrolls[0].month)} {payrolls[0].year}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Status:</span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${payrolls[0].status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                        {payrolls[0].status.charAt(0).toUpperCase() + payrolls[0].status.slice(1)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Gross:</span>
                                                    <span>{formatCurrency(payrolls[0].grossSalary)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Deductions:</span>
                                                    <span>{formatCurrency(payrolls[0].totalDeductions)}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-blue-200 font-semibold">
                                                    <span>Net Salary:</span>
                                                    <span className="text-blue-700">{formatCurrency(payrolls[0].netSalary)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center">
                
                                            <button
                                                onClick={() => openPayrollDetails(payrolls[0])}
                                                className="btn-outline-primary text-sm"
                                            >
                                                Upgrade Now
                                            </button>

                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <p className="text-gray-500">No payroll records found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Task Management Section */}
                        <div className="md:col-span-1">
                            <div className="card hover-lift h-full">
                                <h3 className="section-title text-xl font-semibold mb-4">Task Management</h3>
                                <div className="space-y-4">
                                    {isLoadingTasks ? (
                                        <div className="animate-pulse space-y-4">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-20 bg-gray-200 rounded"></div>
                                            <div className="h-20 bg-gray-200 rounded"></div>
                                        </div>
                                    ) : taskError ? (
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <FiAlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                            <p className="text-red-600">{taskError}</p>
                                        </div>
                                    ) : tasks.length > 0 ? (
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                            {tasks.map((task) => (
                                                <div key={task._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${getTaskPriorityColor(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${getTaskStatusColor(task.status)}`}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                            Due: {new Date(task.deadline).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {task.status !== 'completed' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleTaskStatusUpdate(task._id, 'in_progress')}
                                                                className={`px-3 py-1 text-xs rounded-full ${
                                                                    task.status === 'in_progress'
                                                                        ? 'bg-blue-500 text-white'
                                                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                                }`}
                                                            >
                                                                In Progress
                                                            </button>
                                                            <button
                                                                onClick={() => handleTaskStatusUpdate(task._id, 'completed')}
                                                                className={`px-3 py-1 text-xs rounded-full ${
                                                                    task.status === 'completed'
                                                                        ? 'bg-green-500 text-white'
                                                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                }`}
                                                            >
                                                                Complete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                                            <FiList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No tasks assigned</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => navigate('/tasks')}
                                        className="w-full btn btn-primary flex items-center justify-center space-x-2 mt-4"
                                    >
                                        <FiPlus className="h-5 w-5" />
                                        <span>Manage Tasks</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance History Section */}
                    <div className="mt-6">
                        <div className="card hover-lift">
                            <h3 className="section-title text-xl font-semibold mb-4">
                                Recent Attendance History
                                <span className="ml-2 px-2 py-1 text-xs font-bold bg-yellow-400 text-yellow-800 rounded-full">PREMIUM</span>
                            </h3>

                            <div className="text-center p-8 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-200">
                                <div className="flex flex-col items-center">
                                    <svg className="w-16 h-16 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                    <h4 className="text-xl font-bold text-yellow-800 mb-2">Premium Feature</h4>
                                    <p className="text-yellow-700 mb-4">Detailed attendance history is available with our premium plan.</p>
                                    <button
                                        className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg shadow-md hover:bg-yellow-600 transition-all duration-200"
                                        onClick={() => window.open('mailto:sales@empowerhr.com?subject=Premium%20Plan%20Inquiry')}
                                    >
                                        Upgrade Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Payroll Section - Show full table below */}
                    <div className="mt-6">
                        <div className="card hover-lift">
                            <h3 className="section-title text-xl font-semibold mb-4">Payroll History</h3>

                            {isLoadingPayroll ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-8 bg-gray-light rounded-md w-1/3"></div>
                                    <div className="h-20 bg-gray-light rounded-md"></div>
                                </div>
                            ) : payrolls.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {payrolls.map((payroll, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {getMonthName(payroll.month)} {payroll.year}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(payroll.basicSalary)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(payroll.grossSalary)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(payroll.totalDeductions)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatCurrency(payroll.netSalary)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${payroll.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                payroll.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'}`}>
                                                            {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">No payroll history available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payroll Detail Modal */}
            {showPayrollModal && selectedPayroll && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Payroll Details - {getMonthName(selectedPayroll.month)} {selectedPayroll.year}
                            </h3>
                            <button
                                onClick={() => setShowPayrollModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-3 text-blue-800">Payment Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${selectedPayroll.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                    {selectedPayroll.status.charAt(0).toUpperCase() + selectedPayroll.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Date:</span>
                                                <span>{selectedPayroll.paymentDate ? new Date(selectedPayroll.paymentDate).toLocaleDateString() : 'Pending'}</span>
                                            </div>
                                            {selectedPayroll.approvedBy && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Approved By:</span>
                                                    <span>Admin</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-3 text-blue-800">Attendance Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Working Days:</span>
                                                <span>{selectedPayroll.totalWorkingDays}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Days Present:</span>
                                                <span>{selectedPayroll.daysPresent}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Leave Approved:</span>
                                                <span>{selectedPayroll.daysLeaveApproved}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-medium mb-3">Allowances</h4>
                                    {selectedPayroll.allowances && selectedPayroll.allowances.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedPayroll.allowances.map((allowance, idx) => (
                                                <div key={idx} className="flex justify-between border-b pb-2">
                                                    <span>{allowance.type}</span>
                                                    <span>{formatCurrency(allowance.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-medium pt-2">
                                                <span>Total Allowances</span>
                                                <span>{formatCurrency(selectedPayroll.allowances.reduce((sum, item) => sum + item.amount, 0))}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No allowances</p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Deductions</h4>
                                    {selectedPayroll.deductions && selectedPayroll.deductions.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedPayroll.deductions.map((deduction, idx) => (
                                                <div key={idx} className="flex justify-between border-b pb-2">
                                                    <span>{deduction.type}</span>
                                                    <span>{formatCurrency(deduction.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-medium pt-2">
                                                <span>Total Deductions</span>
                                                <span>{formatCurrency(selectedPayroll.totalDeductions)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No deductions</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-200 pt-4">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                    <div className="mb-4 md:mb-0">
                                        <p className="text-sm text-gray-500">Salary Breakdown</p>
                                        <div className="grid grid-cols-2 gap-x-10 gap-y-1 mt-2">
                                            <div className="flex justify-between">
                                                <span>Basic Salary:</span>
                                                <span>{formatCurrency(selectedPayroll.basicSalary)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Gross Salary:</span>
                                                <span>{formatCurrency(selectedPayroll.grossSalary)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-100 p-4 rounded-lg">
                                        <p className="text-sm text-blue-800 mb-1">Net Salary</p>
                                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(selectedPayroll.netSalary)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowPayrollModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard; 