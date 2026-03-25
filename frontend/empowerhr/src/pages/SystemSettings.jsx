import React, { useEffect, useState } from 'react';
import { BsGear, BsGlobe, BsCreditCard, BsPlug, BsCheck2Circle } from 'react-icons/bs';
import { getSystemSettings, updateWebhook } from '../utils/api';

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSystemSettings();
        setSettings(data);
        setWebhookUrl(data.webhookUrl || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleUpdateWebhook = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateWebhook(webhookUrl);
      alert('Webhook updated successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Settings...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <BsGear className="text-slate-600" /> Platform Configuration
          </h1>
          <p className="text-slate-500 mt-1">Manage global integrations, privacy, and billing settings</p>
        </header>

        <div className="space-y-8">
          
          {/* Integration Card */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                <BsPlug size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold">External Integrations</h2>
                <p className="text-slate-400 text-sm">Connect EmpowerHR to your existing workflow</p>
              </div>
            </div>

            <form onSubmit={handleUpdateWebhook} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-3">Global Webhook URL</label>
                <div className="flex gap-4">
                  <input 
                    type="url" 
                    placeholder="https://hooks.slack.com/services/..."
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 ring-indigo-500"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <button 
                    disabled={saving}
                    className="px-8 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Save'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                  <BsCheck2Circle className="text-emerald-500" /> System will push HR events (attendance, tasks) to this URL.
                </p>
              </div>
            </form>
          </section>

          {/* Privacy & Visibility */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                <BsGlobe size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Global Privacy Mode</h2>
                <p className="text-slate-400 text-sm">Enforce company-wide data visibility policies</p>
              </div>
              <div className="ml-auto">
                <div className="w-14 h-8 bg-emerald-600 rounded-full flex items-center px-1 shadow-inner cursor-pointer">
                  <div className="w-6 h-6 bg-white rounded-full shadow-md ml-auto"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              When **Strict Privacy** is active, employee location tracking is automatically disabled outside of their configured shift hours (GMT+5:30).
            </p>
          </section>

          {/* Company Geofencing */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                <BsGlobe size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Workspace Geofencing</h2>
                <p className="text-slate-400 text-sm">Define authorized attendance boundaries</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase">Latitude</label>
                 <input type="number" step="0.0001" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm" placeholder="12.9716" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase">Longitude</label>
                 <input type="number" step="0.0001" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm" placeholder="77.5946" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase">Radius (meters)</label>
                 <input type="number" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm" placeholder="200" />
               </div>
            </div>
            <button className="mt-6 px-10 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-100">
              Update Perimeter
            </button>
          </section>

          {/* Billing Card */}
          <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-indigo-400 text-xs font-black uppercase mb-2 tracking-widest">Current Plan</p>
                <h3 className="text-3xl font-extrabold mb-1">Enterprise Suite</h3>
                <p className="text-slate-400 text-sm">Active for 12,500 employee seats</p>
              </div>
              <div className="text-right">
                <BsCreditCard size={40} className="text-slate-700 mb-4 ml-auto" />
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-all">Manage Billing</button>
              </div>
            </div>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
