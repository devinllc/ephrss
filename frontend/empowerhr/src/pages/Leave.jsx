import React, { useState, useEffect } from 'react';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaArrowLeft, FaUserCheck, FaBan } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveList = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionInProgress, setActionInProgress] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchLeaveRequests();
        // eslint-disable-next-line
    }, []);

    const fetchLeaveRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authenticatedFetch('/leave/');
            if (response.ok) {
                const data = await parseJsonResponse(response);
                const requests = data?.data || [];
                setLeaveRequests(requests);
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(errorData?.message || errorData?.error || 'Fetch failed');
            }
        } catch (err) {
            setError('Failed to load leave requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReject = async (action, id) => {
        setActionInProgress(id);
        try {
            const response = await authenticatedFetch('/leave/approve-reject', {
                method: 'POST',
                body: JSON.stringify({ leaveId: id, action }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                setLeaveRequests((prevRequests) =>
                    prevRequests.filter((req) => req._id !== id)
                );
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(errorData?.message || 'Action failed');
            }
        } catch (err) {
            alert(`Failed to ${action} leave request.`);
        } finally {
            setActionInProgress(null);
        }
    };

    const handleCancel = async (id) => {
        setActionInProgress(id);
        try {
            const response = await authenticatedFetch('/leave/cancel', {
                method: 'POST',
                body: JSON.stringify({ leaveId: id }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                setLeaveRequests((prevRequests) =>
                    prevRequests.filter((req) => req._id !== id)
                );
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(errorData?.message || 'Cancel action failed');
            }
        } catch (err) {
            alert('Failed to cancel leave request.');
        } finally {
            setActionInProgress(null);
        }
    };

    // Animation variants
    const listVariants = {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
            >
                <FaArrowLeft /> Back
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-blue-700 tracking-tight">
                📝 Leave Requests
            </h2>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <FaSpinner className="animate-spin text-blue-600 text-4xl" />
                </div>
            ) : (
                <>
                    {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
                    {leaveRequests.length === 0 && <p className="text-center text-gray-500">No leave requests found.</p>}

                    <motion.div
                        className="grid gap-5"
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <AnimatePresence>
                            {leaveRequests.map((request) => (
                                <motion.div
                                    key={request._id}
                                    variants={itemVariants}
                                    layout
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, y: 30 }}
                                    className="border border-blue-200 bg-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all"
                                >
                                    <div className="mb-3 sm:mb-0 w-full">
                                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                                            <FaUserCheck className="text-blue-500" />
                                            <span>{request.employee.name}</span>
                                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded ml-2">{request.status}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-6 text-sm text-gray-700 mt-2">
                                            <span>
                                                <span className="font-medium text-gray-600">From:</span>{' '}
                                                <span className="text-blue-600 font-semibold">
                                                    {new Date(request.fromDate).toLocaleDateString()}
                                                </span>
                                            </span>
                                            <span>
                                                <span className="font-medium text-gray-600">To:</span>{' '}
                                                <span className="text-blue-600 font-semibold">
                                                    {new Date(request.toDate).toLocaleDateString()}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-700">
                                            Reason:{' '}
                                            <span className="font-medium text-gray-800">{request.reason}</span>
                                        </div>
                                        <div className="mt-2 text-sm">
                                            Status:{' '}
                                            <span className={`font-semibold ${request.status === 'pending' ? 'text-yellow-600' : request.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    {request.status === 'pending' && (
                                        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                                            <button
                                                onClick={() => handleApproveReject('approve', request._id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow transition"
                                                disabled={actionInProgress === request._id}
                                            >
                                                {actionInProgress === request._id ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Approving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheckCircle />
                                                        Approve
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleApproveReject('reject', request._id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow transition"
                                                disabled={actionInProgress === request._id}
                                            >
                                                {actionInProgress === request._id ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Rejecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaTimesCircle />
                                                        Reject
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleCancel(request._id)}
                                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow transition"
                                                disabled={actionInProgress === request._id}
                                            >
                                                {actionInProgress === request._id ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaBan />
                                                        Cancel
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default LeaveList;
