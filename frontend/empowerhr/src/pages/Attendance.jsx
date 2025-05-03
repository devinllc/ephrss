import React, { useState, useEffect } from 'react';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';

import { FaCheckCircle, FaTimesCircle, FaSpinner, FaArrowLeft, FaUserCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AttendanceList = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [approvedMap, setApprovedMap] = useState({});
    const [verifying, setVerifying] = useState(null);
    const navigate = useNavigate();

    // Auto fetch on mount
    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authenticatedFetch('/attendence/');
            if (response.ok) {
                const data = await parseJsonResponse(response);
                const records = data?.data || [];
                setAttendance(records);

                const map = {};
                records.forEach((rec) => {
                    if (rec.verified === true) map[rec._id] = true;
                });
                setApprovedMap(map);
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(errorData?.message || errorData?.error || 'Fetch failed');
            }
        } catch (err) {
            console.error('Error fetching:', err);
            setError('Failed to load attendance. Showing mock data.');
            setAttendance(getMockAttendance());
        } finally {
            setLoading(false);
        }
    };

    const verifyAttendance = async (id) => {
        setVerifying(id);
        try {
            const response = await authenticatedFetch(`/attendence/${id}/verify`, {
                method: 'PATCH',
            });

            if (response.ok) {
                setApprovedMap((prev) => ({
                    ...prev,
                    [id]: true,
                }));
            } else {
                const errorData = await parseJsonResponse(response).catch(() => null);
                throw new Error(errorData?.message || 'Verification failed');
            }
        } catch (err) {
            console.error('Verification error:', err);
            alert('Failed to verify attendance.');
        } finally {
            setVerifying(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
                <FaArrowLeft /> Back
            </button>

            <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">📋 Attendance Records</h2>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <FaSpinner className="animate-spin text-blue-600 text-4xl" />
                </div>
            ) : (
                <>
                    {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
                    {attendance.length === 0 && <p className="text-center text-gray-500">No records found.</p>}

                    <div className="grid gap-4">
                        {attendance.map((record) => {
                            const isApproved = approvedMap[record._id];
                            return (
                                <div
                                    key={record._id}
                                    className="border border-blue-200 bg-white rounded-xl p-4 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center"
                                >
                                    <div className="mb-3 sm:mb-0">
                                        <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaUserCheck className="text-blue-500" />
                                            {record.employee.name} - {record.status} on{' '}
                                            <span className="text-blue-600">
                                                {new Date(record.date).toLocaleDateString()}
                                            </span>
                                        </p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            Punch In:{' '}
                                            <span className="font-medium text-green-600">
                                                {record.punchIn?.time
                                                    ? new Date(record.punchIn.time).toLocaleTimeString()
                                                    : 'N/A'}
                                            </span>{' '}
                                            | Punch Out:{' '}
                                            <span className="font-medium text-red-600">
                                                {record.punchOut?.time
                                                    ? new Date(record.punchOut.time).toLocaleTimeString()
                                                    : 'N/A'}
                                            </span>
                                        </p>
                                        <p className="mt-2 text-sm">
                                            Status:{' '}
                                            {isApproved ? (
                                                <span className="text-green-600 font-semibold flex items-center gap-1">
                                                    <FaCheckCircle /> Approved
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <FaTimesCircle /> Not Approved
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {!isApproved && (
                                        <button
                                            onClick={() => verifyAttendance(record._id)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                                            disabled={verifying === record._id}
                                        >
                                            {verifying === record._id ? (
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
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceList;
