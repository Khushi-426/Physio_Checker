// frontend/src/pages/PatientHome.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Play, Activity, CheckCircle, Dumbbell, History, 
    AlertCircle, RefreshCw, Calendar 
} from 'lucide-react';
import './PatientHome.css';

// Use environment variable or fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        avgAccuracy: 0,
        totalSessions: 0,
        totalReps: 0
    });

    const fetchSessionHistory = useCallback(async () => {
        if (!user?.email) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_URL}/api/sessions/my-history?email=${user.email}`);
            
            if (!response.ok) {
                throw new Error("Failed to sync session data.");
            }

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
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Could not load your recovery analytics. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSessionHistory();
    }, [fetchSessionHistory]);

    // --- SUB-COMPONENTS ---

    const StatCard = ({ label, value, subLabel, icon: Icon, color, delay }) => (
        <motion.div 
            className="stat-card-new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay }}
            whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(0,0,0,0.06)" }}
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

    const LoadingSkeleton = () => (
        <div className="animate-pulse">
            <div className="stats-grid-new" style={{ marginBottom: '2rem' }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{ height: '120px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px' }}></div>
                ))}
            </div>
            <div style={{ height: '400px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px' }}></div>
        </div>
    );

    const ErrorState = () => (
        <div style={{ 
            textAlign: 'center', padding: '3rem', background: '#FEF2F2', 
            borderRadius: '16px', border: '1px solid #FECACA', color: '#991B1B' 
        }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Sync Error</h3>
            <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>{error}</p>
            <button 
                onClick={fetchSessionHistory}
                style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', background: '#fff', border: '1px solid #FECACA',
                    borderRadius: '8px', color: '#991B1B', fontWeight: '600', cursor: 'pointer'
                }}
            >
                <RefreshCw size={16} /> Retry Connection
            </button>
        </div>
    );

    const EmptyState = () => (
        <div style={{ 
            textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.5)', 
            borderRadius: '16px', border: '2px dashed #E2E8F0', color: '#64748B' 
        }}>
            <div style={{ 
                width: '64px', height: '64px', background: '#F1F5F9', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' 
            }}>
                <Calendar size={32} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1E293B' }}>No Sessions Yet</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto 2rem', fontSize: '0.95rem' }}>
                Your recovery journey begins with a single step. Start your first AI-guided exercise session now.
            </p>
            <button 
                onClick={() => navigate('/track')}
                style={{ 
                    padding: '12px 24px', background: '#2C5D31', color: 'white', 
                    border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(44, 93, 49, 0.2)'
                }}
            >
                Start First Session
            </button>
        </div>
    );

    // --- MAIN RENDER ---

    return (
        <div className="patient-dashboard-container">
            <section className="left-panel">
                <div className="hologram-wrapper">
                    {/* Ensure 'human.png' is in your public folder */}
                    <img src="/human.png" alt="Biometric Scan" className="human-model" />
                    
                    {/* Scan line removed as requested */}
                    
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
                        <p className="sub-title">Patient Portal • {user?.name || 'Guest'}</p>
                    </div>
                    <div className="system-status" style={{ 
                        color: loading ? '#F59E0B' : error ? '#EF4444' : '#10B981', 
                        fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></div>
                        {loading ? 'SYNCING DATABASE...' : error ? 'OFFLINE' : 'DATABASE SYNCED'}
                    </div>
                </header>

                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <ErrorState />
                ) : (
                    <>
                        <div className="stats-grid-new">
                            <StatCard 
                                label="Avg. Accuracy" 
                                value={`${stats.avgAccuracy}%`} 
                                subLabel="Target: >85%" 
                                icon={CheckCircle} 
                                color="#10B981" 
                                delay={0.1} 
                            />
                            <StatCard 
                                label="Total Workouts" 
                                value={stats.totalSessions} 
                                subLabel="Sessions Completed" 
                                icon={Activity} 
                                color="#3B82F6" 
                                delay={0.2} 
                            />
                            <StatCard 
                                label="Total Reps" 
                                value={stats.totalReps} 
                                subLabel="Lifetime Repetitions" 
                                icon={Dumbbell} 
                                color="#F59E0B" 
                                delay={0.3} 
                            />
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

                            {history.length === 0 ? (
                                <EmptyState />
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
                                                        <div className="perf-bar-container" style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '4px' }}>
                                                            <div style={{ 
                                                                width: `${sess.qualityScore}%`, 
                                                                height: '100%', 
                                                                borderRadius: '4px',
                                                                background: sess.qualityScore > 85 ? '#10B981' : sess.qualityScore > 60 ? '#F59E0B' : '#EF4444',
                                                                transition: 'width 1s ease-out'
                                                            }}></div>
                                                        </div>
                                                        <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{sess.qualityScore}%</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '700' }}>{sess.reps}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                        {new Date(sess.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                        {new Date(sess.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        background: '#ecfdf5', color: '#047857', padding: '4px 12px', 
                                                        borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.5px'
                                                    }}>
                                                        SYNCED
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </motion.div>
                    </>
                )}
            </section>
        </div>
    );
};

export default PatientHome;