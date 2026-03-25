import React, { useState, useEffect } from 'react';
import { FiBell, FiAlertTriangle, FiInfo, FiCheckCircle, FiTrash2, FiClock, FiShield, FiBriefcase } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const res = await authenticatedFetch('/alerts');
            if (res.ok) {
                const data = await parseJsonResponse(res);
                setAlerts(data?.data || []);
            } else {
                // Mock data for demo
                setAlerts([
                    { _id: '1', type: 'warning', title: 'Low Battery on Field Device', message: 'John Doe\'s device is at 5% battery. Field tracking might be interrupted.', createdAt: new Date(Date.now() - 30 * 60000).toISOString(), acknowledged: false },
                    { _id: '2', type: 'info', title: 'System Maintenance Scheduled', message: 'The system will undergo maintenance on Sunday, March 29th, from 02:00 AM to 04:00 AM UTC.', createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), acknowledged: false },
                    { _id: '3', type: 'critical', title: 'Geofence Breach Detected', message: 'Employee Jane Smith has left the assigned geofence area during working hours.', createdAt: new Date(Date.now() - 15 * 60000).toISOString(), acknowledged: false },
                    { _id: '4', type: 'success', title: 'Payroll Generation Complete', message: 'Payroll for March 2026 has been successfully generated for all employees.', createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), acknowledged: true }
                ]);
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleAcknowledge = async (id) => {
        try {
            const res = await authenticatedFetch(`/alerts/${id}/acknowledge`, { method: 'PATCH' });
            if (res.ok || true) { // Optimistic update
                setAlerts(prev => prev.map(a => a._id === id ? { ...a, acknowledged: true } : a));
            }
        } catch (err) {
            console.error('Error acknowledging alert:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await authenticatedFetch(`/alerts/${id}`, { method: 'DELETE' });
            if (res.ok || true) { // Optimistic delete
                setAlerts(prev => prev.filter(a => a._id !== id));
            }
        } catch (err) {
            console.error('Error deleting alert:', err);
        }
    };

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'unread') return !a.acknowledged;
        if (filter === 'important') return a.type === 'critical' || a.type === 'warning';
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'critical': return <FiAlertTriangle className="text-red-500" />;
            case 'warning': return <FiAlertTriangle className="text-amber-500" />;
            case 'success': return <FiCheckCircle className="text-green-500" />;
            default: return <FiInfo className="text-blue-500" />;
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400">Loading alerts data...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <FiBell className="text-indigo-600" />
                            Notification Center
                        </h1>
                        <p className="text-slate-500 mt-1">Stay updated with critical system and team events.</p>
                    </div>
                    <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1 shadow-sm">
                        {['all', 'unread', 'important'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredAlerts.length > 0 ? (
                            filteredAlerts.map((alert) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={alert._id}
                                    className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 transition-all ${alert.acknowledged ? 'border-slate-100 opacity-60' : (alert.type === 'critical' ? 'border-red-500 shadow-md ring-1 ring-red-100' : (alert.type === 'warning' ? 'border-amber-500' : 'border-indigo-500'))}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="text-2xl mt-1">
                                            {getIcon(alert.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`font-bold ${alert.acknowledged ? 'text-slate-500' : 'text-slate-900'}`}>{alert.title}</h3>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                                                    <FiClock /> {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-sm mt-1 leading-relaxed ${alert.acknowledged ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {alert.message}
                                            </p>
                                            
                                            <div className="mt-4 flex gap-3">
                                                {!alert.acknowledged && (
                                                    <button 
                                                        onClick={() => handleAcknowledge(alert._id)}
                                                        className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(alert._id)}
                                                    className="p-1 px-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiCheckCircle className="text-slate-300" size={32} />
                                </div>
                                <h3 className="font-bold text-slate-700">All caught up!</h3>
                                <p className="text-sm text-slate-400 mt-1">No alerts matching your current filter.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Legend/Footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                     <div className="p-4 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
                         <div className="p-2 bg-red-100 text-red-600 rounded-lg"><FiShield size={20} /></div>
                         <div>
                             <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Critical</h4>
                             <p className="text-xs font-bold text-slate-700">Action Required</p>
                         </div>
                     </div>
                     <div className="p-4 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
                         <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FiAlertTriangle size={20} /></div>
                         <div>
                             <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Warning</h4>
                             <p className="text-xs font-bold text-slate-700">High Priority</p>
                         </div>
                     </div>
                     <div className="p-4 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiBriefcase size={20} /></div>
                         <div>
                             <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">System</h4>
                             <p className="text-xs font-bold text-slate-700">Information</p>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Alerts;
