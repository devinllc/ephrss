import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity, FiMapPin, FiClock, FiBattery, FiZap, FiChevronRight, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import MapPlaceholder from '../components/MapPlaceholder';
import { motion, AnimatePresence } from 'framer-motion';

const FieldTracking = () => {
  const [liveStatus, setLiveStatus] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statusRes, activityRes] = await Promise.all([
        authenticatedFetch('/activity/live/employee-status'),
        authenticatedFetch('/activity/live/team-activity')
      ]);

      const statusData = await parseJsonResponse(statusRes);
      const activityData = await parseJsonResponse(activityRes);

      if (statusData && Array.isArray(statusData.data)) {
        setLiveStatus(statusData.data);
      } else {
        // Fallback for demo if API returns empty
        setLiveStatus([
          { _id: '1', name: 'John Doe', status: 'moving', lastLocation: { lat: 12.9716, lng: 77.5946 }, batteryLevel: 85, isCharging: false, lastUpdate: new Date().toISOString() },
          { _id: '2', name: 'Jane Smith', status: 'idle', lastLocation: { lat: 12.9816, lng: 77.6046 }, batteryLevel: 42, isCharging: true, lastUpdate: new Date(Date.now() - 15 * 60000).toISOString() }
        ]);
      }

      if (activityData && Array.isArray(activityData.data)) {
        setTeamActivity(activityData.data);
      }
    } catch (err) {
      console.error('Error fetching field activity:', err);
      setError('Failed to load live activity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'moving': return 'bg-green-100 text-green-700 border-green-200';
      case 'idle': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'offline': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const mapPoints = liveStatus
    .filter(emp => emp.lastLocation)
    .map(emp => ({
      lat: emp.lastLocation.lat,
      lng: emp.lastLocation.lng,
      name: emp.name
    }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FiActivity className="text-indigo-600" />
              Live Field Tracking
            </h1>
            <p className="text-slate-500 mt-1">Monitor real-time status and location of your field team.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Manual Refresh
            </button>
            <button 
              onClick={() => navigate('/admin/field-history')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md font-medium"
            >
              View History
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map View */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiMapPin className="text-indigo-500" />
                  Live Team Map
                </h3>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  {mapPoints.length} active nodes
                </span>
              </div>
              <MapPlaceholder 
                points={mapPoints} 
                zoom={12} 
                center={mapPoints.length > 0 ? { lat: mapPoints[0].lat, lng: mapPoints[0].lng } : { lat: 12.9716, lng: 77.5946 }} 
              />
            </div>

            {/* Team Activity Feed */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiUsers className="text-indigo-500" />
                  Recent Team Activity
                </h3>
              </div>
              <div className="p-0 max-h-[400px] overflow-y-auto">
                {teamActivity.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {teamActivity.map((activity, i) => (
                      <li key={i} className="p-4 hover:bg-slate-50 transition">
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${i % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {activity.employeeName?.charAt(0) || 'E'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">
                              <span className="font-bold">{activity.employeeName}</span> {activity.action}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <FiClock className="inline" />
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    No recent activity recorded.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employee Status Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[860px]">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Employee Real-time Status</h3>
                <div className="mt-2 text-xs text-slate-400 flex gap-4">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Moving</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Idle</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Offline</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {liveStatus.map((emp) => (
                  <motion.div 
                    layout
                    key={emp._id} 
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition border-l-4 ${selectedEmployee === emp._id ? 'border-indigo-600 bg-indigo-50/10' : 'border-transparent'}`}
                    onClick={() => setSelectedEmployee(emp._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-800">{emp.name}</h4>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(emp.status)}`}>
                         {emp.status}
                       </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <FiBattery className={emp.batteryLevel < 20 ? 'text-red-500' : 'text-slate-400'} />
                        {emp.batteryLevel}% 
                        {emp.isCharging && <FiZap className="text-amber-500 w-3 h-3" />}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <FiClock className="text-slate-400" />
                        {new Date(emp.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/field-history?employeeId=${emp._id}`);
                      }}
                      className="mt-3 w-full py-1.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 transition flex items-center justify-center gap-1"
                    >
                      Detailed History <FiChevronRight />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldTracking;
