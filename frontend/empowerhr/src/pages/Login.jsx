import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin, loginEmployee } from '../utils/api';
import { FiMail, FiLock, FiUserCheck } from 'react-icons/fi';
import loginImg from '../assets/login.png';
import { motion } from 'framer-motion';


const panelVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 50 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};

const Login = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let response;
      if (loginData.role === 'admin') {
        response = await loginAdmin(loginData.email, loginData.password);
      } else {
        const deviceId = localStorage.getItem('deviceId') || navigator.userAgent;
        response = await loginEmployee(loginData.email, loginData.password, deviceId);
        if (!localStorage.getItem('deviceId')) {
          localStorage.setItem('deviceId', deviceId);
        }
      }
      if (response.token) {
        localStorage.setItem('token', response.token);
        window.location.href = '/';
      } else {
        setError('Login failed: No token received');
      }
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 relative items-center justify-center bg-blue-900 overflow-hidden">
        <img
          src={loginImg}
          alt="Login Visual"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 p-12 flex flex-col items-start justify-center h-full w-full">
          <div className="text-white text-4xl font-bold mb-4 leading-snug">
            Manage all <span className="text-yellow-400">HR Operations</span>
            <br />
            from the comfort of your home.
          </div>
          <div className="flex mt-8 space-x-2">
            <span className="w-6 h-2 rounded-full bg-yellow-400"></span>
            <span className="w-6 h-2 rounded-full bg-white opacity-60"></span>
            <span className="w-6 h-2 rounded-full bg-white opacity-60"></span>
          </div>
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <motion.div
          key="login"
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-md px-8 py-12 bg-white rounded-2xl shadow-xl space-y-8"
        >
          <div>
            <h2 className="text-center text-3xl font-bold text-blue-900 mb-1">EmpowerHR</h2>
            <p className="text-center text-gray-500 mb-8">Welcome Back! Please Sign in to your account.</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={e => setLoginData({ ...loginData, email: e.target.value })}
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
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Login As</label>
                <div className="relative">
                  <FiUserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                    value={loginData.role}
                    onChange={e => setLoginData({ ...loginData, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-700">
                <input type="checkbox" className="mr-2 rounded border-gray-300" />
                Remember me
              </label>
              <Link to="/reset-password" className="text-sm text-blue-600 hover:underline font-medium">
                Reset Password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md shadow transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center text-sm text-gray-700 mt-4">
              Don’t have an account yet?{' '}
              <Link to="/signup" className="text-blue-700 font-semibold hover:underline">
                Create one Now.
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
