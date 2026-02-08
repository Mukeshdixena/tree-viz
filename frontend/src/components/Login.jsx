import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';

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
        <div className="login-page-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Background Decorations */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(#1e293b 1px, transparent 0)',
                backgroundSize: '40px 40px',
                opacity: 0.2,
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '40%',
                height: '40%',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                filter: 'blur(120px)',
                borderRadius: '50%',
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '40%',
                height: '40%',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                filter: 'blur(120px)',
                borderRadius: '50%',
                zIndex: 0
            }}></div>

            <div style={{
                maxWidth: '440px',
                width: '100%',
                zIndex: 10,
                padding: '24px'
            }}>
                <div style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 0 50px -12px rgba(0,0,0,0.5)',
                    padding: '48px',
                    border: '1px solid #1e293b',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
                    }}></div>

                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '64px',
                            height: '64px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '16px',
                            marginBottom: '24px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                            <Lock style={{ color: '#3b82f6', width: '32px', height: '32px' }} />
                        </div>
                        <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.025em', color: 'white', marginBottom: '8px' }}>
                            {isLogin ? 'Sign In' : 'Join Us'}
                        </h2>
                        <p style={{ color: '#94a3b8', fontWeight: 500 }}>
                            {isLogin ? 'Access your roadmaps' : 'Start building your future'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>Username</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', insetY: 0, left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#475569' }}>
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="off"
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(2, 6, 23, 0.5)',
                                        border: '1px solid rgba(30, 41, 59, 0.5)',
                                        borderRadius: '12px',
                                        padding: '16px 16px 16px 48px',
                                        color: 'white',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        fontSize: '15px'
                                    }}
                                    placeholder="Your username"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(30, 41, 59, 0.5)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', insetY: 0, left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#475569' }}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(2, 6, 23, 0.5)',
                                        border: '1px solid rgba(30, 41, 59, 0.5)',
                                        borderRadius: '12px',
                                        padding: '16px 16px 16px 48px',
                                        color: 'white',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        fontSize: '15px'
                                    }}
                                    placeholder="••••••••"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(30, 41, 59, 0.5)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '16px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 500,
                                backgroundColor: error.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                color: error.includes('successful') ? '#10b981' : '#f43f5e',
                                border: `1px solid ${error.includes('successful') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: 700,
                                padding: '16px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                opacity: loading ? 0.7 : 1,
                                fontSize: '14px',
                                letterSpacing: '0.05em'
                            }}
                            onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = '#1d4ed8'; }}
                            onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = '#2563eb'; }}
                        >
                            {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={20} /> : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
                        </button>
                    </form>

                    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #1e293b', textAlign: 'center' }}>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                transition: 'color 0.2s',
                                letterSpacing: '0.05em'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#3b82f6'}
                            onMouseOut={(e) => e.target.style.color = '#64748b'}
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
                `}
            </style>
        </div>
    );
};

export default Login;
