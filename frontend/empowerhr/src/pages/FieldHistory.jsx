import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiClock, FiArrowLeft, FiNavigation, FiHome, FiShoppingBag, FiInfo } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import MapPlaceholder from '../components/MapPlaceholder';
import { motion } from 'framer-motion';

const FieldHistory = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const employeeId = searchParams.get('employeeId');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState([]);
  const [route, setRoute] = useState([]);
  const [stops, setStops] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setError('');
      
      const [histRes, routeRes, stopsRes, visitsRes] = await Promise.all([
        authenticatedFetch(`/field/${employeeId}/history?date=${date}`),
        authenticatedFetch(`/field/route/${employeeId}?date=${date}`),
        authenticatedFetch(`/field/stops/${employeeId}?date=${date}`),
        authenticatedFetch(`/field/visits/${employeeId}?date=${date}`)
      ]);

      const histData = await parseJsonResponse(histRes);
      const routeData = await parseJsonResponse(routeRes);
      const stopsData = await parseJsonResponse(stopsRes);
      const visitsData = await parseJsonResponse(visitsRes);

      setHistory(histData?.data || []);
      setRoute(routeData?.data || []);
      setStops(stopsData?.data || []);
      setVisits(visitsData?.data || []);

      // Mock data for demo if empty
      if (!histData?.data?.length) {
        setStops([
          { locationName: 'Office HQ', arrivalTime: '09:00 AM', departureTime: '09:30 AM', duration: '30m' },
          { locationName: 'Client Site A', arrivalTime: '10:15 AM', departureTime: '11:45 AM', duration: '1h 30m' },
          { locationName: 'Lunch Break', arrivalTime: '12:30 PM', departureTime: '01:30 PM', duration: '1h' }
        ]);
        setVisits([
          { clientName: 'TechCorp Solutions', purpose: 'Maintenance', checkIn: '10:15 AM', checkOut: '11:45 AM', status: 'completed' },
          { clientName: 'Global Retailers', purpose: 'Sales Pitch', checkIn: '02:30 PM', checkOut: '03:45 PM', status: 'completed' }
        ]);
        setRoute([
          { lat: 12.9716, lng: 77.5946, name: 'Start' },
          { lat: 12.9816, lng: 77.6046, name: 'Client A' },
          { lat: 12.9916, lng: 77.6146, name: 'Stop' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching field history:', err);
      setError('Failed to load history data for the selected date.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId, date]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/field-tracking')}
            className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition shadow-sm text-slate-600"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Historical Field Data</h1>
            <p className="text-slate-500 text-sm">Review past routes, stops, and visit details.</p>
          </div>
          <div className="ml-auto flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <FiCalendar className="text-indigo-500" />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="border-none focus:ring-0 text-sm text-slate-700 bg-transparent"
            />
          </div>
        </div>

        {!employeeId ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400">
             Please select an employee from the live tracking dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Route Map */}
            <div className="lg:col-span-12">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                  <FiNavigation className="text-indigo-500" />
                  Route Visualization
                </h3>
                <MapPlaceholder points={route} zoom={13} center={route.length > 0 ? { lat: route[0].lat, lng: route[0].lng } : { lat: 12.9716, lng: 77.5946 }} />
              </div>
            </div>

            {/* Stops and Visits Section */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FiHome className="text-indigo-500" />
                    Stops Recorded
                  </h3>
                </div>
                <div className="p-0">
                  {stops.length > 0 ? (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500">
                          <th className="px-6 py-3 font-semibold">Location</th>
                          <th className="px-6 py-3 font-semibold">Arrival</th>
                          <th className="px-6 py-3 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stops.map((stop, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-medium text-slate-700">{stop.locationName}</td>
                            <td className="px-6 py-4 text-slate-500">{stop.arrivalTime}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">
                                {stop.duration}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic">No significant stops recorded.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FiShoppingBag className="text-indigo-500" />
                    Visit Activity
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {visits.length > 0 ? (
                    visits.map((visit, i) => (
                      <div key={i} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800">{visit.clientName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {visit.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><FiInfo className="inline" /> {visit.purpose}</span>
                          <span className="flex items-center gap-1"><FiClock className="inline" /> {visit.checkIn} - {visit.checkOut}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 italic">No customer visits logged.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldHistory;
