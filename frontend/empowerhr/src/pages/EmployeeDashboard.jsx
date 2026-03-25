import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCalendar, FiUser, FiMail, FiBriefcase, FiPhone, FiCheck, FiX, FiCheckCircle, FiList, FiAlertCircle, FiPlus, FiDollarSign, FiLogOut } from 'react-icons/fi';
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
            const userDataString = Cookies.get('userData') || localStorage.getItem('userData');
            if (!userDataString) throw new Error("User data not found for tasks");
            const user = JSON.parse(userDataString);
            if (!user._id) throw new Error("User ID not found for tasks");

            const response = await authenticatedFetch(`/task/${user._id}`);
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
        <div className="flex flex-col min-h-screen bg-white font-['Poppins',_sans-serif]">
            {/* App Bar like Flutter */}
            <nav className="bg-white sticky top-0 z-30 border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 h-16">
                {/* Left empty for center balance or icon */}
                <div className="w-1/3"></div>
                {/* Center Logo */}
                <div className="w-1/3 flex justify-center">
                    <h1 className="text-2xl font-black text-[#6B15AD] tracking-tight">EmpowerHR</h1>
                </div>
                {/* Right Actions */}
                <div className="w-1/3 flex justify-end items-center gap-4">
                    <button onClick={handleLogout} className="text-[#6B15AD] p-2 hover:bg-[#6B15AD]/10 rounded-full transition">
                        <FiLogOut className="text-xl" />
                    </button>
                    <div className="w-9 h-9 border-2 border-[#6B15AD] rounded-full flex items-center justify-center text-[#6B15AD] bg-[#6B15AD]/10 font-bold">
                        {userData.name ? userData.name.charAt(0) : 'E'}
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-5xl mx-auto py-6 px-4">
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#6B15AD]">Welcome,</h2>
                    <p className="text-[#6B15AD]/80 text-lg md:text-xl font-medium mt-1">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                {/* Dashboard Grid Container */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Main Left Area: Attendance & Punch */}
                    <div className="md:col-span-7 space-y-6">
                        {/* Attendance Punch Card */}
                        <div className="bg-[#6B15AD]/[0.05] rounded-2xl p-6 border border-[#6B15AD]/10">
                            <h3 className="text-xl font-bold text-[#6B15AD] mb-6">Today's Status</h3>
                            
                            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between mb-8">
                                <div className="text-center w-full">
                                    <p className="text-sm font-bold text-[#6B15AD] mb-2 uppercase tracking-wide">In</p>
                                    <p className="text-2xl font-mono text-gray-800">{attendanceStatus?.punchInTime || '--:--'}</p>
                                </div>
                                <div className="h-12 w-px bg-[#6B15AD]/20 hidden sm:block"></div>
                                <div className="text-center w-full">
                                    <p className="text-sm font-bold text-[#6B15AD] mb-2 uppercase tracking-wide">Out</p>
                                    <p className="text-2xl font-mono text-gray-800">{attendanceStatus?.punchOutTime || '--:--'}</p>
                                </div>
                                <div className="h-12 w-px bg-[#6B15AD]/20 hidden sm:block"></div>
                                <div className="text-center w-full">
                                    <p className="text-sm font-bold text-[#6B15AD] mb-2 uppercase tracking-wide">Hours</p>
                                    <p className="text-2xl font-mono font-bold text-gray-800">{attendanceStatus?.totalHours || '0.0'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {(isPunchedIn || (attendanceStatus?.status === 'present' && attendanceStatus?.punchInTime && !attendanceStatus?.punchOutTime)) ? (
                                    <button onClick={handlePunchOut} disabled={isPunchingOut} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                                        <FiLogOut /> {isPunchingOut ? 'Processing...' : 'Punch Out'}
                                    </button>
                                ) : (
                                    <button onClick={handlePunchIn} disabled={isPunchingIn} className="flex-1 py-4 bg-[#6B15AD] hover:bg-[#58118d] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                                        <FiCheckCircle /> {isPunchingIn ? 'Processing...' : 'Punch In'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Recent Tasks */}
                        <div className="bg-[#6B15AD]/[0.05] rounded-2xl p-6 border border-[#6B15AD]/10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-[#6B15AD]">Active Tasks</h3>
                                <button onClick={() => navigate('/tasks')} className="bg-[#6B15AD]/10 text-[#6B15AD] px-3 py-1.5 rounded-lg text-sm font-bold">Manage All</button>
                            </div>
                            
                            {isLoadingTasks ? (
                                <div className="py-6 text-center text-gray-500">Loading tasks...</div>
                            ) : tasks.filter(t => t.status !== 'completed').length > 0 ? (
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status !== 'completed').slice(0, 3).map(task => (
                                        <div key={task._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-800">{task.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {task.status !== 'in_progress' && (
                                                    <button onClick={() => handleTaskStatusUpdate(task._id, 'in_progress')} className="bg-[#6B15AD]/10 text-[#6B15AD] p-2 rounded-lg hover:bg-[#6B15AD]/20 transition"><FiClock /></button>
                                                )}
                                                <button onClick={() => handleTaskStatusUpdate(task._id, 'completed')} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition"><FiCheck /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-500 flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-2">
                                        <FiCheck className="text-2xl" />
                                    </div>
                                    <p className="font-medium">No tasks assigned</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Self Service Tiles & Details */}
                    <div className="md:col-span-5 space-y-6">
                        
                        <div className="bg-[#6B15AD]/[0.05] rounded-2xl p-6 border border-[#6B15AD]/10">
                            <h3 className="text-xl font-bold text-[#6B15AD] mb-4">Self-service</h3>
                            <p className="text-gray-500 text-sm mb-6">Apply for leave, view payslips, profile</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => navigate('/leave')} className="bg-[#6B15AD]/10 hover:bg-[#6B15AD]/20 transition rounded-2xl p-4 flex flex-col items-center justify-center text-center aspect-[4/3]">
                                    <FiCalendar className="text-3xl text-[#6B15AD] mb-2" />
                                    <span className="font-bold text-[#6B15AD] text-sm">Leaves</span>
                                </button>
                                <button onClick={() => payrolls.length > 0 && openPayrollDetails(payrolls[0])} className="bg-[#6B15AD]/10 hover:bg-[#6B15AD]/20 transition rounded-2xl p-4 flex flex-col items-center justify-center text-center aspect-[4/3]">
                                    <FiDollarSign className="text-3xl text-[#6B15AD] mb-2" />
                                    <span className="font-bold text-[#6B15AD] text-sm">Payroll</span>
                                </button>
                                <button onClick={() => {}} className="bg-[#6B15AD]/10 hover:bg-[#6B15AD]/20 transition rounded-2xl p-4 flex flex-col items-center justify-center text-center aspect-[4/3]">
                                    <FiBriefcase className="text-3xl text-[#6B15AD] mb-2" />
                                    <span className="font-bold text-[#6B15AD] text-sm">Info</span>
                                </button>
                                <button onClick={() => {}} className="bg-[#6B15AD]/10 hover:bg-[#6B15AD]/20 transition rounded-2xl p-4 flex flex-col items-center justify-center text-center aspect-[4/3]">
                                    <FiAlertCircle className="text-3xl text-[#6B15AD] mb-2" />
                                    <span className="font-bold text-[#6B15AD] text-sm">Alerts</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Mini View */}
                        <div className="bg-[#6B15AD]/[0.05] rounded-2xl p-6 border border-[#6B15AD]/10">
                            <h3 className="text-xl font-bold text-[#6B15AD] mb-4">Overview</h3>
                            
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Latest Payroll</p>
                                {isLoadingPayroll ? (
                                    <p className="text-gray-500 text-sm">Loading...</p>
                                ) : payrolls.length > 0 ? (
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-gray-800">{getMonthName(payrolls[0].month)} {payrolls[0].year}</p>
                                            <p className="text-xs font-semibold text-green-600 uppercase mt-1 px-2 py-0.5 bg-green-50 rounded inline-block">{payrolls[0].status}</p>
                                        </div>
                                        <p className="text-xl font-black text-[#6B15AD]">{formatCurrency(payrolls[0].netSalary)}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No payroll available</p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mt-3">
                                <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Recent Leaves</p>
                                {leaveRequests.length > 0 ? (
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-gray-800 capitalize">{leaveRequests[0].type} Leave</p>
                                            <p className={`text-xs font-semibold uppercase mt-1 px-2 py-0.5 rounded inline-block ${leaveRequests[0].status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {leaveRequests[0].status}
                                            </p>
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">{new Date(leaveRequests[0].from).toLocaleDateString()}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No recent requests</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Modal functionality remains */}
            {showPayrollModal && selectedPayroll && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setShowPayrollModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                            <FiX />
                        </button>
                        <div className="text-center mb-6 pt-4">
                            <div className="w-16 h-16 bg-[#6B15AD]/10 text-[#6B15AD] rounded-full mx-auto flex items-center justify-center mb-3">
                                <FiDollarSign className="text-3xl" />
                            </div>
                            <h3 className="text-2xl font-black text-[#6B15AD]">Payslip</h3>
                            <p className="text-gray-500 font-medium">{getMonthName(selectedPayroll.month)} {selectedPayroll.year}</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 font-medium">Basic Salary</span>
                                <span className="font-bold text-gray-800">{formatCurrency(selectedPayroll.basicSalary)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 font-medium">Gross Pay</span>
                                <span className="font-bold text-gray-800">{formatCurrency(selectedPayroll.grossSalary)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                                <span className="text-red-600 font-medium">Total Deductions</span>
                                <span className="font-bold text-red-700">{formatCurrency(selectedPayroll.totalDeductions)}</span>
                            </div>
                        </div>

                        <div className="bg-[#6B15AD] text-white p-5 rounded-2xl flex justify-between items-center shadow-lg">
                            <span className="font-bold uppercase tracking-wider text-sm opacity-90">Net Payable</span>
                            <span className="text-3xl font-black">{formatCurrency(selectedPayroll.netSalary)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

export default EmployeeDashboard;
