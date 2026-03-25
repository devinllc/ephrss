import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiZap, FiCheckCircle, FiClock, FiActivity, FiArrowRight, FiShield } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { motion } from 'framer-motion';

const Subscription = () => {
    const [subData, setSubData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            const res = await authenticatedFetch('/subscription/me');
            if (res.ok) {
                const data = await parseJsonResponse(res);
                setSubData(data?.data);
            } else {
                // Mock data for demo
                setSubData({
                    plan: 'Professional',
                    status: 'active',
                    price: 49.99,
                    billingCycle: 'monthly',
                    nextBillingDate: '2026-04-20',
                    usage: {
                        employees: { current: 42, limit: 100 },
                        storage: { current: 5.2, limit: 10 },
                        tasks: { current: 1250, limit: 5000 }
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching subscription:', err);
            setError('Failed to load subscription details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    if (loading) return <div className="p-12 text-center text-slate-400">Loading subscription details...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center py-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscription & Billing</h1>
                    <p className="text-slate-500 mt-2">Manage your organization's plan and track resource usage.</p>
                </div>

                {/* Plan Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8">
                        <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-widest border border-green-200">
                            {subData?.status}
                        </span>
                    </div>
                    
                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <FiZap size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{subData?.plan} Plan</h2>
                                <p className="text-slate-400">Billed {subData?.billingCycle}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Next Payment</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-slate-900">${subData?.price}</span>
                                    <span className="text-slate-400 font-medium">on {new Date(subData?.nextBillingDate).toLocaleDateString()}</span>
                                </div>
                                <button className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all">
                                    Manage Payment Method <FiArrowRight />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resource Usage</h3>
                                <div className="space-y-4">
                                    {subData && Object.entries(subData.usage).map(([key, value]) => (
                                        <div key={key}>
                                            <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wide">
                                                <span className="text-slate-500">{key}</span>
                                                <span className="text-slate-900">{value.current} / {value.limit}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(value.current / value.limit) * 100}%` }}
                                                    className={`h-full ${(value.current / value.limit) > 0.8 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-wrap gap-6 justify-center text-slate-500 text-sm">
                        <span className="flex items-center gap-2"><FiCheckCircle className="text-indigo-500" /> Unlimited Employees</span>
                        <span className="flex items-center gap-2"><FiCheckCircle className="text-indigo-500" /> Advanced Analytics</span>
                        <span className="flex items-center gap-2"><FiCheckCircle className="text-indigo-500" /> API Integration</span>
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FiCreditCard className="text-indigo-500" />
                            Recent Invoices
                         </h3>
                         <button className="text-xs font-bold text-indigo-600 p-2 hover:bg-slate-50 rounded transition">VIEW ALL</button>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-slate-100">
                                {[1, 2, 3].map(i => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-medium text-slate-700">Invoice #2026-00{i}</td>
                                        <td className="px-6 py-4 text-slate-500">Mar 20, 2026</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">$49.99</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-indigo-600 hover:underline">Download PDF</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Support/Security Footer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                        <FiShield className="text-indigo-600 mt-1" size={24} />
                        <div>
                            <h4 className="font-bold text-indigo-900">Secure Payments</h4>
                            <p className="text-xs text-indigo-700 mt-1">All transactions are encrypted and processed securely via Stripe. We do NOT store your card details on our servers.</p>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-100 rounded-2xl flex items-start gap-4">
                        <FiClock className="text-slate-600 mt-1" size={24} />
                        <div>
                            <h4 className="font-bold text-slate-800">Billing Support</h4>
                            <p className="text-xs text-slate-600 mt-1">Found an error? Contact our billing team at billing@empowerhr.com for a 24-hour turnaround.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
