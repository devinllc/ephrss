import React, { useState, useEffect } from 'react';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FiX, FiUser, FiCalendar, FiTag } from 'react-icons/fi';

const TaskForm = ({ onSubmit, onClose, initialData = null, adminId = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: [],
        deadline: '',
        priority: 'medium',
        status: 'pending',
        tags: [],
        createdBy: adminId
    });

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                assignedTo: Array.isArray(initialData.assignedTo) ? initialData.assignedTo : [initialData.assignedTo],
                deadline: new Date(initialData.deadline).toISOString().split('T')[0],
                createdBy: adminId
            });
        }
        fetchEmployees();
    }, [initialData, adminId]);

    const fetchEmployees = async () => {
        try {
            const response = await authenticatedFetch('/employees/all');
            const data = await parseJsonResponse(response);
            if (data && data.data) {
                setEmployees(data.data);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Failed to load employees');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'assignedTo') {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({
                ...prev,
                [name]: selectedOptions
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleTagInputKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
                    <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10 rounded-t-lg">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {initialData ? 'Edit Task' : 'Create New Task'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FiX className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    maxLength={255}
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter task title"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter task description"
                                />
                            </div>

                            {/* Assigned To - Updated for multiple selection */}
                            <div>
                                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign To *
                                </label>
                                <div className="relative">
                                    <select
                                        id="assignedTo"
                                        name="assignedTo"
                                        required
                                        multiple
                                        value={formData.assignedTo}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                                    >
                                        {employees.map(employee => (
                                            <option key={employee._id} value={employee._id}>
                                                {employee.name} ({employee.email})
                                            </option>
                                        ))}
                                    </select>
                                    <FiUser className="absolute left-3 top-3 text-gray-400" />
                                    <div className="text-xs text-gray-500 mt-1">
                                        Hold Ctrl/Cmd to select multiple employees
                                    </div>
                                </div>
                                {formData.assignedTo.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {formData.assignedTo.map(userId => {
                                            const employee = employees.find(emp => emp._id === userId);
                                            return employee ? (
                                                <span
                                                    key={userId}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                                                >
                                                    {employee.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                assignedTo: prev.assignedTo.filter(id => id !== userId)
                                                            }));
                                                        }}
                                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        <FiX className="h-4 w-4" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Deadline */}
                            <div>
                                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                                    Deadline *
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="deadline"
                                        name="deadline"
                                        required
                                        value={formData.deadline}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <FiCalendar className="absolute left-3 top-3 text-gray-400" />
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            {/* Tags */}
                            <div>
                                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tags
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="tags"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagInputKeyDown}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Add tags (press Enter)"
                                    />
                                    <FiTag className="absolute left-3 top-3 text-gray-400" />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 text-gray-500 hover:text-gray-700"
                                            >
                                                <FiX className="h-4 w-4" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm">{error}</div>
                            )}
                        </form>
                    </div>

                    <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-4 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskForm; 