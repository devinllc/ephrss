import Cookies from 'js-cookie';

// Define a base URL that uses the actual backend URL in both development and production
const API_BASE_URL = 'https://ephrssbackend.vercel.app';

/**
 * Parse JSON response with enhanced error handling
 */
export async function parseJsonResponse(response) {
    const contentType = response.headers.get('content-type');
    console.log('Response content type:', contentType);

    if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON responses
        console.warn('Non-JSON response received:', contentType);
        const text = await response.text();
        console.log('Response text:', text);

        // Try to parse in case content type header is wrong but content is actually JSON
        try {
            return JSON.parse(text);
        } catch (e) {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${text}`);
            }
            return { message: text };
        }
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    return data;
}

/**
 * Ensures token is properly set in cookies before making request
 * This is critical because the backend middleware expects token in req.cookies.token
 */
function ensureTokenInCookies() {
    const token = Cookies.get('token');
    if (!token) return null;

    // Ensure token is set as a standard cookie with appropriate attributes for CORS
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=None; ${window.location.protocol === 'https:' ? 'Secure' : ''}`;

    return token;
}

/**
 * Authenticated fetch that handles token inclusion with fallback mechanisms
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token') || Cookies.get('token');
    
    // Default headers for all requests
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
        ...options.headers
    };

    // Add token to headers if it exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Construct the full URL
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    // Add token as query parameter for specific endpoints
    const tokenEndpoints = ['/task/', '/attendence/', '/employees/'];
    const shouldAddTokenToQuery = tokenEndpoints.some(ep => endpoint.startsWith(ep));
    
    const finalUrl = shouldAddTokenToQuery && token 
        ? `${url}${url.includes('?') ? '&' : '?'}token=${token}`
        : url;

    try {
        console.log(`Fetching from ${finalUrl} with options:`, { credentials: 'include', headers });
        
        const response = await fetch(finalUrl, {
            ...options,
            headers,
            credentials: 'include',
            mode: 'cors'
        });

        // Handle CORS preflight
        if (response.status === 204) {
            return { success: true };
        }

        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            return response;
        }

        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

/**
 * Authenticated fetch that sends token in the request body
 * Useful for servers that require token in the body instead of headers
 */
export async function authenticatedPostWithTokenInBody(endpoint, data = {}, options = {}) {
    // Ensure token is properly set in cookies
    const token = Cookies.get('token') || localStorage.getItem('authToken');
    console.log('Using token in request body:', token ? 'Token found' : 'No token');

    if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required. Please log in again.');
    }

    // Set up default options with token in body instead of header
    const defaultOptions = {
        method: 'POST',
        credentials: 'include',  // Important: this sends cookies with the request
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            token: token
        })
    };

    // Merge options with defaults
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        },
        // Make sure we merge the body properly if it exists in options
        body: options.body ?
            JSON.stringify({
                ...data,
                token,
                ...(typeof options.body === 'string' ? JSON.parse(options.body) : {})
            }) :
            defaultOptions.body
    };

    // Ensure URL is properly formed
    const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    console.log(`Fetching from ${url} with token in body:`, mergedOptions);

    try {
        const response = await fetch(url, mergedOptions);

        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
            console.error('Authentication failed (401)');
            // Could clear tokens here if needed
            Cookies.remove('token');
            Cookies.remove('user');
            throw new Error('Your session has expired. Please log in again.');
        }

        return response;

    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

/**
 * Function to reset an employee's device ID
 */
export async function resetEmployeeDevice(employeeId) {
    if (!employeeId) {
        throw new Error('Employee ID is required to reset device');
    }

    console.log(`Resetting device for employee: ${employeeId}`);

    try {
        // Updated to use the correct endpoint from the API documentation
        const response = await authenticatedFetch(`/admin/${employeeId}/reset-device`, {
            method: 'PATCH',
        });

        return await parseJsonResponse(response);
    } catch (error) {
        console.error('Error resetting employee device:', error);
        throw error;
    }
}

/**
 * Specific function for employee login that uses token in body if available
 * This can be used as a direct replacement for the fetch in LoginTest component
 */
export async function loginEmployee(email, password, deviceId) {
    console.log('Attempting employee login with:', { email, password, deviceId });

    const url = `${API_BASE_URL}/employees/login`;

    try {
        // Prepare login data
        const loginData = {
            email,
            password,
            deviceId
        };

        // Check if we already have a token (for re-login scenarios)
        const token = Cookies.get('token');
        if (token) {
            console.log('Found existing token, including in login request body');
            loginData.token = token;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify(loginData),
            mode: 'cors',
            credentials: 'include'
        });

        // Log response info for debugging
        console.log('Login response status:', response.status);

        const data = await parseJsonResponse(response);
        console.log('Login response data:', data);

        // Store token if available in the response
        if (data.token) {
            // Set token in Cookie with appropriate attributes
            Cookies.set('token', data.token, { 
                expires: 7,
                path: '/',
                sameSite: 'none',
                secure: window.location.protocol === 'https:'
            });
            localStorage.setItem('authToken', data.token);

            // For CORS requests that need the token in document.cookie
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=None; ${window.location.protocol === 'https:' ? 'Secure' : ''}`;

            // Store user role and data
            Cookies.set('userRole', 'employee', { 
                expires: 7,
                path: '/',
                sameSite: 'none',
                secure: window.location.protocol === 'https:'
            });
            const userData = data.employee || {};
            localStorage.setItem('userData', JSON.stringify(userData));
            Cookies.set('userData', JSON.stringify(userData), { 
                expires: 7,
                path: '/',
                sameSite: 'none',
                secure: window.location.protocol === 'https:'
            });
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Specific function for admin login that uses token in body if available
 */
export async function loginAdmin(email, password) {
    console.log('Attempting admin login with:', { email, password });

    const url = `${API_BASE_URL}/admin/login`;

    try {
        // Prepare login data
        const loginData = {
            email,
            password
        };

        // Check if we already have a token (for re-login scenarios)
        const token = Cookies.get('token');
        if (token) {
            console.log('Found existing token, including in login request body');
            loginData.token = token;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
            credentials: 'include'
        });

        // Log response info for debugging
        console.log('Login response status:', response.status);

        const data = await parseJsonResponse(response);
        console.log('Login response data:', data);

        // Store token if available in the response
        if (data.token) {
            // Set token in Cookie with appropriate attributes
            Cookies.set('token', data.token, { expires: 7 });
            localStorage.setItem('authToken', data.token);

            // For CORS requests that need the token in document.cookie
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=None; ${window.location.protocol === 'https:' ? 'Secure' : ''}`;

            // Store user role and data
            Cookies.set('userRole', 'admin', { expires: 7 });
            const userData = data.admin || {};
            localStorage.setItem('userData', JSON.stringify(userData));
            Cookies.set('userData', JSON.stringify(userData), { expires: 7 });
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Specialized function to fetch attendance status using multiple authentication methods
 * This combines all the tested auth methods to maximize chances of success
 */
export async function getAttendanceStatus() {
    console.log('Fetching attendance status');

    // Use the basic authenticatedFetch function which ensures cookies are sent
    try {
        const response = await authenticatedFetch('/attendence/status');
        return await parseJsonResponse(response);
    } catch (error) {
        console.error('Error fetching attendance status:', error);
        throw error;
    }
}

/**
 * Function that specifically uses the token-in-body approach for attendance status
 * This can be helpful when other authentication methods fail
 */
export async function getAttendanceStatusWithTokenInBody() {
    console.log('Fetching attendance status with token in request body');

    try {
        const response = await authenticatedPostWithTokenInBody('/attendence/status', {
            timestamp: new Date().toISOString() // Add timestamp to prevent caching
        });
        return await parseJsonResponse(response);
    } catch (error) {
        console.error('Error fetching attendance status with token in body:', error);
        throw error;
    }
}

// Update fetchEmployees to use the correct endpoint
export const fetchEmployees = async () => {
    try {
        // Changed from /employee/list to /employees
        const response = await authenticatedFetch('/employees', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Handle non-200 responses
        if (!response.ok) {
            throw new Error(`Failed to fetch employees: ${response.status}`);
        }

        const data = await parseJsonResponse(response);
        
        if (data.success) {
            return { success: true, data: data.data || data.employees || [] };
        } else {
            throw new Error(data.message || 'Failed to fetch employees');
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
    }
};

// Add a new function for creating tasks
export const createTask = async (taskData) => {
    try {
        const response = await authenticatedFetch('/task', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error(`Failed to create task: ${response.status}`);
        }

        const data = await parseJsonResponse(response);
        return data;
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
}; 