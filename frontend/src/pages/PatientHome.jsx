import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Activity, CheckCircle, Dumbbell, History } from 'lucide-react';
import './PatientHome.css';

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        avgAccuracy: 0,
        totalSessions: 0,
        totalReps: 0
    });

    useEffect(() => {
        const fetchSessionHistory = async () => {
            if (!user?.email) return;
            try {
                const response = await fetch(`http://localhost:5001/api/sessions/my-history?email=${user.email}`);
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                    // Calculate totals
                    const totalReps = data.reduce((acc, curr) => acc + (curr.reps || 0), 0);
                    const avgAcc = data.length > 0 
                        ? Math.round(data.reduce((acc, curr) => acc + (curr.qualityScore || 0), 0) / data.length) 
                        : 0;
                    setStats({
                        avgAccuracy: avgAcc,
                        totalSessions: data.length,
                        totalReps: totalReps
                    });
                }
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessionHistory();
    }, [user]);

    const StatCard = ({ label, value, subLabel, icon: Icon, color, delay }) => (
        <motion.div 
            className="stat-card-new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay }}
        >
            <div className="stat-icon-box" style={{ background: `${color}15`, color: color }}>
                <Icon size={22} />
            </div>
            <div className="stat-info">
                <span className="stat-label">{label}</span>
                <h3 className="stat-value">{value}</h3>
                <span className="stat-sub" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{subLabel}</span>
            </div>
        </motion.div>
    );

    return (
        <div className="patient-dashboard-container">
            <section className="left-panel">
                <div className="hologram-wrapper">
                    <img src="/human.png" alt="Biometric Scan" className="human-model" />
                    <div className="scan-line"></div>
                    <div className="model-status">
                        <div className="status-dot"></div>
                        <span>LIVE BIOMETRICS ACTIVE</span>
                    </div>
                    <button className="start-session-btn" onClick={() => navigate('/track')}>
                        <Play size={18} fill="white" /> <span>START NEW SESSION</span>
                    </button>
                </div>
            </section>

            <section className="right-panel">
                <header className="dashboard-header">
                    <div>
                        <h1 className="main-title">Recovery Analytics</h1>
                        <p className="sub-title">Patient Portal • {user?.name || 'Alex'}</p>
                    </div>
                    <div className="system-status" style={{ color: '#10B981', fontWeight: '700', fontSize: '0.8rem' }}>
                        ● DATABASE SYNCED
                    </div>
                </header>

                <div className="stats-grid-new">
                    <StatCard label="Avg. Accuracy" value={`${stats.avgAccuracy}%`} subLabel="Target: 85%" icon={CheckCircle} color="#10B981" delay={0.1} />
                    <StatCard label="Total Workouts" value={stats.totalSessions} subLabel="Sessions Saved" icon={Activity} color="#3B82F6" delay={0.2} />
                    <StatCard label="Total Reps" value={stats.totalReps} subLabel="Lifetime Progress" icon={Dumbbell} color="#F59E0B" delay={0.3} />
                </div>

                <motion.div 
                    className="clinical-table-wrapper"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <History size={20} color="#2C5D31" />
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1A3C34' }}>Session History</h3>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Syncing data...</div>
                    ) : history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No activity found.</div>
                    ) : (
                        <table className="clinical-table">
                            <thead>
                                <tr>
                                    <th>Exercise Protocol</th>
                                    <th>Performance</th>
                                    <th>Reps</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((sess) => (
                                    <tr key={sess._id}>
                                        <td>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{sess.exerciseType}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {sess.duration ? `${Math.floor(sess.duration / 60)}m ${Math.round(sess.duration % 60)}s` : 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="perf-bar-container" style={{ width: '80px', height: '6px' }}>
                                                    <div style={{ width: `${sess.qualityScore}%`, height: '100%', background: sess.qualityScore > 85 ? '#10B981' : '#F59E0B' }}></div>
                                                </div>
                                                <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{sess.qualityScore}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '700' }}>{sess.reps}</td>
                                        <td>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{new Date(sess.performedAt).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(sess.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td>
                                            <span style={{ background: '#ecfdf5', color: '#047857', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' }}>SYNCED</span>
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