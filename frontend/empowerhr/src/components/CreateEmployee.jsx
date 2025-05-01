import { useState } from 'react';
import Cookies from 'js-cookie';

const CreateEmployee = ({ onClose, onEmployeeCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'employee',
        dob: '',
        gender: 'male',
        department: '',
        employmentType: 'full-time',
        address: '',
        emergencyContact: '',
        salary: '',
        bankDetails: {
            accountNumber: '',
            ifsc: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Get token from multiple possible sources
            const token = Cookies.get('token') || localStorage.getItem('authToken');

            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }

            // Set token cookie just in case it's missing
            Cookies.set('token', token, { expires: 1 });

            // Log the data for debugging
            console.log('Creating employee with data:', formData);
            console.log('Using token:', token.substring(0, 15) + '...');

            // Use the proxy URL instead of direct backend URL to avoid CORS issues
            const response = await fetch('/api/employees/create', {
                method: 'POST',
                credentials: 'include', // Include cookies in the request
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    token: token // Include token in body as well for extra security
                })
            });

            // Log the response for debugging
            console.log('Employee creation response status:', response.status);

            const contentType = response.headers.get('content-type');
            console.log('Response content type:', contentType);

            if (contentType && contentType.includes('application/json')) {
                const responseText = await response.text();
                console.log('Raw response text:', responseText);

                if (responseText) {
                    const data = JSON.parse(responseText);
                    console.log('Employee creation parsed response:', data);

                    if (!response.ok) {
                        // Handle specific error cases with user-friendly messages
                        if (response.status === 401) {
                            throw new Error('Your session has expired. Please log in again.');
                        } else if (data.message) {
                            throw new Error(data.message);
                        } else {
                            throw new Error(data.error || 'Failed to create employee');
                        }
                    }

                    setSuccess(true);

                    // Extract employee data from response
                    const newEmployeeData = data.employee || data.data || {
                        _id: Date.now().toString(), // Temporary ID if not provided
                        ...formData,
                        status: 'active',
                        deviceId: null,
                        createdAt: new Date().toISOString()
                    };

                    // If employee was created successfully, pass the new employee data back
                    if (onEmployeeCreated) {
                        onEmployeeCreated(newEmployeeData);
                    }

                    // Auto-close after successful creation
                    setTimeout(() => {
                        onClose && onClose();
                    }, 2000);
                } else {
                    throw new Error('Empty response from server');
                }
            } else {
                // Handle non-JSON response
                const text = await response.text();
                console.log('Non-JSON response:', text);

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Your session has expired. Please log in again.');
                    } else {
                        throw new Error('Failed to create employee - Server returned non-JSON response');
                    }
                }

                // If response is ok but not JSON, create a default employee object
                const newEmployeeData = {
                    _id: Date.now().toString(), // Temporary ID
                    ...formData,
                    status: 'active',
                    deviceId: null,
                    createdAt: new Date().toISOString()
                };

                // If employee was created successfully, pass the new employee data back
                if (onEmployeeCreated) {
                    onEmployeeCreated(newEmployeeData);
                }
            }
        } catch (err) {
            console.error('Error creating employee:', err);

            // Check if we need to redirect to login
            if (err.message.includes('log in') || err.message.includes('session')) {
                setError('Authentication required. Redirecting to login page...');

                // Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                setError(err.message || 'Failed to create employee');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-sm">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{error}</p>
                            {error.includes('log in') && (
                                <p className="mt-1 text-xs text-red-600">Redirecting to login page...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">Employee created successfully!</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="name">
                        Full Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="phone">
                        Phone
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        type="text"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="dob">
                        Date of Birth
                    </label>
                    <input
                        id="dob"
                        name="dob"
                        type="date"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.dob}
                        onChange={handleChange}
                        required
                        placeholder="dd/mm/yyyy"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="gender">
                        Gender
                    </label>
                    <select
                        id="gender"
                        name="gender"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="department">
                        Department
                    </label>
                    <input
                        id="department"
                        name="department"
                        type="text"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.department}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="employmentType">
                        Employment Type
                    </label>
                    <select
                        id="employmentType"
                        name="employmentType"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.employmentType}
                        onChange={handleChange}
                        required
                    >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                        <option value="field">Field Employee</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="address">
                        Address
                    </label>
                    <textarea
                        id="address"
                        name="address"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                    ></textarea>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="emergencyContact">
                        Emergency Contact
                    </label>
                    <input
                        id="emergencyContact"
                        name="emergencyContact"
                        type="text"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-dark text-sm font-semibold mb-2" htmlFor="salary">
                        Salary
                    </label>
                    <input
                        id="salary"
                        name="salary"
                        type="number"
                        className="appearance-none w-full px-4 py-3 border border-gray-light rounded-lg text-gray-dark text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.salary}
                        onChange={handleChange}
                    />
                </div>

                <div className="mt-6 flex items-center space-x-4 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-outline px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center px-5 py-2.5 rounded-lg font-medium text-white shadow-md ${loading ? 'bg-gray-400' : 'bg-gradient-primary hover:shadow-lg hover:-translate-y-0.5'
                            } transition`}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </div>
                        ) : (
                            <>
                                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                Create Employee
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEmployee; 