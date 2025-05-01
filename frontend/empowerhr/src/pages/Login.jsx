import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('employee');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Prepare login data based on role
            const loginData = {
                email,
                password
            };

            // Add deviceId for employee login
            if (role === 'employee') {
                // Try to get saved deviceId first, or create a new one
                const savedDeviceId = localStorage.getItem('deviceId');
                const deviceId = savedDeviceId || navigator.userAgent;

                loginData.deviceId = deviceId;

                // Store deviceId in localStorage to persist it
                if (!savedDeviceId) {
                    localStorage.setItem('deviceId', deviceId);
                    console.log('Storing new device ID in localStorage:', deviceId);
                } else {
                    console.log('Using existing device ID:', savedDeviceId);
                }
            }

            // Check if we already have a token (for re-login scenarios) 
            // and include it in the request
            const existingToken = Cookies.get('token');
            if (existingToken) {
                console.log('Found existing token, including in login request');
                loginData.token = existingToken;
            }

            console.log(`Attempting ${role} login with:`, loginData);

            // Determine the correct API endpoint based on role
            const endpoint = role === 'admin'
                ? 'https://ephrssbackend.vercel.app/admin/login'
                : 'https://ephrssbackend.vercel.app/employees/login';

            // Call API for login
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
                credentials: 'include' // Important: include cookies in request
            });

            // Log raw response for debugging
            console.log('Login response status:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Login response content type:', contentType);

            const responseText = await response.text();
            console.log('Raw login response text:', responseText);

            let responseData;
            try {
                // Parse response if it's valid JSON
                if (responseText && contentType && contentType.includes('application/json')) {
                    responseData = JSON.parse(responseText);
                    console.log('Parsed login response:', responseData);
                } else {
                    console.warn('Empty or non-JSON response from login API');
                    throw new Error('Invalid response format from server');
                }
            } catch (parseError) {
                console.error('Error parsing login response:', parseError);
                throw new Error('Invalid response format from server');
            }

            if (response.ok) {
                // Check if response contains a token
                const token = responseData.token || responseData.data?.token;

                if (!token) {
                    console.warn('No token in login response', responseData);
                    throw new Error('No authentication token received');
                }

                console.log('Received token:', token.substring(0, 15) + '...');

                // Store token in multiple ways to ensure it's available
                // 1. Using js-cookie (primary method)
                Cookies.set('token', token, {
                    expires: 7,
                    path: '/',
                    sameSite: 'Lax'
                });

                // 2. Using document.cookie (for cross-origin requests)
                // Use SameSite=None only for HTTPS connections, and with Secure flag
                const sameSiteAttr = window.location.protocol === 'https:' ? 'SameSite=None; Secure' : 'SameSite=Lax';
                document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; ${sameSiteAttr}`;
                console.log('Set token in document.cookie');

                // 3. Also store in localStorage as backup
                localStorage.setItem('authToken', token);

                // Store user role
                Cookies.set('userRole', role, { expires: 7, path: '/' });

                // Create user data object to store in cookie
                let userData = { email };

                if (role === 'admin') {
                    // For admin, store any additional data from response
                    userData = {
                        ...userData,
                        ...responseData.admin,
                        ...responseData.data,
                    };
                } else {
                    // For employee, store any additional data from response
                    userData = {
                        ...userData,
                        ...responseData.employee,
                        ...responseData.data,
                    };
                }

                console.log('Storing user data in cookies:', userData);

                // Store userData as JSON string in cookie
                Cookies.set('userData', JSON.stringify(userData), { expires: 7, path: '/' });

                // Also store in localStorage for components that look there
                localStorage.setItem('userData', JSON.stringify(userData));

                // Verify cookies were set correctly
                console.log('Cookies after login:', document.cookie);

                // Navigate to the appropriate dashboard
                navigate(role === 'admin' ? '/admin-dashboard' : '/employee-dashboard');
            } else {
                // Handle error response
                const errorMessage = responseData.message || 'Login failed. Please check your credentials.';
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-lightest px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-dark">
                        EmpowerHR
                    </h2>
                    <p className="mt-2 text-sm text-gray">
                        Sign in to your account
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-xl shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-dark mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-light placeholder-gray rounded-xl focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-dark mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-light placeholder-gray rounded-xl focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="userType" className="block text-sm font-medium text-gray-dark mb-2">
                                Login As
                            </label>
                            <select
                                id="userType"
                                name="userType"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-light rounded-xl focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                            >
                                <option value="admin">Admin</option>
                                <option value="employee">Employee</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`login-button group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-medium rounded-xl text-white shadow-lg hover-lift
                                ${loading ? 'bg-primary opacity-70 cursor-not-allowed' : 'bg-gradient-primary hover:bg-gradient-accent'}
                                transition`}
                        >
                            <span className="login-icon absolute left-0 inset-y-0 flex items-center justify-center pl-3 w-10">
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </span>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm">
                        Not registered?{' '}
                        <a href="/admin-signup" className="font-medium text-primary hover:text-accent">
                            Create an admin account
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login; 