import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiFilter, FiCalendar, FiUser, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiPlay, FiStopCircle, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse, fetchEmployees, createTask, fetchProjects } from '../utils/api';
import Cookies from 'js-cookie';
import TaskComments from '../components/TaskComments';
import { motion, AnimatePresence } from 'framer-motion';

// Simple Modal Component
const SimpleModal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative overflow-hidden"
            >
                {children}
            </motion.div>
        </div>
    );
};

// Create Task Form Component
const CreateTaskForm = ({ onClose, onSubmit, users, projects, existingTasks }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: [],
        deadline: '',
        priority: 'medium',
        projectId: '',
        dependsOn: [],
        blockingType: 'strict',
        isParallel: false
    });

    const projectTasks = formData.projectId
        ? existingTasks.filter(t => t.projectId?._id === formData.projectId || t.projectId === formData.projectId)
        : [];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">Create New Task</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <FiXCircle size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500"
                        placeholder="Task title..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500 h-24"
                        placeholder="What needs to be done?"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Project</label>
                        <select
                            value={formData.projectId}
                            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500"
                            required
                        >
                            <option value="">Select Project</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.title || p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Priority</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500 text-indigo-600 font-bold"
                            required
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Deadline</label>
                    <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Assign To</label>
                    <select
                        multiple
                        value={formData.assignedTo}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                            setFormData({ ...formData, assignedTo: selected });
                        }}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500 min-h-[80px]"
                        required
                    >
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.email} ({user.name})</option>
                        ))}
                    </select>
                </div>

                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition">Cancel</button>
                    <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">Create Task</button>
                </div>
            </form>
        </div>
    );
};

const TaskCard = ({ task, users, tasks, onUpdateStatus }) => {
    const [showComments, setShowComments] = useState(false);
    
    const assignedUser = users.find(u => u._id === (task.assignedTo?.[0]?._id || task.assignedTo?.[0] || task.assignedTo));
    const createdByUser = users.find(u => u._id === (task.createdBy?._id || task.createdBy));

    const isLocked = task.status === 'pending' && task.dependsOn?.some(depId => {
        const depTask = tasks.find(t => t._id === depId);
        return depTask && depTask.status !== 'completed';
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200 shadow-lg shadow-blue-100 ring-2 ring-blue-50';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-indigo-600 bg-indigo-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <motion.div 
            layout
            className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${isLocked ? 'grayscale opacity-60 border-slate-200' : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(task.status)}`}>
                            {task.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group flex items-center gap-2">
                        {isLocked && <FiClock className="text-slate-400" />}
                        {task.title}
                    </h3>
                </div>
                {task.projectId && (
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400" title={task.projectId.title}>
                        <FiBriefcase size={16} />
                    </div>
                )}
            </div>

            <p className="text-sm text-slate-500 line-clamp-2 mb-6">{task.description}</p>

            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FiUser className="text-indigo-500" />
                    <span>{assignedUser?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FiCalendar className="text-indigo-500" />
                    <span>{new Date(task.deadline).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Lifecycle Controls */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                {task.status === 'pending' && (
                    <button 
                        onClick={() => onUpdateStatus(task._id, 'in-progress')}
                        disabled={isLocked}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        <FiPlay /> Start
                    </button>
                )}
                {task.status === 'in-progress' && (
                    <button 
                        onClick={() => onUpdateStatus(task._id, 'completed')}
                        className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition"
                    >
                        <FiCheckCircle /> Complete
                    </button>
                )}
                <button 
                    onClick={() => setShowComments(!showComments)}
                    className={`p-2 rounded-xl transition ${showComments ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                    <FiMessageSquare />
                </button>
            </div>

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <TaskComments taskId={task._id} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TaskManagement = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ status: '', priority: '' });
    const [metrics, setMetrics] = useState({ overdue: 0, completionRate: 0 });

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.priority) queryParams.append('priority', filters.priority);

            const res = await authenticatedFetch(`/task?${queryParams.toString()}`);
            const data = await parseJsonResponse(res);
            setTasks(Array.isArray(data) ? data : (data.tasks || []));
            
            // Fetch Metrics
            const mRes = await authenticatedFetch('/task/metrics/completion-rate');
            const mData = await parseJsonResponse(mRes);
            if (mData) setMetrics(prev => ({ ...prev, completionRate: mData.rate || 0 }));
            
            const oRes = await authenticatedFetch('/task/metrics/overdue');
            const oData = await parseJsonResponse(oRes);
            if (oData) setMetrics(prev => ({ ...prev, overdue: oData.count || 0 }));

        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to sync tasks with server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const [e, p] = await Promise.all([fetchEmployees(), fetchProjects()]);
            if (e.success) setUsers(e.data);
            if (p.success) setProjects(p.data);
            await fetchTasks();
        };
        init();
    }, [searchQuery, filters]);

    const handleCreateTask = async (taskData) => {
        const userData = JSON.parse(Cookies.get('userData') || '{}');
        const res = await createTask({ ...taskData, status: 'pending', createdBy: userData._id });
        if (res.success) {
            setShowCreateModal(false);
            fetchTasks();
        }
    };

    const handleUpdateStatus = async (taskId, status) => {
        const res = await authenticatedFetch(`/task/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (res.ok) fetchTasks();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Operations</h1>
                        <p className="text-slate-500">Track and manage mission-critical tasks in real-time.</p>
                    </div>
                    
                    {/* Tiny Analytics Dashboard */}
                    <div className="flex gap-4">
                        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                                <FiAlertCircle size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overdue</h4>
                                <p className="text-xl font-black text-slate-900">{metrics.overdue}</p>
                            </div>
                        </div>
                        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <FiTrendingUp size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comp. Rate</h4>
                                <p className="text-xl font-black text-slate-900">{metrics.completionRate}%</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <FiPlus size={20} /> New Task
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-wrap gap-4 shadow-sm">
                    <div className="flex-1 min-w-[200px] relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search tasks, projects, or users..." 
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 ring-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm font-bold text-slate-600 focus:ring-2 ring-indigo-500"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Task Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskCard 
                            key={task._id} 
                            task={task} 
                            users={users} 
                            tasks={tasks}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    ))}
                </div>

                {tasks.length === 0 && !loading && (
                    <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiBriefcase className="text-slate-300" size={32} />
                         </div>
                         <h3 className="text-xl font-bold text-slate-700">No active tasks found</h3>
                         <p className="text-slate-400 mt-2">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>

            <SimpleModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
                <CreateTaskForm 
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateTask}
                    users={users}
                    projects={projects}
                    existingTasks={tasks}
                />
            </SimpleModal>
        </div>
    );
};

export default TaskManagement;