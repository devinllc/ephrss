import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import { FiUser, FiMail, FiLock, FiUserCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';

const registerImg = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80";

const panelVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 50 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authenticatedFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        navigate('/');
      } else {
        setError(response.message || 'Signup failed');
      }
    } catch (err) {
      setError('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 relative items-center justify-center bg-blue-900 overflow-hidden">
        <img
          src={registerImg}
          alt="Register Visual"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 p-12 flex flex-col items-start justify-center h-full w-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white text-3xl font-bold tracking-wider">EmpowerHR</span>
          </div>
          <div className="text-white text-2xl font-bold mb-2">
            HR Management Platform
          </div>
          <div className="h-1 w-10 bg-white rounded mb-2"></div>
          <div className="text-white text-base mb-6">
            Manage all employees, payrolls, and other human resource operations.
          </div>
          <div className="flex gap-4">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-6 py-2 rounded shadow transition">Learn More</button>
            <button className="bg-red bg-opacity-20 hover:bg-opacity-40 border border-white text-white font-semibold px-6 py-2 rounded shadow transition">Our Features</button>
          </div>
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <motion.div
          key="signup"
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-md px-8 py-12 bg-white rounded-2xl shadow-xl space-y-8"
        >
          <div>
            <h2 className="text-center text-3xl font-bold text-blue-900 mb-1">Welcome to EmpowerHR</h2>
            <p className="text-center text-gray-500 mb-8">Register your account</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <FiUserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md shadow transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </button>
            <div className="text-center text-sm text-gray-700 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-700 font-semibold hover:underline">
                Sign in here.
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
