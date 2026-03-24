import React, { useEffect, useState } from 'react';
import { BsBriefcase, BsPlus, BsThreeDots, BsKanban } from 'react-icons/bs';
import { getLeads, createLead } from '../utils/api';

const CRMDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', value: '', status: 'Lead' });

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const data = await getLeads();
        setLeads(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, []);

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await createLead(newLead);
      setLeads([...leads, { ...newLead, _id: Date.now() }]);
      setShowAddLead(false);
      setNewLead({ name: '', company: '', email: '', value: '', status: 'Lead' });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const stages = ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed'];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <BsBriefcase className="text-amber-600" /> Revenue & CRM Pipeline
            </h1>
            <p className="text-slate-500 mt-1">Manage sales leads and track conversion productivity</p>
          </div>
          <button 
            onClick={() => setShowAddLead(true)}
            className="flex items-center gap-2 px-6 py-4 bg-amber-600 text-white rounded-[2rem] font-bold shadow-xl shadow-amber-200 hover:bg-amber-700 transition-all"
          >
            <BsPlus size={24} /> New Lead
          </button>
        </header>

        {/* Pipeline Board */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {stages.map(stage => (
            <div key={stage} className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{stage}</h3>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                  {leads.filter(l => l.status === stage).length}
                </span>
              </div>
              
              <div className="bg-slate-100/50 p-4 rounded-[2rem] min-h-[500px] border-2 border-dashed border-slate-200 space-y-4">
                {leads.filter(l => l.status === stage).map(lead => (
                  <div key={lead._id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group cursor-grab active:scale-95 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-slate-900 leading-tight">{lead.name}</h4>
                      <BsThreeDots className="text-slate-300 group-hover:text-slate-600" />
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{lead.company}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-slate-800">${lead.value || '0'}</span>
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white"></div>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-8">Register Professional Lead</h2>
            <form onSubmit={handleAddLead} className="space-y-6">
              <input 
                type="text" placeholder="Full Name" required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-2 ring-amber-500/20"
                value={newLead.name}
                onChange={(e) => setNewLead({...newLead, name: e.target.value})}
              />
              <input 
                type="text" placeholder="Company / Organization" required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-2 ring-amber-500/20"
                value={newLead.company}
                onChange={(e) => setNewLead({...newLead, company: e.target.value})}
              />
              <div className="flex gap-4">
                <input 
                  type="number" placeholder="Value ($)" required
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"
                  value={newLead.value}
                  onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                />
                <select 
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-600"
                  value={newLead.status}
                  onChange={(e) => setNewLead({...newLead, status: e.target.value})}
                >
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddLead(false)} className="flex-1 py-4 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-200">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDashboard;
