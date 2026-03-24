import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BsPeople, 
  BsLightning, 
  BsArrowRight, 
  BsCheckCircle, 
  BsClockHistory 
} from 'react-icons/bs';
import { getTeamPerformance, getTeamAlerts, fetchEmployees, createTask } from '../utils/api';

const ManagerPortal = () => {
  const [teamData, setTeamData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [perf, alrt, emps] = await Promise.all([
          getTeamPerformance(),
          getTeamAlerts(),
          fetchEmployees()
        ]);
        setTeamData(perf.data || []);
        setAlerts(alrt.data || []);
        setEmployees(emps.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({
        ...newTask,
        assignedTo: selectedEmployee._id,
      });
      setShowAssignModal(false);
      alert("Task assigned successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Optimizing Team Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <BsPeople className="text-indigo-600" /> Manager Intelligence Portal
            </h1>
            <p className="text-slate-500 mt-1">Real-time team performance & workload management</p>
          </div>
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-1">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-indigo-200 shadow-lg">Active Reports</button>
            <button className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl">Historical Trends</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Team Performance Table */}
          <div className="lg:col-span-3 space-y-8">
            <section className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800">Team Performance Scores</h2>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">AI Scored</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Current Load</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Efficiency</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{emp.name}</p>
                              <p className="text-xs text-slate-400">{emp.designation || 'Specialist'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">42%</span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 w-[42%] rounded-full"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-500">92%</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase">Optimal</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => { setSelectedEmployee(emp); setShowAssignModal(true); }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <BsLightning size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar Alerts */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl">
              <h3 className="font-bold flex items-center gap-2 mb-6">
                <BsClockHistory className="text-indigo-400" /> Late Pulse
              </h3>
              <div className="space-y-4">
                {alerts.length > 0 ? alerts.map(alert => (
                  <div key={alert._id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xs text-indigo-300 font-bold mb-1">{alert.type}</p>
                    <p className="text-sm font-medium leading-tight">{alert.message}</p>
                  </div>
                )) : (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-slate-500 text-xs italic">
                    No active performance alerts for your team.
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200">
              <p className="text-indigo-100 text-xs font-bold uppercase mb-2">Pro Tip</p>
              <p className="text-sm font-bold leading-relaxed">
                Employees with efficiency > 90% are suitable for complex high-priority tasks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Assign Intelligence</h2>
            <p className="text-slate-400 mb-8 text-sm">Target: <span className="font-bold text-indigo-600">{selectedEmployee?.name}</span></p>
            
            <form onSubmit={handleAssignTask} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Task Title</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 ring-indigo-500"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Goal Context</label>
                <textarea 
                  required rows="3"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 ring-indigo-500"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all">Assign Task</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManagerPortal;
