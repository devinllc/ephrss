import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiPlus, FiUser, FiCalendar, FiStar, FiMessageSquare, FiTrendingDown, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse, fetchEmployees } from '../utils/api';
import PerformanceChart from '../components/PerformanceChart';
import { motion, AnimatePresence } from 'framer-motion';

const PerformanceReviews = () => {
    const [employees, setEmployees] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [newReview, setNewReview] = useState({
        reviewPeriod: '2026-Q1',
        rating: 80,
        feedback: '',
        goalsAchieved: true,
        areasOfImprovement: '',
        technicalRating: 80,
        behavioralRating: 80,
        punctualityRating: 80
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const empRes = await fetchEmployees();
            if (empRes.success) {
                setEmployees(empRes.data);
                if (empRes.data.length > 0) {
                    setSelectedEmployee(empRes.data[0]._id);
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load employee list.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeePerformance = async (empId) => {
        if (!empId) return;
        try {
            const res = await authenticatedFetch(`/performance/${empId}`);
            const data = await parseJsonResponse(res);
            setReviews(data?.data || []);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            // setError('Failed to load employee performance history.');
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            fetchEmployeePerformance(selectedEmployee);
        }
    }, [selectedEmployee]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        
        try {
            setError('');
            setSuccess('');
            const res = await authenticatedFetch('/performance', {
                method: 'POST',
                body: JSON.stringify({
                    ...newReview,
                    employeeId: selectedEmployee
                })
            });
            
            if (res.ok) {
                setSuccess('Performance review created successfully!');
                setShowCreateModal(false);
                fetchEmployeePerformance(selectedEmployee);
            } else {
                throw new Error('Failed to create performance review.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const currentEmployee = employees.find(e => e._id === selectedEmployee);

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <FiTrendingUp className="text-indigo-600" />
                            Performance Management
                        </h1>
                        <p className="text-slate-500 mt-1">Manage reviews, set goals, and monitor employee growth.</p>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md font-medium flex items-center gap-2"
                    >
                        <FiPlus /> New Review
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Employee Selector & Summary Stats */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-semibold text-slate-800 mb-4 block">Select Employee</h3>
                            <select 
                                value={selectedEmployee} 
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className="w-full border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                                ))}
                            </select>

                            {currentEmployee && (
                                <div className="mt-6 p-4 bg-indigo-50 rounded-xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl uppercase">
                                            {currentEmployee.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{currentEmployee.name}</h4>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{currentEmployee.department}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-indigo-100 flex justify-between text-xs">
                                        <span className="text-indigo-600 font-medium">Avg Rating</span>
                                        <span className="font-bold text-indigo-800 text-lg">84%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Alerts relating to Performance */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <FiInfo className="text-indigo-500" />
                                Growth Insights
                            </h3>
                            <div className="space-y-3">
                               <div className="p-3 bg-green-50 rounded-lg flex items-start gap-3">
                                   <FiTrendingUp className="text-green-600 mt-1" />
                                   <p className="text-xs text-green-800 leading-relaxed">
                                       Highly consistent in <b>Technical Tasks</b> during last quarter.
                                   </p>
                               </div>
                               <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-3">
                                   <FiTrendingDown className="text-amber-600 mt-1" />
                                   <p className="text-xs text-amber-800 leading-relaxed">
                                       Slight decline in <b>Punctuality</b> recorded this month.
                                   </p>
                               </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Trends & History */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Charts Area */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                             <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                <FiStar className="text-indigo-500" />
                                Performance Matrix - {new Date().getFullYear()}
                             </h3>
                             <PerformanceChart data={[
                                 { label: 'Technical', value: 85, color: 'bg-indigo-500' },
                                 { label: 'Behaivor', value: 92, color: 'bg-blue-500' },
                                 { label: 'Punctuality', value: 78, color: 'bg-indigo-400' },
                                 { label: 'Goals', value: 88, color: 'bg-indigo-600' }
                             ]} />
                        </div>

                        {/* History Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800">Review History</h3>
                            </div>
                            <div className="p-0">
                                {reviews.length > 0 ? (
                                    <ul className="divide-y divide-slate-100">
                                        {reviews.map((rv, i) => (
                                            <li key={i} className="p-6 hover:bg-slate-50 transition">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FiCalendar /></span>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{rv.reviewPeriod}</h4>
                                                            <p className="text-xs text-slate-400">Reviewed on {new Date(rv.createdAt || Date.now()).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-indigo-600">{rv.rating}%</span>
                                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total Rating</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mt-4 bg-slate-50 p-4 rounded-xl">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Feedback</label>
                                                        <p>{rv.feedback || "Good progress made this quarter."}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Improvements</label>
                                                        <p>{rv.areasOfImprovement || "Focus on documentation."}</p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-12 text-center text-slate-400 italic">No stored reviews found for this employee.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setShowCreateModal(false)}
                            />
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-slate-900">Create Review</h2>
                                        <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
                                    </div>

                                    {/* Modal Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Review Period</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={newReview.reviewPeriod} 
                                                onChange={(e) => setNewReview({...newReview, reviewPeriod: e.target.value})}
                                                className="w-full border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="e.g. 2026-Q1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Overall Rating ({newReview.rating}%)</label>
                                            <input 
                                                type="range" 
                                                min="0" max="100"
                                                value={newReview.rating} 
                                                onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">General Feedback</label>
                                        <textarea 
                                            rows="3"
                                            value={newReview.feedback} 
                                            onChange={(e) => setNewReview({...newReview, feedback: e.target.value})}
                                            className="w-full border-slate-200 rounded-xl focus:ring-indigo-500"
                                            placeholder="Highlight achievements..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         {[
                                             { label: 'Technical', key: 'technicalRating' },
                                             { label: 'Behavioral', key: 'behavioralRating' },
                                             { label: 'Punctuality', key: 'punctualityRating' }
                                         ].map(field => (
                                             <div key={field.key} className="space-y-2">
                                                 <label className="text-xs font-bold text-slate-500 uppercase">{field.label}</label>
                                                 <input 
                                                     type="number" min="0" max="100"
                                                     value={newReview[field.key]} 
                                                     onChange={(e) => setNewReview({...newReview, [field.key]: parseInt(e.target.value)})}
                                                     className="w-full border-slate-200 rounded-lg text-sm"
                                                 />
                                             </div>
                                         ))}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
                                        >
                                            Post Review
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PerformanceReviews;
