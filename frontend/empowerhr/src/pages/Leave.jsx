import React, { useState, useEffect } from 'react';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaArrowLeft, FaUserCheck, FaBan } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LeaveList = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionInProgress, setActionInProgress] = useState(null); // Track the action in progress

    const navigate = useNavigate();

    useEffect(() => {
        fetchLeaveRequests();
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
            console.error('Error fetching:', err);
            setError('Failed to load leave requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReject = async (action, id) => {
        setActionInProgress(id); // Set the leave request as the action in progress
        try {
            const response = await authenticatedFetch('/leave/approve-reject', {
                method: 'POST',
                body: JSON.stringify({ leaveId: id, action }), // Send leaveId and action type in body
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Update leaveRequests state to reflect the change
                setLeaveRequests((prevRequests) =>
                    prevRequests.filter((req) => req._id !== id) // Remove the request from the list once the action is completed
                );
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(errorData?.message || 'Action failed');
            }
        } catch (err) {
            console.error(`${action} error:`, err);
            alert(`Failed to ${action} leave request.`);
        } finally {
            setActionInProgress(null); // Reset the action in progress state
        }
    };

    const handleCancel = async (id) => {
        setActionInProgress(id); // Set the leave request as the action in progress
        try {
            const response = await authenticatedFetch('/leave/cancel', {
                method: 'POST',
                body: JSON.stringify({ leaveId: id }), // Send leaveId in body
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Update leaveRequests state to reflect the change
                setLeaveRequests((prevRequests) =>
                    prevRequests.filter((req) => req._id !== id) // Remove the request from the list once the action is completed
                );
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(errorData?.message || 'Cancel action failed');
            }
        } catch (err) {
            console.error('Cancel error:', err);
            alert('Failed to cancel leave request.');
        } finally {
            setActionInProgress(null); // Reset the action in progress state
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
                <FaArrowLeft /> Back
            </button>

            <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">📝 Leave Requests</h2>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <FaSpinner className="animate-spin text-blue-600 text-4xl" />
                </div>
            ) : (
                <>
                    {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
                    {leaveRequests.length === 0 && <p className="text-center text-gray-500">No leave requests found.</p>}

                    <div className="grid gap-4">
                        {leaveRequests.map((request) => {
                            return (
                                <div
                                    key={request._id}
                                    className="border border-blue-200 bg-white rounded-xl p-4 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center"
                                >
                                    <div className="mb-3 sm:mb-0">
                                        <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaUserCheck className="text-blue-500" />
                                            {request.employee.name} requested leave from{' '}
                                            <span className="text-blue-600">
                                                {new Date(request.fromDate).toLocaleDateString()} to{' '}
                                                {new Date(request.toDate).toLocaleDateString()}
                                            </span>
                                        </p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            Reason: <span className="font-medium text-gray-800">{request.reason}</span>
                                        </p>
                                        <p className="mt-2 text-sm">
                                            Status:{request.status}
                                           
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        {request.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApproveReject('approve', request._id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
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
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
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
                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaveList;
