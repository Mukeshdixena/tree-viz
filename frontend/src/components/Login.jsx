import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const baseUrl = 'http://localhost:3001';

        try {
            const response = await axios.post(`${baseUrl}${endpoint}`, { username, password });

            if (isLogin) {
                localStorage.setItem('token', response.data.access_token);
                navigate('/');
            } else {
                setIsLogin(true);
                setError('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-bg-grid"></div>
            <div className="login-blob-1"></div>
            <div className="login-blob-2"></div>

            <div className="login-card-wrapper">
                <div className="login-card">
                    <div className="login-card-top-line"></div>

                    <div className="login-header">
                        <div className="login-icon-box">
                            <Lock size={32} />
                        </div>
                        <h2 className="login-title">
                            {isLogin ? 'Sign In' : 'Join Us'}
                        </h2>
                        <p className="login-subtitle">
                            {isLogin ? 'Access your roadmaps' : 'Start building your future'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <div className="input-wrapper">
                                <div className="input-icon">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="off"
                                    className="login-input"
                                    placeholder="Your username"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-wrapper">
                                <div className="input-icon">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="login-input"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className={error.includes('successful') ? 'login-success' : 'login-error'}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-btn"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
                        </button>
                    </form>

                    <div className="toggle-auth-box">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="toggle-auth-btn"
                        >
                            {isLogin ? "DON'T HAVE AN ACCOUNT? SIGN UP" : 'ALREADY HAVE AN ACCOUNT? SIGN IN'}
                        </button>
                    </div>
                </div>
            </div>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                `}
            </style>
        </div>
    );
};

export default Login;
