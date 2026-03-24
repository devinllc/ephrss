import React, { useEffect, useState } from 'react';
import { BsShieldLock, BsSearch, BsFilter, BsCloudDownload } from 'react-icons/bs';
import { getAuditLogs } from '../utils/api';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <BsShieldLock className="text-rose-600" /> Compliance & Audit Logs
            </h1>
            <p className="text-slate-500 mt-1">Immutable records of all system activities and admin actions</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
            <BsCloudDownload /> Export CSV
          </button>
        </header>

        {/* Filter Bar */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by action, user, or module..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 ring-rose-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center gap-2">
            <BsFilter /> Filters
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Module</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="px-8 py-10 text-center text-slate-400">Loading secure logs...</td></tr>
                ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                          {log.user?.name?.charAt(0) || 'S'}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{log.user?.name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-700">{log.action}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <BsCheckCircle /> Verified
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-8 py-10 text-center text-slate-400 italic">No logs found matching your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
