// frontend/src/pages/PatientHome.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Play, Activity, CheckCircle, List, Dumbbell } from 'lucide-react';
import './PatientHome.css';

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    const [stats, setStats] = useState({
        avgAccuracy: 0,
        totalSessions: 0,
        totalReps: 0,
        uniqueExercises: 0,
        recentHistory: []
    });

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // 1. Get Token Robustly (Check Context first, then LocalStorage)
                let token = user?.token;

                if (!token) {
                    const storedData = localStorage.getItem('physio_user');
                    if (storedData) {
                        const parsed = JSON.parse(storedData);
                        token = parsed.token;
                    }
                }

                if (!token) {
                    console.warn("No auth token found, skipping fetch.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch Data with Correct Headers
                const res = await axios.get('http://localhost:5000/api/sessions/my-history', {
                     headers: { 
                        'Authorization': `Bearer ${token}` // Fixed Header Format
                     }
                });
                
                const history = res.data || [];
                
                if (history.length > 0) {
                    const totalScore = history.reduce((acc, sess) => acc + (sess.qualityScore || 0), 0);
                    const avgScore = Math.round(totalScore / history.length);
                    const totalReps = history.reduce((acc, sess) => acc + (sess.reps || 0), 0);
                    
                    // Count unique exercises safely
                    const uniqueEx = new Set(
                        history.map(s => 
                            s.protocol?.exerciseName || 
                            s.exercise || 
                            'Unknown'
                        )
                    ).size;

                    setStats({
                        avgAccuracy: avgScore,
                        totalSessions: history.length,
                        totalReps: totalReps,
                        uniqueExercises: uniqueEx,
                        recentHistory: history
                    });
                }
            } catch (err) {
                console.error("Failed to fetch session history:", err.message);
                if (err.response && err.response.status === 401) {
                    // Optional: Redirect to login if token is invalid
                    // navigate('/auth/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]); // Re-run if user context changes

    const StatCard = ({ label, value, subLabel, icon: Icon, color, delay }) => (
        <motion.div 
            className="stat-card-new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay }}
        >
            <div className="stat-icon-box" style={{ background: `${color}15`, color: color }}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <span className="stat-label">{label}</span>
                <h3 className="stat-value">{value}</h3>
                {subLabel && <span className="stat-sub">{subLabel}</span>}
            </div>
        </motion.div>
    );

    return (
        <div className="patient-dashboard-container">
            <section className="left-panel">
                <div className="hologram-wrapper">
                    <img src="/human.png" alt="Biometric Scan" className="human-model" />
                    <div className="scan-line"></div>
                    <div className="joint-marker shoulder-l"></div>
                    <div className="joint-marker knee-r"></div>
                    
                    <div className="model-status">
                        <div className="status-dot"></div>
                        <span>LIVE TRACKING ACTIVE</span>
                    </div>

                    <button className="start-session-btn" onClick={() => navigate('/track')}>
                        <Play size={20} fill="currentColor" /> 
                        <span>START THERAPY</span>
                    </button>
                </div>
            </section>

            <section className="right-panel">
                <header className="dashboard-header">
                    <div>
                        <h1 className="main-title">PhysioCheck Dashboard</h1>
                        <p className="sub-title">Welcome back, {user?.name || 'Patient'}</p>
                    </div>
                    <div className="system-status">
                        <span className="pulse-icon"></span> System Online
                    </div>
                </header>

                <div className="stats-grid-new">
                    <StatCard label="Avg Accuracy" value={`${stats.avgAccuracy}%`} subLabel="Target: >80%" icon={CheckCircle} color="#10B981" delay={0.1} />
                    <StatCard label="Total Sessions" value={stats.totalSessions} subLabel="Completed" icon={Activity} color="#3B82F6" delay={0.2} />
                    <StatCard label="Total Reps" value={stats.totalReps} subLabel="Reps Count" icon={Dumbbell} color="#F59E0B" delay={0.3} />
                    <StatCard label="Exercises" value={stats.uniqueExercises} subLabel="Active Routines" icon={List} color="#8B5CF6" delay={0.4} />
                </div>

                <motion.div 
                    className="clinical-table-wrapper"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="table-header">
                        <h3>Session History</h3>
                        <button className="export-btn">Export Data</button>
                    </div>
                    
                    {loading ? (
                        <div style={{ padding: '20px', color: '#888' }}>Loading...</div>
                    ) : (
                        <table className="clinical-table">
                            <thead>
                                <tr>
                                    <th>EXERCISE</th>
                                    <th>ACCURACY</th>
                                    <th>REPS</th>
                                    <th>DATE</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentHistory.length > 0 ? (
                                    stats.recentHistory.map((sess, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '600' }}>
                                                {sess.protocol?.exerciseName || sess.exercise || "General Workout"}
                                            </td>
                                            <td>
                                                <div className="perf-bar-container">
                                                    <div className="perf-bar" style={{ 
                                                        width: `${sess.qualityScore || 0}%`, 
                                                        background: (sess.qualityScore || 0) > 80 ? '#10B981' : '#F59E0B' 
                                                    }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', marginLeft: '8px' }}>
                                                    {sess.qualityScore || 0}%
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: '500' }}>{sess.reps || 0}</td>
                                            <td style={{ color: '#718096', fontSize: '0.9rem' }}>
                                                {new Date(sess.performedAt || sess.timestamp * 1000 || Date.now()).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${(sess.qualityScore || 0) > 80 ? 'optimal' : 'check'}`}>
                                                    {(sess.qualityScore || 0) > 80 ? 'OPTIMAL' : 'REVIEW'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                            No sessions recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </section>
        </div>
    );
};

export default PatientHome;