import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiChevronLeft, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';

const ApplyLeave = () => {
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        reason: '',
        type: 'casual' // Default leave type
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = Cookies.get('token');
        const role = Cookies.get('userRole');

        if (!token || role !== 'employee') {
            navigate('/login');
            return;
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Validate dates
            const fromDate = new Date(formData.from);
            const toDate = new Date(formData.to);

            if (fromDate > toDate) {
                throw new Error('End date cannot be before start date');
            }

            console.log('Submitting leave request:', formData);

            // Use authenticatedFetch instead of direct axios call
            const response = await authenticatedFetch('/leave/apply', {
                method: 'POST',
                body: JSON.stringify({
                    fromDate: formData.from,
                    toDate: formData.to,
                    reason: formData.reason,
                    type: formData.type
                })
            });

            const data = await parseJsonResponse(response);
            console.log('Leave application response:', data);

            if (data && (data.success || data.message)) {
                setSuccess(true);
                // Reset form after successful submission
                setFormData({
                    from: '',
                    to: '',
                    reason: '',
                    type: 'casual'
                });
            } else {
                throw new Error(data?.message || 'Failed to apply for leave');
            }
        } catch (error) {
            console.error('Error applying for leave:', error);
            setError(error.message || 'Failed to apply for leave. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-lightest">
            {/* Navigation Bar */}
            <nav className="bg-gradient-primary text-white p-4 shadow-md">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">EmpowerHR</h1>
                    <button
                        onClick={() => navigate('/employee-dashboard')}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
                    >
                        <FiChevronLeft className="mr-2" /> Back to Dashboard
                    </button>
                </div>
            </nav>

            <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
                <div className="card hover-lift">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-dark mb-2">Apply for Leave</h2>
                        <p className="text-gray">Fill out the form below to submit your leave request.</p>
                    </div>

                    {success ? (
                        <div className="bg-success bg-opacity-10 p-6 rounded-lg text-center">
                            <FiCheckCircle className="text-success mx-auto mb-4" size={48} />
                            <h3 className="text-xl font-semibold text-success mb-2">Leave Application Submitted!</h3>
                            <p className="text-gray-dark mb-4">Your leave request has been submitted successfully and is pending approval.</p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="btn-outline-primary"
                                >
                                    Apply Another Leave
                                </button>
                                <button
                                    onClick={() => navigate('/employee-dashboard')}
                                    className="btn-primary"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="leave-form">
                            {error && (
                                <div className="bg-error bg-opacity-10 text-error p-4 rounded-lg mb-6">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label htmlFor="from" className="block mb-2">From Date</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiCalendar className="text-gray" />
                                        </div>
                                        <input
                                            type="date"
                                            id="from"
                                            name="from"
                                            value={formData.from}
                                            onChange={handleChange}
                                            className="pl-10"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="to" className="block mb-2">To Date</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiCalendar className="text-gray" />
                                        </div>
                                        <input
                                            type="date"
                                            id="to"
                                            name="to"
                                            value={formData.to}
                                            onChange={handleChange}
                                            className="pl-10"
                                            min={formData.from || new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="type" className="block mb-2">Leave Type</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="casual">Casual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="unpaid">Unpaid Leave</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="reason" className="block mb-2">Reason for Leave</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                                        <FiFileText className="text-gray" />
                                    </div>
                                    <textarea
                                        id="reason"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        className="pl-10 h-32"
                                        placeholder="Please provide details about your leave request..."
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/employee-dashboard')}
                                    className="btn-outline mr-4"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Leave Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyLeave; 