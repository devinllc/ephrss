import React, { useState, useEffect } from 'react';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { FiX, FiUser, FiCalendar, FiTag } from 'react-icons/fi';
import { motion } from 'framer-motion';

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
        // eslint-disable-next-line
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
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto flex flex-col"
                initial={{ scale: 0.98, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-blue-500 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
                >
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            maxLength={255}
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-800"
                            placeholder="Enter task title"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-800"
                            placeholder="Enter task description"
                        />
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label htmlFor="assignedTo" className="block text-sm font-semibold text-gray-700 mb-1">
                            Assign To <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="assignedTo"
                                name="assignedTo"
                                required
                                multiple
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-all text-gray-800"
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
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 border border-indigo-200"
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
                                                className="ml-2 text-indigo-400 hover:text-indigo-700"
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
                        <label htmlFor="deadline" className="block text-sm font-semibold text-gray-700 mb-1">
                            Deadline <span className="text-red-500">*</span>
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-800"
                            />
                            <FiCalendar className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-1">
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-800"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-1">
                            Tags
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagInputKeyDown}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-800"
                                placeholder="Add tags (press Enter)"
                            />
                            <FiTag className="absolute left-3 top-3 text-gray-400" />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="ml-2 text-indigo-400 hover:text-indigo-700"
                                    >
                                        <FiX className="h-4 w-4" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            className="text-red-600 text-sm bg-red-50 border-l-4 border-red-400 px-3 py-2 rounded"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </form>

                {/* Footer Buttons */}
                <div className="flex justify-end px-6 py-4 border-t bg-gray-50 rounded-b-2xl gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow transition disabled:opacity-70"
                    >
                        {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TaskForm;
