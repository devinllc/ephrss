// ad@ts3.c

import { useState, useEffect } from 'react';
import { authenticatedFetch, parseJsonResponse, authenticatedPostWithTokenInBody, loginEmployee, loginAdmin } from '../utils/api';
import Cookies from 'js-cookie';
import axios from 'axios';

const LoginTest = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [testData, setTestData] = useState(null);
    const [directResponse, setDirectResponse] = useState(null);
    const [loginFormData, setLoginFormData] = useState({
        email: "ad@ts3.c",
        password: "password123",
        deviceId: localStorage.getItem('deviceId') || `DEV-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`
    });
    const [loginType, setLoginType] = useState('employee');
    const [loading7, setLoading7] = useState(false);
    const [results7, setResults7] = useState({});
    const [loading8, setLoading8] = useState(false);
    const [results8, setResults8] = useState({});
    const [loading9, setLoading9] = useState(false);
    const [results9, setResults9] = useState({});
    const [loading10, setLoading10] = useState(false);
    const [results10, setResults10] = useState({});
    const [loading11, setLoading11] = useState(false);
    const [results11, setResults11] = useState({});
    const [loading12, setLoading12] = useState(false);
    const [results12, setResults12] = useState({});

    // Test login functionality
    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Store deviceId for future logins
            if (loginType === 'employee') {
                localStorage.setItem('deviceId', loginFormData.deviceId);
            }

            // Determine endpoint based on login type
            const endpoint = loginType === 'admin'
                ? '/api/admin/login'
                : '/api/employees/login';

            console.log(`Attempting ${loginType} login to ${endpoint} with:`, loginFormData);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginFormData),
                credentials: 'include'
            });

            // Log response headers for debugging
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

            const data = await response.json();
            console.log('Login response data:', data);

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Login failed');
            }

            setUser(data.admin || data.employee || data);

            // Store token in multiple places for testing
            if (data.token) {
                // Set in cookie with correct name 'token'
                Cookies.set('token', data.token, { expires: 1 });

                // Also store in localStorage
                localStorage.setItem('authToken', data.token);

                // Store user role
                Cookies.set('userRole', loginType);

                // Store user data
                const userData = data.admin || data.employee || {};
                localStorage.setItem('userData', JSON.stringify(userData));
                Cookies.set('userData', JSON.stringify(userData));
            }

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    // Test authenticated API call
    const fetchTestData = async () => {
        setIsLoading(true);
        setError(null);
        setTestData(null);

        try {
            // Make authenticated request to get employees data
            const response = await authenticatedFetch('/employees/all');
            const data = await parseJsonResponse(response);

            setTestData(data);
            console.log('API response:', data);
        } catch (err) {
            console.error('API call error:', err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    // Direct API call test (without authentication)
    const testDirectApiCall = async () => {
        setIsLoading(true);
        setError(null);
        setDirectResponse(null);

        try {
            // Make a direct call to the backend endpoint
            const response = await fetch('/api/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            // Try to parse the response
            let data;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            setDirectResponse({
                status: response.status,
                statusText: response.statusText,
                data: data,
                headers: Object.fromEntries([...response.headers.entries()])
            });

            console.log('Direct API response:', data);
        } catch (err) {
            console.error('Direct API call error:', err);
            setError(err.message || 'Failed to make direct API call');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle updating login form fields
    const handleInputChange = (e) => {
        setLoginFormData({
            ...loginFormData,
            [e.target.name]: e.target.value
        });
    };

    // Test cookie format and debug
    const testCookieFormat = () => {
        // Show all available authentication information
        const cookieToken = Cookies.get('token');
        const authToken = localStorage.getItem('authToken');

        setTestData({
            cookies: {
                token: cookieToken,
                userRole: Cookies.get('userRole'),
                userData: Cookies.get('userData'),
            },
            localStorage: {
                authToken: authToken,
                deviceId: localStorage.getItem('deviceId'),
                userData: localStorage.getItem('userData'),
            },
            document_cookies: document.cookie,
            tokenComparison: cookieToken === authToken ? 'Tokens Match' : 'Tokens Different'
        });
    };

    // Log current auth state
    useEffect(() => {
        const token = Cookies.get('token');
        console.log('Current auth token:', token ? 'Token exists' : 'No token');
    }, []);

    // Add this function near the top of the component
    const testAttendanceEndpoint = async () => {
        setIsLoading(true);
        setError(null);
        setTestData(null);

        const token = Cookies.get('token');
        if (!token) {
            setError("No token found in cookies. Please login first.");
            setIsLoading(false);
            return;
        }

        // Store test results
        const results = {
            methods: {}
        };

        // Method 1: Basic fetch with credentials
        try {
            const response1 = await fetch('https://ephrssbackend.vercel.app/attendence/status', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            results.methods.fetch1 = {
                status: response1.status,
                statusText: response1.statusText,
                data: response1.ok ? await response1.json() : await response1.text()
            };
        } catch (err) {
            results.methods.fetch1 = { error: err.message };
        }

        // Method 2: Axios with withCredentials
        try {
            const response2 = await axios({
                method: 'get',
                url: 'https://ephrssbackend.vercel.app/attendence/status',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            results.methods.axios1 = {
                status: response2.status,
                statusText: response2.statusText,
                data: response2.data
            };
        } catch (err) {
            results.methods.axios1 = {
                error: err.message,
                status: err.response?.status,
                data: err.response?.data
            };
        }

        // Method 3: Fetch with token in URL
        try {
            const response3 = await fetch(`https://ephrssbackend.vercel.app/attendence/status?token=${token}`, {
                method: 'GET',
                credentials: 'include'
            });

            results.methods.fetch2 = {
                status: response3.status,
                statusText: response3.statusText,
                data: response3.ok ? await response3.json() : await response3.text()
            };
        } catch (err) {
            results.methods.fetch2 = { error: err.message };
        }

        // Method 4: Axios with just header auth
        try {
            const response4 = await axios({
                method: 'get',
                url: 'https://ephrssbackend.vercel.app/attendence/status',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: false
            });
            results.methods.axios2 = {
                status: response4.status,
                statusText: response4.statusText,
                data: response4.data
            };
        } catch (err) {
            results.methods.axios2 = {
                error: err.message,
                status: err.response?.status,
                data: err.response?.data
            };
        }

        // Method 5: Try with X-Access-Token header (common alternative format)
        try {
            const response5 = await fetch('https://ephrssbackend.vercel.app/attendence/status', {
                method: 'GET',
                headers: {
                    'X-Access-Token': token
                },
                credentials: 'include'
            });

            results.methods.customHeader = {
                status: response5.status,
                statusText: response5.statusText,
                data: response5.ok ? await response5.json() : await response5.text()
            };
        } catch (err) {
            results.methods.customHeader = { error: err.message };
        }

        // Method 6: With token in URL path (some APIs use this format)
        try {
            const response6 = await fetch(`https://ephrssbackend.vercel.app/attendence/status/token/${token}`, {
                method: 'GET'
            });

            results.methods.tokenInPath = {
                status: response6.status,
                statusText: response6.statusText,
                data: response6.ok ? await response6.json() : await response6.text()
            };
        } catch (err) {
            results.methods.tokenInPath = { error: err.message };
        }

        // Method 7: Try with both token in Authorization header AND cookies
        try {
            const response7 = await fetch('https://ephrssbackend.vercel.app/attendence/status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            results.methods.headerAndCookies = {
                status: response7.status,
                statusText: response7.statusText,
                data: response7.ok ? await response7.json() : await response7.text()
            };
        } catch (err) {
            results.methods.headerAndCookies = { error: err.message };
        }

        // Add token and cookie info
        results.tokenInfo = {
            cookieToken: Cookies.get('token'),
            headerTokenLength: token ? token.length : 0,
            tokenFirstChars: token ? token.substring(0, 10) : 'none',
            tokenLastChars: token ? token.substring(token.length - 10) : 'none',
            documentCookies: document.cookie
        };

        setTestData(results);
        setIsLoading(false);
    };

    const method7Results = async () => {
        setLoading7(true);
        setResults7({});
        const results = {};

        try {
            const token = Cookies.get('token');

            const response = await fetch('http://localhost:5173/api/attendance/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': token,
                },
                credentials: 'include'
            });

            results.status = response.status;
            results.statusText = response.statusText;

            try {
                const data = await response.json();
                results.data = data;
            } catch (e) {
                results.parseError = e.message;
            }

        } catch (error) {
            results.error = error.message;
        } finally {
            // Add token and cookie info
            const token = Cookies.get('token');
            results.tokenInfo = {
                cookieToken: Cookies.get('token'),
                headerTokenLength: token ? token.length : 0,
                tokenFirstChars: token ? token.substring(0, 10) : 'none',
                tokenLastChars: token ? token.substring(token.length - 10) : 'none',
                documentCookies: document.cookie
            };

            setLoading7(false);
            setResults7(results);
        }
    };

    const method8Results = async () => {
        setLoading8(true);
        setResults8({});
        const results = {};

        try {
            const token = Cookies.get('token');

            // Direct call to backend without proxy
            const response = await fetch('https://ephrssbackend.vercel.app/attendance/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include'
            });

            results.status = response.status;
            results.statusText = response.statusText;

            try {
                const data = await response.json();
                results.data = data;
            } catch (e) {
                results.parseError = e.message;
            }

        } catch (error) {
            results.error = error.message;
        } finally {
            // Add token and cookie info
            const token = Cookies.get('token');
            results.tokenInfo = {
                cookieToken: Cookies.get('token'),
                headerTokenLength: token ? token.length : 0,
                tokenFirstChars: token ? token.substring(0, 10) : 'none',
                tokenLastChars: token ? token.substring(token.length - 10) : 'none',
                documentCookies: document.cookie
            };

            setLoading8(false);
            setResults8(results);
        }
    };

    const method9Results = async () => {
        setLoading9(true);
        setResults9({});
        const results = {};

        try {
            const token = Cookies.get('token');

            // Try with X-Token header
            const response = await fetch('/api/attendance/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': token, // Try X-Token header format
                },
                credentials: 'include'
            });

            results.status = response.status;
            results.statusText = response.statusText;

            try {
                const data = await response.json();
                results.data = data;
            } catch (e) {
                results.parseError = e.message;
            }

        } catch (error) {
            results.error = error.message;
        } finally {
            // Add token and cookie info
            const token = Cookies.get('token');
            results.tokenInfo = {
                cookieToken: Cookies.get('token'),
                headerTokenLength: token ? token.length : 0,
                tokenFirstChars: token ? token.substring(0, 10) : 'none',
                tokenLastChars: token ? token.substring(token.length - 10) : 'none',
                documentCookies: document.cookie
            };

            setLoading9(false);
            setResults9(results);
        }
    };

    const method10Results = async () => {
        setLoading10(true);
        setResults10({});
        const results = {};

        try {
            const token = Cookies.get('token');

            // Try with token in request body
            const response = await fetch('/api/attendance/status', {
                method: 'POST', // Changed to POST to send body
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
                credentials: 'include'
            });

            results.status = response.status;
            results.statusText = response.statusText;

            try {
                const data = await response.json();
                results.data = data;
            } catch (e) {
                results.parseError = e.message;
            }

        } catch (error) {
            results.error = error.message;
        } finally {
            // Add token and cookie info
            const token = Cookies.get('token');
            results.tokenInfo = {
                cookieToken: Cookies.get('token'),
                headerTokenLength: token ? token.length : 0,
                tokenFirstChars: token ? token.substring(0, 10) : 'none',
                tokenLastChars: token ? token.substring(token.length - 10) : 'none',
                documentCookies: document.cookie
            };

            setLoading10(false);
            setResults10(results);
        }
    };

    // Method 11: Using the new utility function
    const method11Results = async () => {
        setLoading11(true);
        setResults11({});
        const results = {};

        try {
            // Use the new utility function that puts token in the body
            const response = await authenticatedPostWithTokenInBody('/attendance/status', {
                // You can add any additional data here
                timestamp: new Date().toISOString()
            });

            results.status = response.status;
            results.statusText = response.statusText;

            try {
                const data = await parseJsonResponse(response);
                results.data = data;
            } catch (e) {
                results.parseError = e.message;
            }

        } catch (error) {
            results.error = error.message;
        } finally {
            // Add token and cookie info
            const token = Cookies.get('token');
            results.tokenInfo = {
                cookieToken: Cookies.get('token'),
                headerTokenLength: token ? token.length : 0,
                tokenFirstChars: token ? token.substring(0, 10) : 'none',
                tokenLastChars: token ? token.substring(token.length - 10) : 'none',
                documentCookies: document.cookie
            };

            setLoading11(false);
            setResults11(results);
        }
    };

    // Method 12: Using specialized login functions
    const handleApiLogin = async () => {
        setLoading12(true);
        setResults12({});
        const results = {};

        try {
            let data;

            if (loginType === 'employee') {
                // Use the employee login function
                data = await loginEmployee(
                    loginFormData.email,
                    loginFormData.password,
                    loginFormData.deviceId
                );
            } else {
                // Use the admin login function
                data = await loginAdmin(
                    loginFormData.email,
                    loginFormData.password
                );
            }

            results.data = data;
            results.success = true;

            // Update the user state with the login result
            setUser(data.admin || data.employee || data);

        } catch (error) {
            results.error = error.message;
            results.success = false;
        } finally {
            // Add token and cookie info
            const token = Cookies.get('token');
            results.tokenInfo = {
                cookieToken: Cookies.get('token'),
                headerTokenLength: token ? token.length : 0,
                tokenFirstChars: token ? token.substring(0, 10) : 'none',
                tokenLastChars: token ? token.substring(token.length - 10) : 'none',
                documentCookies: document.cookie
            };

            setLoading12(false);
            setResults12(results);
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">API Connection Test</h2>

            <div className="space-y-6">
                {/* Direct API Call Section */}
                <div className="border p-3 rounded">
                    <h3 className="font-medium mb-2">Step 0: Test Server Connection</h3>
                    <button
                        onClick={testDirectApiCall}
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
                    >
                        {isLoading ? 'Loading...' : 'Test Direct API Call'}
                    </button>

                    {directResponse && (
                        <div className="mt-2 p-2 bg-yellow-100 rounded">
                            <p className="font-medium">Direct API Response:</p>
                            <p>Status: {directResponse.status} {directResponse.statusText}</p>
                            <pre className="text-xs overflow-auto max-h-40 mt-1">
                                {typeof directResponse.data === 'object'
                                    ? JSON.stringify(directResponse.data, null, 2)
                                    : directResponse.data}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Login Section */}
                <div className="border p-3 rounded">
                    <h3 className="font-medium mb-2">Step 1: Test Login</h3>

                    <div className="mb-4">
                        <div className="flex mb-3">
                            <button
                                onClick={() => setLoginType('employee')}
                                className={`mr-2 px-3 py-1 rounded ${loginType === 'employee' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Employee Login
                            </button>
                            <button
                                onClick={() => setLoginType('admin')}
                                className={`px-3 py-1 rounded ${loginType === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Admin Login
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={loginFormData.email}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password:</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={loginFormData.password}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            {loginType === 'employee' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Device ID:</label>
                                    <input
                                        type="text"
                                        name="deviceId"
                                        value={loginFormData.deviceId}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                            {isLoading ? 'Loading...' : 'Original Login'}
                        </button>

                        <button
                            onClick={handleApiLogin}
                            disabled={loading12}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                        >
                            {loading12 ? 'Loading...' : 'New API Login'}
                        </button>
                    </div>

                    {user && (
                        <div className="mt-2 p-2 bg-green-100 rounded">
                            <p className="font-medium">Login successful:</p>
                            <pre className="text-xs overflow-auto max-h-40 mt-1">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                    )}

                    {Object.keys(results12).length > 0 && (
                        <div className="mt-2 p-2 bg-blue-100 rounded">
                            <h4 className="font-medium">API Login Results:</h4>
                            <pre className="text-xs overflow-auto max-h-40 mt-1">
                                {JSON.stringify(results12, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* API Test Section */}
                <div className="border p-3 rounded">
                    <h3 className="font-medium mb-2">Step 2: Test API Calls</h3>
                    <div className="flex space-x-2 mb-2">
                        <button
                            onClick={fetchTestData}
                            disabled={isLoading || !Cookies.get('token')}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                        >
                            {isLoading ? 'Loading...' : 'Test API Call'}
                        </button>

                        <button
                            onClick={testCookieFormat}
                            disabled={isLoading}
                            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:bg-gray-300"
                        >
                            Test Auth Format
                        </button>

                        <button
                            onClick={testAttendanceEndpoint}
                            disabled={isLoading || !Cookies.get('token')}
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
                        >
                            Test Attendance API
                        </button>
                    </div>

                    {!Cookies.get('token') && !user && (
                        <p className="text-sm text-red-500 mt-1">Login first to test API calls</p>
                    )}

                    {testData && (
                        <div className="mt-2 p-2 bg-blue-100 rounded">
                            <p className="font-medium">Response Data:</p>
                            <pre className="text-xs overflow-auto max-h-60 mt-1">
                                {JSON.stringify(testData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Method 7 Test */}
                <div className="mb-4 p-4 border rounded">
                    <h3 className="text-lg font-semibold mb-2">Method 7: Fetch with X-Token header</h3>
                    <button
                        onClick={method7Results}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        disabled={loading7}
                    >
                        {loading7 ? "Testing..." : "Test Method 7"}
                    </button>
                    {Object.keys(results7).length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium">Results:</h4>
                            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-64">
                                {JSON.stringify(results7, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Method 8 Test */}
                <div className="mb-4 p-4 border rounded">
                    <h3 className="text-lg font-semibold mb-2">Method 8: Direct Backend Call</h3>
                    <button
                        onClick={method8Results}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                        disabled={loading8}
                    >
                        {loading8 ? "Testing..." : "Test Method 8"}
                    </button>
                    {Object.keys(results8).length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium">Results:</h4>
                            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-64">
                                {JSON.stringify(results8, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Method 9 Test */}
                <div className="mb-4 p-4 border rounded">
                    <h3 className="text-lg font-semibold mb-2">Method 9: X-Token Header</h3>
                    <button
                        onClick={method9Results}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        disabled={loading9}
                    >
                        {loading9 ? "Testing..." : "Test Method 9"}
                    </button>
                    {Object.keys(results9).length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium">Results:</h4>
                            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-64">
                                {JSON.stringify(results9, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Method 10 Test */}
                <div className="mb-4 p-4 border rounded">
                    <h3 className="text-lg font-semibold mb-2">Method 10: Token in Request Body</h3>
                    <button
                        onClick={method10Results}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        disabled={loading10}
                    >
                        {loading10 ? "Testing..." : "Test Method 10"}
                    </button>
                    {Object.keys(results10).length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium">Results:</h4>
                            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-64">
                                {JSON.stringify(results10, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Method 11 Test */}
                <div className="mb-4 p-4 border rounded">
                    <h3 className="text-lg font-semibold mb-2">Method 11: Using Utility Function</h3>
                    <button
                        onClick={method11Results}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        disabled={loading11}
                    >
                        {loading11 ? "Testing..." : "Test Method 11"}
                    </button>
                    {Object.keys(results11).length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium">Results:</h4>
                            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-64">
                                {JSON.stringify(results11, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
                    Error: {error}
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                <p className="font-medium">Auth Status:</p>
                <p>Token cookie: {Cookies.get('token') ? 'Present' : 'Not found'}</p>
                <p>User role: {Cookies.get('userRole') || 'Not set'}</p>
                <p>Current cookies: {document.cookie || 'No cookies'}</p>
            </div>
        </div>
    );
};

export default LoginTest; 