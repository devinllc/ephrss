import React, { useState, useEffect } from 'react';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaArrowLeft, FaUserCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceList = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [approvedMap, setApprovedMap] = useState({});
    const [verifying, setVerifying] = useState(null);
    const navigate = useNavigate();

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
            alert('Failed to verify attendance.');
        } finally {
            setVerifying(null);
        }
    };

    // Animation variants for list
    const listVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
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
                📋 Attendance Records
            </h2>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <FaSpinner className="animate-spin text-blue-600 text-4xl" />
                </div>
            ) : (
                <>
                    {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
                    {attendance.length === 0 && <p className="text-center text-gray-500">No records found.</p>}

                    <motion.div
                        className="grid gap-5"
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <AnimatePresence>
                            {attendance.map((record) => {
                                const isApproved = approvedMap[record._id];
                                return (
                                    <motion.div
                                        key={record._id}
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
                                                <span>{record.employee.name}</span>
                                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded ml-2">{record.status}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 text-sm text-gray-700 mt-2">
                                                <span>
                                                    <span className="font-medium text-gray-600">Date:</span>{' '}
                                                    <span className="text-blue-600 font-semibold">
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </span>
                                                </span>
                                                <span>
                                                    <span className="font-medium text-gray-600">Punch In:</span>{' '}
                                                    <span className="font-semibold text-green-600">
                                                        {record.punchIn?.time
                                                            ? new Date(record.punchIn.time).toLocaleTimeString()
                                                            : 'N/A'}
                                                    </span>
                                                </span>
                                                <span>
                                                    <span className="font-medium text-gray-600">Punch Out:</span>{' '}
                                                    <span className="font-semibold text-red-600">
                                                        {record.punchOut?.time
                                                            ? new Date(record.punchOut.time).toLocaleTimeString()
                                                            : 'N/A'}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm">
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
                                            </div>
                                        </div>

                                        {!isApproved && (
                                            <button
                                                onClick={() => verifyAttendance(record._id)}
                                                className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow transition"
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
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </div>
    );
};

// Mock data fallback (logic unchanged)
function getMockAttendance() {
    return [
        {
            _id: '1',
            employee: { name: 'Rohit Sharma' },
            status: 'Present',
            date: new Date().toISOString(),
            punchIn: { time: new Date().setHours(9, 15, 0) },
            punchOut: { time: new Date().setHours(18, 0, 0) },
            verified: false
        },
        {
            _id: '2',
            employee: { name: 'Priya Singh' },
            status: 'Absent',
            date: new Date().toISOString(),
            punchIn: {},
            punchOut: {},
            verified: false
        }
    ];
}

export default AttendanceList;
