import React, { useState, useEffect } from 'react';
import { FiSend, FiUser, FiClock } from 'react-icons/fi';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';

const TaskComments = ({ taskId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await authenticatedFetch(`/task/${taskId}/comments`);
            const data = await parseJsonResponse(res);
            setComments(data?.data || []);
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    useEffect(() => {
        if (taskId) fetchComments();
    }, [taskId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        setLoading(true);
        try {
            const res = await authenticatedFetch(`/task/${taskId}/comment`, {
                method: 'POST',
                body: JSON.stringify({ text: newComment })
            });
            if (res.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (err) {
            console.error('Error posting comment:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Comments</h4>
            
            <div className="space-y-3 max-h-40 overflow-y-auto mb-4 pr-2 custom-scrollbar">
                {comments.length > 0 ? comments.map((c, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                                <FiUser className="text-[10px]" /> {c.authorName || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-600">{c.text}</p>
                    </div>
                )) : (
                    <p className="text-[10px] text-slate-400 italic">No comments yet.</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-slate-100 border-none rounded-full px-4 py-2 text-xs focus:ring-1 ring-indigo-500 pr-10"
                />
                <button 
                    disabled={loading}
                    type="submit" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                    <FiSend size={14} />
                </button>
            </form>
        </div>
    );
};

export default TaskComments;
