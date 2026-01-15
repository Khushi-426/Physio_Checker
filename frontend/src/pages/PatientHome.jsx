// frontend/src/pages/PatientHome.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Activity, CheckCircle, List, Dumbbell } from 'lucide-react';
import './PatientHome.css';

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Hardcoded stats state
    const [stats, setStats] = useState({
        avgAccuracy: 0,
        totalSessions: 0,
        totalReps: 0,
        uniqueExercises: 0,
        recentHistory: []
    });

    useEffect(() => {
        // Simulating data fetch with hardcoded values
        const loadHardcodedData = () => {
            const hardcodedHistory = [
                {
                    exercise: "Bicep Curls",
                    qualityScore: 95,
                    reps: 15,
                    dateLabel: "Today",
                    timeLabel: "2:24 PM",
                    status: "NEW",
                    isNew: true
                },
                {
                    exercise: "Squats",
                    qualityScore: 88,
                    reps: 20,
                    dateLabel: "Jan 14, 2026",
                    status: "DONE"
                },
                {
                    exercise: "Bicep Curls",
                    qualityScore: 72,
                    reps: 12,
                    dateLabel: "Jan 12, 2026",
                    status: "DONE"
                },
                {
                    exercise: "Squats",
                    qualityScore: 91,
                    reps: 18,
                    dateLabel: "Jan 10, 2026",
                    status: "DONE"
                },
                {
                    exercise: "Bicep Curls",
                    qualityScore: 85,
                    reps: 15,
                    dateLabel: "Jan 08, 2026",
                    status: "DONE"
                },
                 {
                    exercise: "Squats",
                    qualityScore: 78,
                    reps: 25,
                    dateLabel: "Jan 05, 2026",
                    status: "DONE"
                },
                {
                    exercise: "Bicep Curls",
                    qualityScore: 65,
                    reps: 40,
                    dateLabel: "Jan 01, 2026",
                    status: "DONE"
                }
            ];

            // Set the stats as requested
            setStats({
                avgAccuracy: 82, // Random average based on the data roughly
                totalSessions: 22, // Hardcoded as requested
                totalReps: 145,    // Hardcoded as requested
                uniqueExercises: 2, // Hardcoded as requested
                recentHistory: hardcodedHistory
            });
            
            setLoading(false);
        };

        loadHardcodedData();
    }, [user]);

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
                    <StatCard label="Total Sets" value={stats.totalSessions} subLabel="Completed" icon={Activity} color="#3B82F6" delay={0.2} />
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
                                {stats.recentHistory.map((sess, idx) => (
                                    <tr key={idx} className={sess.isNew ? 'row-new' : ''}>
                                        <td style={{ fontWeight: '600' }}>
                                            {sess.exercise}
                                        </td>
                                        <td>
                                            <div className="perf-bar-container">
                                                <div className="perf-bar" style={{ 
                                                    width: `${sess.qualityScore}%`, 
                                                    background: sess.qualityScore > 80 ? '#10B981' : '#F59E0B' 
                                                }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', marginLeft: '8px' }}>
                                                {sess.qualityScore}%
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '500' }}>{sess.reps}</td>
                                        <td style={{ color: '#718096', fontSize: '0.9rem' }}>
                                            {sess.dateLabel}
                                            {sess.timeLabel && <span style={{display:'block', fontSize:'0.75rem', color:'#999'}}>{sess.timeLabel}</span>}
                                        </td>
                                        <td>
                                            <span 
                                                className="status-pill"
                                                style={{
                                                    background: sess.isNew ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                    color: sess.isNew ? '#3B82F6' : '#10B981',
                                                    border: `1px solid ${sess.isNew ? '#3B82F6' : '#10B981'}`,
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                {sess.status}
                                            </span>
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