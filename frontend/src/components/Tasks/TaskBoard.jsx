import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle, Clock, Circle, PlusCircle } from 'lucide-react';
import { api } from '../../api';
import './TaskBoard.css';

const TaskBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({
        title: '',
        priority: 'medium',
        targetType: 'none',
        targetValue: ''
    });
    const [editingTask, setEditingTask] = useState(null);
    const [isAddingTask, setIsAddingTask] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const data = await api.get('/task');
        if (data) setTasks(data);
    };

    const addTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        const payload = {
            ...newTask,
            status: 'todo',
            dueDate: new Date().toISOString().split('T')[0]
        };

        const result = await api.post('/task', payload);
        if (result) {
            setTasks([...tasks, result]);
            setNewTask({
                title: '',
                priority: 'medium',
                targetType: 'none',
                targetValue: ''
            });
            setIsAddingTask(false);
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask.title.trim()) return;
        const result = await api.put(`/task/${editingTask._id}`, editingTask);
        if (result) {
            setTasks(tasks.map(t => t._id === editingTask._id ? result : t));
            setEditingTask(null);
        }
    };

    const updateStatus = async (id, newStatus) => {
        const result = await api.put(`/task/${id}`, { status: newStatus });
        if (result) {
            setTasks(tasks.map(t => t._id === id ? result : t));
        }
    };

    const deleteTask = async (id) => {
        const result = await api.delete(`/task/${id}`);
        if (result) {
            setTasks(tasks.filter(t => t._id !== id));
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'done': return <CheckCircle className="icon done" size={18} />;
            case 'in-progress': return <Clock className="icon progress" size={18} />;
            default: return <Circle className="icon todo" size={18} />;
        }
    };

    return (
        <div className="task-board">
            <header className="board-header">
                <div className="header-left">
                    <h2>Daily Tasks</h2>
                    <p className="task-count-subtitle">{tasks.length} active tasks</p>
                </div>
                <button className="add-task-trigger-btn" onClick={() => setIsAddingTask(true)}>
                    <Plus size={18} />
                    New Task
                </button>
            </header>

            <div className="task-columns">
                {['todo', 'in-progress', 'done'].map((status) => (
                    <div key={status} className={`task-column ${status}`}>
                        <h3>{status.replace('-', ' ').toUpperCase()}</h3>
                        <div className="task-list">
                            {tasks.filter(t => t.status === status).map(task => (
                                <div className="task-card" onClick={() => setEditingTask({ ...task })}>
                                    <div className="task-header">
                                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteTask(task._id); }} className="delete-btn"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="task-content">
                                        <p>{task.title}</p>
                                        {task.targetType !== 'none' && (
                                            <div className="task-target-badge">
                                                {task.targetType === 'time' ? <Clock size={12} /> : <PlusCircle size={12} />}
                                                <span>{task.targetValue}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="task-footer">
                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                        <div className="status-actions">
                                            {status !== 'todo' && <button onClick={(e) => { e.stopPropagation(); updateStatus(task._id, 'todo'); }} title="Move to Todo"><Circle size={14} /></button>}
                                            {status !== 'in-progress' && <button onClick={(e) => { e.stopPropagation(); updateStatus(task._id, 'in-progress'); }} title="Move to In Progress"><Clock size={14} /></button>}
                                            {status !== 'done' && <button onClick={(e) => { e.stopPropagation(); updateStatus(task._id, 'done'); }} title="Mark Done"><CheckCircle size={14} /></button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Task Modal */}
            <AnimatePresence>
                {editingTask && (
                    <div className="modal-overlay" onClick={() => setEditingTask(null)}>
                        <div className="task-modal" onClick={e => e.stopPropagation()}>
                            <header className="modal-header">
                                <h3>Edit Task</h3>
                                <button className="close-btn" onClick={() => setEditingTask(null)}>×</button>
                            </header>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Task Title</label>
                                    <input
                                        type="text"
                                        value={editingTask.title}
                                        onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Priority</label>
                                        <select
                                            value={editingTask.priority}
                                            onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={editingTask.status}
                                            onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}
                                        >
                                            <option value="todo">Todo</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Target Type</label>
                                        <select
                                            value={editingTask.targetType}
                                            onChange={e => setEditingTask({ ...editingTask, targetType: e.target.value })}
                                        >
                                            <option value="none">None</option>
                                            <option value="time">Time</option>
                                            <option value="count">Count</option>
                                        </select>
                                    </div>
                                    {editingTask.targetType !== 'none' && (
                                        <div className="form-group">
                                            <label>Target Value</label>
                                            <input
                                                type="text"
                                                value={editingTask.targetValue}
                                                onChange={e => setEditingTask({ ...editingTask, targetValue: e.target.value })}
                                                placeholder="e.g. 5h or 20 items"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <footer className="modal-footer">
                                <button className="cancel-btn" onClick={() => setEditingTask(null)}>Cancel</button>
                                <button className="save-btn" onClick={handleUpdateTask}>Save Changes</button>
                            </footer>
                        </div>
                    </div>
                )}

                {/* Add Task Modal */}
                {isAddingTask && (
                    <div className="modal-overlay" onClick={() => setIsAddingTask(false)}>
                        <motion.div
                            className="task-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <header className="modal-header">
                                <h3>Create New Task</h3>
                                <button className="close-btn" onClick={() => setIsAddingTask(false)}>×</button>
                            </header>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Task Title</label>
                                    <input
                                        type="text"
                                        placeholder="What needs to be done?"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Target Type</label>
                                        <select
                                            value={newTask.targetType}
                                            onChange={e => setNewTask({ ...newTask, targetType: e.target.value })}
                                        >
                                            <option value="none">None</option>
                                            <option value="time">Time Goal</option>
                                            <option value="count">Count Goal</option>
                                        </select>
                                    </div>
                                </div>
                                {newTask.targetType !== 'none' && (
                                    <div className="form-group">
                                        <label>Target Value</label>
                                        <input
                                            type="text"
                                            placeholder={newTask.targetType === 'time' ? "e.g. 2h or 45m" : "e.g. 10 problems or 5 pages"}
                                            value={newTask.targetValue}
                                            onChange={e => setNewTask({ ...newTask, targetValue: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                            <footer className="modal-footer">
                                <button className="cancel-btn" onClick={() => setIsAddingTask(false)}>Cancel</button>
                                <button className="save-btn" onClick={addTask}>Create Task</button>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskBoard;
