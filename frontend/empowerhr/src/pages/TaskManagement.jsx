import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiPlus, FiSearch, FiFilter, FiCalendar, FiUser, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse, fetchEmployees, createTask } from '../utils/api';
import Cookies from 'js-cookie';

// Simple Modal Component
const SimpleModal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '500px',
                margin: '20px',
                position: 'relative'
            }}>
                {children}
            </div>
        </div>
    );
};

// Create Task Form Component
const CreateTaskForm = ({ onClose, onSubmit, users }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        deadline: '',
        priority: 'medium'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            title: '',
            description: '',
            assignedTo: '',
            deadline: '',
            priority: 'medium'
        });
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create New Task</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <FiXCircle size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px'
                        }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px'
                        }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Assign To</label>
                    <select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px'
                        }}
                        required
                    >
                        <option value="">Select Employee</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Deadline</label>
                    <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px'
                        }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Priority</label>
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px'
                        }}
                        required
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Create Task
                    </button>
                </div>
            </form>
        </>
    );
};

const TaskManagement = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dueDate: ''
    });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedTo: '',
        deadline: '',
        priority: 'medium'
    });

    // Get user data
    const getUserData = () => {
        try {
            return JSON.parse(localStorage.getItem('userData') || Cookies.get('userData') || '{}');
        } catch (err) {
            console.error('Error getting user data:', err);
            return {};
        }
    };

    // Fetch all tasks
    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError('');
            
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.priority) queryParams.append('priority', filters.priority);
            if (filters.dueDate) queryParams.append('dueDate', filters.dueDate);

            const response = await authenticatedFetch(`/task?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch tasks: ${response.status}`);
            }

            const data = await parseJsonResponse(response);
            setTasks(Array.isArray(data) ? data : (data.tasks || []));
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    // Fetch users using existing fetchEmployees function
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await fetchEmployees();
                if (response.success) {
                    setUsers(response.data);
                } else {
                    setError('Failed to load users');
                }
            } catch (err) {
                console.error('Error loading users:', err);
                setError('Failed to load users');
            }
        };

        loadUsers();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [searchQuery, filters]);

    const handleCreateTask = async (taskData) => {
        try {
            const userData = getUserData();
            
            const result = await createTask({
                ...taskData,
                status: 'pending',
                createdBy: userData._id
            });
            
            if (result.success) {
                setTasks(prev => [...prev, result.data]);
                setShowCreateModal(false);
            } else {
                throw new Error(result.message || 'Failed to create task');
            }
        } catch (err) {
            console.error('Error creating task:', err);
            setError(err.message || 'Failed to create task');
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            setError('');
            const response = await authenticatedFetch(`/task/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error(`Failed to update task: ${response.status}`);
            }

            await fetchTasks(); // Refresh the task list
        } catch (err) {
            console.error('Error updating task:', err);
            setError(err.message || 'Failed to update task status');
        }
    };

    const TaskCard = ({ task }) => {
        const assignedUser = users.find(u => u._id === task.assignedTo);
        const createdByUser = users.find(u => u._id === task.createdBy);

        return (
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                                {task.priority}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                                {task.status}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>

                    {/* Task Details */}
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                            <FiUser className="mr-2 h-4 w-4" />
                            <span>Assigned to: {assignedUser?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <FiCalendar className="mr-2 h-4 w-4" />
                            <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <FiUser className="mr-2 h-4 w-4" />
                            <span>Created by: {createdByUser?.name || 'Unknown'}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleUpdateTaskStatus(task._id, 'pending')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    task.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => handleUpdateTaskStatus(task._id, 'in-progress')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    task.status === 'in-progress'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                In Progress
                            </button>
                            <button
                                onClick={() => handleUpdateTaskStatus(task._id, 'completed')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    task.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getPriorityBadgeColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Add console log to track button click
    const handleCreateButtonClick = () => {
        console.log('Create Task button clicked');
        console.log('Current showCreateModal state:', showCreateModal);
        setShowCreateModal(true);
        console.log('After setting showCreateModal to true:', true);
    };

    // Add console log to track modal visibility
    useEffect(() => {
        console.log('showCreateModal changed:', showCreateModal);
    }, [showCreateModal]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-48 bg-white rounded-xl shadow-sm"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage and track all tasks across your organization
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={handleCreateButtonClick}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filter Section */}
                <div className="mb-8 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiFilter className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiFilter className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            >
                                <option value="">All Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <FiXCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskCard key={task._id} task={task} />
                    ))}
                </div>

                {/* Empty State */}
                {!loading && tasks.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a new task.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={handleCreateButtonClick}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                                Create Task
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Replace the old modal with the new simple modal */}
            <SimpleModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
                <CreateTaskForm
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateTask}
                    users={users}
                />
            </SimpleModal>
        </div>
    );
};

export default TaskManagement; 