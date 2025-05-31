import { useState } from 'react';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';

const CreateEmployee = ({ onClose, onEmployeeCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'employee'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Logic same hai
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const token = Cookies.get('token') || localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required. Please log in again.');
            Cookies.set('token', token, { expires: 1 });

            const response = await fetch('/api/employees/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, token })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create employee');
            setSuccess(true);

            if (onEmployeeCreated) onEmployeeCreated(data.employee || { ...formData, _id: Date.now().toString() });

            setTimeout(() => { onClose && onClose(); }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to create employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-md"
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

            {/* Alerts */}
            <div className="px-6 pt-4">
                {error && (
                    <motion.div
                        className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-2 rounded"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 mb-2 rounded"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        Employee created successfully!
                    </motion.div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="name">
                        Full Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john.doe@example.com"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="phone">
                        Phone
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+91 98765 43210"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="role">
                        Role
                    </label>
                    <select
                        id="role"
                        name="role"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating...' : 'Create Employee'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default CreateEmployee;
