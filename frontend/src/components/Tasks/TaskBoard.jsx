import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, Circle } from 'lucide-react';
import { api } from '../../api';
import './TaskBoard.css';

const TaskBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const data = await api.get('/task');
        if (data) setTasks(data);
    };

    const addTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const payload = {
            title: newTask,
            status: 'todo',
            priority: 'medium',
            dueDate: new Date().toISOString().split('T')[0]
        };

        const result = await api.post('/task', payload);
        if (result) {
            setTasks([...tasks, result]);
            setNewTask('');
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
                <h2>Daily Tasks</h2>
                <form onSubmit={addTask} className="add-task-form">
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                    <button type="submit"><Plus size={20} /></button>
                </form>
            </header>

            <div className="task-columns">
                {['todo', 'in-progress', 'done'].map((status) => (
                    <div key={status} className={`task-column ${status}`}>
                        <h3>{status.replace('-', ' ').toUpperCase()}</h3>
                        <div className="task-list">
                            {tasks.filter(t => t.status === status).map(task => (
                                <div key={task._id} className="task-card">
                                    <div className="task-header">
                                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                                        <button onClick={() => deleteTask(task._id)} className="delete-btn"><Trash2 size={14} /></button>
                                    </div>
                                    <p>{task.title}</p>
                                    <div className="task-footer">
                                        <span>{task.dueDate}</span>
                                        <div className="status-actions">
                                            {status !== 'todo' && <button onClick={() => updateStatus(task._id, 'todo')} title="Move to Todo"><Circle size={14} /></button>}
                                            {status !== 'in-progress' && <button onClick={() => updateStatus(task._id, 'in-progress')} title="Move to In Progress"><Clock size={14} /></button>}
                                            {status !== 'done' && <button onClick={() => updateStatus(task._id, 'done')} title="Mark Done"><CheckCircle size={14} /></button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskBoard;
