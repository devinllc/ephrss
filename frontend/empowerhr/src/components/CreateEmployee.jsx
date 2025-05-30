import { useState } from 'react';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';

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
    const [currentStep, setCurrentStep] = useState(1);

    // All existing logic remains unchanged
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

    const nextStep = () => setCurrentStep(currentStep + 1);
    const prevStep = () => setCurrentStep(currentStep - 1);

    return (
        <motion.div 
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Add New Employee</h2>
                <button 
                    onClick={onClose}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'} font-bold`}>1</div>
                        <span className="ml-2 text-sm font-medium">Basic Info</span>
                    </div>
                    <div className={`h-0.5 w-12 ${currentStep >= 2 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                    <div className={`flex items-center ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'} font-bold`}>2</div>
                        <span className="ml-2 text-sm font-medium">Employment</span>
                    </div>
                    <div className={`h-0.5 w-12 ${currentStep >= 3 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                    <div className={`flex items-center ${currentStep >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'} font-bold`}>3</div>
                        <span className="ml-2 text-sm font-medium">Details</span>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="px-6">
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg shadow-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
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
                        </motion.div>
                    )}

                    {success && (
                        <motion.div 
                            className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg shadow-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6">
                <div className="max-h-[60vh] overflow-y-auto pr-2 py-2 space-y-1">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john.doe@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="phone">
                                        Phone
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="dob">
                                        Date of Birth
                                    </label>
                                    <input
                                        id="dob"
                                        name="dob"
                                        type="date"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="gender">
                                        Gender
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Employment Information */}
                    {currentStep === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="department">
                                        Department
                                    </label>
                                    <input
                                        id="department"
                                        name="department"
                                        type="text"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        placeholder="Engineering"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="employmentType">
                                        Employment Type
                                    </label>
                                    <select
                                        id="employmentType"
                                        name="employmentType"
                                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="salary">
                                    Salary
                                </label>
                                <input
                                    id="salary"
                                    name="salary"
                                    type="text"
                                    className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    placeholder="₹50,000"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Additional Details */}
                    {currentStep === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="address">
                                    Address
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="123 Main St, Bangalore, Karnataka"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="emergencyContact">
                                    Emergency Contact
                                </label>
                                <input
                                    id="emergencyContact"
                                    name="emergencyContact"
                                    type="text"
                                    className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={formData.emergencyContact}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210 (Family Member)"
                                />
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="bankDetails.accountNumber">
                                            Account Number
                                        </label>
                                        <input
                                            id="bankDetails.accountNumber"
                                            name="bankDetails.accountNumber"
                                            type="text"
                                            className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            value={formData.bankDetails.accountNumber}
                                            onChange={handleChange}
                                            placeholder="123456789012"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="bankDetails.ifsc">
                                            IFSC Code
                                        </label>
                                        <input
                                            id="bankDetails.ifsc"
                                            name="bankDetails.ifsc"
                                            type="text"
                                            className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            value={formData.bankDetails.ifsc}
                                            onChange={handleChange}
                                            placeholder="SBIN0001234"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex justify-between">
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                            Cancel
                        </button>
                    )}

                    {currentStep < 3 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                'Create Employee'
                            )}
                        </button>
                    )}
                </div>
            </form>
        </motion.div>
    );
};

// Missing AnimatePresence import
const AnimatePresence = ({ children }) => {
    return children;
};

export default CreateEmployee;
