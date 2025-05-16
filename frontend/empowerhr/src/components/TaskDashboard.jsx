import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FiClock, FiAlertCircle, FiCheckCircle, FiPlus, FiCalendar, FiUser } from 'react-icons/fi';
import TaskForm from './TaskForm';
import Cookies from 'js-cookie';

const TaskDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        assignedTasks: [],
        createdTasks: [],
        overdueTasks: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const navigate = useNavigate();

    // Get user ID from stored user data
    const getUserId = () => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || Cookies.get('userData') || '{}');
            return userData._id || userData.id;
        } catch (err) {
            console.error('Error getting user ID:', err);
            return null;
        }
    };

    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            fetchDashboardData(userId);
        } else {
            setError('User ID not found. Please log in again.');
            setLoading(false);
        }
    }, []);

    const fetchDashboardData = async (userId) => {
        try {
            setLoading(true);
            const response = await authenticatedFetch(`/task/user/${userId}/dashboard`);
            const data = await parseJsonResponse(response);
            
            if (data) {
                setDashboardData({
                    assignedTasks: data.assignedTasks || [],
                    createdTasks: data.createdTasks || [],
                    overdueTasks: data.overdueTasks || []
                });
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
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

    const TaskCard = ({ task }) => (
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{task.title}</h3>
                <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                    </span>
                </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    <div className="flex items-center">
                        <FiCalendar className="mr-1" />
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(task.assignedTo) ? (
                        task.assignedTo.map(assignee => (
                            <span key={assignee._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                <FiUser className="mr-1" />
                                {assignee.name}
                            </span>
                        ))
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            <FiUser className="mr-1" />
                            {task.assignedTo?.name || 'Unassigned'}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                        Created by: {task.createdBy?.name || 'Unknown'}
                    </span>
                    <button
                        onClick={() => navigate(`/tasks/${task._id}`)}
                        className="text-primary hover:text-primary-dark"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );

    const handleCreateTask = async (taskData) => {
        try {
            const response = await authenticatedFetch('/task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                // Refresh dashboard data
                fetchDashboardData();
                setShowCreateModal(false);
            } else {
                throw new Error('Failed to create task');
            }
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Failed to create task');
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                {[1, 2, 3].map((n) => (
                    <div key={n} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 text-center py-4">
                <FiAlertCircle className="inline-block mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Assigned Tasks */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <FiClock className="mr-2" />
                        Assigned Tasks
                    </h2>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="text-primary hover:text-primary-dark text-sm"
                    >
                        View All
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.assignedTasks.slice(0, 3).map(task => (
                        <TaskCard key={task._id} task={task} />
                    ))}
                    {dashboardData.assignedTasks.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            No tasks assigned to you
                        </div>
                    )}
                </div>
            </div>

            {/* Created Tasks */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <FiCheckCircle className="mr-2" />
                        Created Tasks
                    </h2>
                    <button
                        onClick={() => navigate('/tasks?filter=created')}
                        className="text-primary hover:text-primary-dark text-sm"
                    >
                        View All
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.createdTasks.slice(0, 3).map(task => (
                        <TaskCard key={task._id} task={task} />
                    ))}
                    {dashboardData.createdTasks.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            You haven't created any tasks
                        </div>
                    )}
                </div>
            </div>

            {/* Overdue Tasks */}
            {dashboardData.overdueTasks.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-red-800 flex items-center">
                            <FiAlertCircle className="mr-2" />
                            Overdue Tasks
                        </h2>
                        <button
                            onClick={() => navigate('/tasks?filter=overdue')}
                            className="text-primary hover:text-primary-dark text-sm"
                        >
                            View All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.overdueTasks.slice(0, 3).map(task => (
                            <TaskCard key={task._id} task={task} />
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                    <FiPlus className="mr-2" />
                    Create New Task
                </button>
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

export default TaskDashboard; 