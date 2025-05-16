import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FiPlus, FiSearch, FiFilter, FiCalendar, FiUser, FiTag } from 'react-icons/fi';
import TaskForm from './TaskForm';

const TaskManagement = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        dueBefore: '',
        dueAfter: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, [filters]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            
            if (filters.status !== 'all') queryParams.append('status', filters.status);
            if (filters.priority !== 'all') queryParams.append('priority', filters.priority);
            if (filters.dueBefore) queryParams.append('dueBefore', filters.dueBefore);
            if (filters.dueAfter) queryParams.append('dueAfter', filters.dueAfter);
            if (searchTerm) queryParams.append('search', searchTerm);

            const response = await authenticatedFetch(`/task?${queryParams.toString()}`);
            const data = await parseJsonResponse(response);
            
            if (data) {
                setTasks(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            const response = await authenticatedFetch('/task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                const newTask = await parseJsonResponse(response);
                setTasks(prevTasks => [newTask, ...prevTasks]);
                setShowCreateModal(false);
            } else {
                throw new Error('Failed to create task');
            }
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Failed to create task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const response = await authenticatedFetch(`/task/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedTask = await parseJsonResponse(response);
                setTasks(prevTasks => 
                    prevTasks.map(task => 
                        task._id === taskId ? updatedTask : task
                    )
                );
            }
        } catch (err) {
            console.error('Error updating task status:', err);
            setError('Failed to update task status');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Task Management</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary flex items-center space-x-2"
                    >
                        <FiPlus className="h-5 w-5" />
                        <span>Create Task</span>
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                        className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <div className="flex space-x-2">
                        <input
                            type="date"
                            value={filters.dueAfter}
                            onChange={(e) => setFilters(prev => ({ ...prev, dueAfter: e.target.value }))}
                            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Due After"
                        />
                        <input
                            type="date"
                            value={filters.dueBefore}
                            onChange={(e) => setFilters(prev => ({ ...prev, dueBefore: e.target.value }))}
                            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Due Before"
                        />
                    </div>
                </div>

                {/* Task List */}
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-24 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-red-600 text-center py-4">{error}</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No tasks found</div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div key={task._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h3>
                                        <p className="text-gray-600 mb-4">{task.description}</p>
                                        
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                            {task.tags?.map((tag, index) => (
                                                <span key={index} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <FiCalendar className="mr-1" />
                                                <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <FiUser className="mr-1" />
                                                <span>Assigned to: {task.assignedTo?.name || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                            className="border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <TaskForm
                    onSubmit={handleCreateTask}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
};

export default TaskManagement; 