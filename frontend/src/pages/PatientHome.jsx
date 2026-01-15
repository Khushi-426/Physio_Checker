// frontend/src/pages/PatientHome.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Activity, CheckCircle, List, Dumbbell } from 'lucide-react';
import './PatientHome.css';

// --- MOCK DATA: ONLY BICEP CURLS ---
const MOCK_HISTORY = [
    {
        id: 1,
        exercise: "Bicep Curls",
        qualityScore: 94,
        reps: 15,
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        duration: "12 min"
    },
    {
        id: 2,
        exercise: "Bicep Curls",
        qualityScore: 88,
        reps: 12,
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        duration: "08 min"
    },
    {
        id: 3,
        exercise: "Bicep Curls",
        qualityScore: 92,
        reps: 20,
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        duration: "15 min"
    },
    {
        id: 4,
        exercise: "Bicep Curls",
        qualityScore: 78,
        reps: 10,
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
        duration: "10 min"
    },
    {
        id: 5,
        exercise: "Bicep Curls",
        qualityScore: 96,
        reps: 25,
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
        duration: "18 min"
    },
    {
        id: 6,
        exercise: "Bicep Curls",
        qualityScore: 85,
        reps: 15,
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
        duration: "12 min"
    },
    {
        id: 7,
        exercise: "Bicep Curls",
        qualityScore: 89,
        reps: 30,
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(), // 6 days ago
        duration: "10 min"
    }
];

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Hardcoded stats
    const [stats, setStats] = useState({
        avgAccuracy: 89,
        totalSessions: 22,
        totalReps: 180,
        uniqueExercises: 1, // Only 1 unique exercise type now
        recentHistory: []
    });

    useEffect(() => {
        // Simulate a "fetch" to make the UI transition feel natural
        const loadFakeData = () => {
            setTimeout(() => {
                setStats(prev => ({
                    ...prev,
                    recentHistory: MOCK_HISTORY
                }));
                setLoading(false);
            }, 800);
        };

        loadFakeData();
    }, []);

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
                        <p className="sub-title">Welcome back, {user?.name || 'Alex'}</p>
                    </div>
                    <div className="system-status">
                        <span className="pulse-icon"></span> System Online
                    </div>
                </header>

                {/* Hardcoded Stats Grid */}
                <div className="stats-grid-new">
                    <StatCard label="Avg Accuracy" value={`${stats.avgAccuracy}%`} subLabel="Target: >85%" icon={CheckCircle} color="#10B981" delay={0.1} />
                    <StatCard label="Total Sessions" value={stats.totalSessions} subLabel="Completed" icon={Activity} color="#3B82F6" delay={0.2} />
                    <StatCard label="Total Reps" value={stats.totalReps} subLabel="Cumulative" icon={Dumbbell} color="#F59E0B" delay={0.3} />
                    <StatCard label="Exercises" value={stats.uniqueExercises} subLabel="Active Protocols" icon={List} color="#8B5CF6" delay={0.4} />
                </div>

                <motion.div 
                    className="clinical-table-wrapper"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="table-header">
                        <h3>Session History</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="export-btn" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' }}>
                                <CheckCircle size={14} style={{ marginRight: '5px' }}/> All Completed
                            </button>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                            Retrieving clinical records...
                        </div>
                    ) : (
                        <table className="clinical-table">
                            <thead>
                                <tr>
                                    <th>EXERCISE PROTOCOL</th>
                                    <th>PERFORMANCE</th>
                                    <th>REPS</th>
                                    <th>DATE & TIME</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentHistory.map((sess) => (
                                    <tr key={sess.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ padding: '8px', borderRadius: '8px', background: '#F3F4F6' }}>
                                                    <Activity size={16} color="#4B5563"/>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#1F2937' }}>{sess.exercise}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Duration: {sess.duration}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="perf-bar-container" style={{ width: '80px', height: '6px' }}>
                                                    <div className="perf-bar" style={{ 
                                                        width: `${sess.qualityScore}%`, 
                                                        background: sess.qualityScore > 85 ? '#10B981' : '#F59E0B' 
                                                    }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: sess.qualityScore > 85 ? '#059669' : '#D97706' }}>
                                                    {sess.qualityScore}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#374151' }}>{sess.reps}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: '#374151', fontSize: '0.9rem', fontWeight: '500' }}>
                                                    {new Date(sess.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                                                    {new Date(sess.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 12px', borderRadius: '20px',
                                                background: '#ECFDF5', color: '#047857',
                                                fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px'
                                            }}>
                                                <CheckCircle size={12} strokeWidth={3} />
                                                COMPLETED
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </section>
        </div>
    );
};

export default PatientHome;