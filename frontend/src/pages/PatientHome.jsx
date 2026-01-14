// frontend/src/pages/PatientHome.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis 
} from 'recharts';
import { Play } from 'lucide-react';
import './PatientHome.css';

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalSessions: 0,
        avgAccuracy: 0,
        recoveryScore: 0,
        recentHistory: []
    });

    // --- Fetch Real Stats ---
    useEffect(() => {
        const fetchStats = async () => {
            if (user?.email) {
                try {
                    const res = await axios.post('http://localhost:5001/api/user/analytics_detailed', {
                        email: user.email
                    });
                    
                    const data = res.data;
                    const history = data.history || [];
                    const totalSessions = data.total_sessions || 0;
                    
                    let totalAcc = 0;
                    history.forEach(sess => {
                        const sessAcc = sess.accuracy || Math.max(0, 100 - ((sess.total_errors || 0) * 5));
                        totalAcc += sessAcc;
                    });
                    const avgAccuracy = totalSessions > 0 ? Math.round(totalAcc / totalSessions) : 0;
                    const recoveryScore = Math.min(100, Math.round(avgAccuracy * 0.8 + (totalSessions * 2)));

                    setStats({ 
                        totalSessions, 
                        avgAccuracy, 
                        recoveryScore,
                        // Reduced to 5 items to prevent scrolling (Removed 2 rows)
                        recentHistory: history.slice(-5).reverse() 
                    });
                } catch (err) {
                    console.error("Failed to fetch stats", err);
                }
            }
        };
        fetchStats();
    }, [user]);

    // --- Helper for Gauge Charts ---
    const Gauge = ({ value, color, label }) => {
        const data = [{ name: 'L1', value: value, fill: color }];
        return (
            <div className="glass-card">
                <div style={{ width: '100px', height: '100px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                            innerRadius="80%" 
                            outerRadius="100%" 
                            barSize={10} 
                            data={data} 
                            startAngle={90} 
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        fontWeight: '800', fontSize: '1.5rem', color: '#2D3748'
                    }}>
                        {value}%
                    </div>
                </div>
                <span style={{ marginTop: '10px', fontSize: '0.95rem', color: '#718096', fontWeight: '600' }}>
                    {label}
                </span>
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            {/* --- MAIN GRID --- */}
            <div className="main-content">
                
                {/* --- LEFT: HOLOGRAPHIC BODY WITH GLASS BUTTON OVERLAY --- */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="body-section"
                >
                    <div className="hologram-container">
                        <img src="/human.png" alt="Body Scan" className="hologram-img" />
                        
                        {/* Interactive Dots */}
                        <div style={{ position: 'absolute', top: '25%', left: '48%', width: '10px', height: '10px', background: '#00F5FF', borderRadius: '50%', boxShadow: '0 0 15px #00F5FF' }}></div>
                        <div style={{ position: 'absolute', top: '32%', right: '40%', width: '8px', height: '8px', background: '#FF9F1C', borderRadius: '50%', boxShadow: '0 0 12px #FF9F1C' }}></div>
                        
                        {/* --- GLASSMORPHISM START BUTTON OVERLAY --- */}
                        <div className="start-overlay">
                            <button className="start-btn" onClick={() => navigate('/track')}>
                                <Play size={20} fill="currentColor" /> START SESSION
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* --- RIGHT: DATA DASHBOARD --- */}
                <div className="data-section">
                    
                    {/* Header */}
                    <div className="header-glass">
                        <div>
                            <h1 style={{ fontSize: '2.5rem', margin: 0, color: '#1a202c', fontWeight: '800', letterSpacing: '-1px' }}>
                                Dashboard
                            </h1>
                            <p style={{ color: '#718096', marginTop: '5px', fontSize: '1.1rem' }}>
                                Recovery Overview &bull; {user?.name || 'Patient'}
                            </p>
                        </div>
                    </div>

                    {/* Gauges */}
                    <motion.div 
                        className="metrics-grid"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Gauge value={stats.recoveryScore} color="#4CC9F0" label="Recovery" />
                        <Gauge value={stats.avgAccuracy} color="#F72585" label="Accuracy" />
                        <Gauge value={85} color="#4361EE" label="Mobility" />
                        <Gauge value={12} color="#F48C06" label="Pain Level" />
                    </motion.div>

                    {/* Activity Table */}
                    <motion.div 
                        className="table-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#2D3748' }}>Recent Activity</h3>
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Exercise</th>
                                        <th>Date</th>
                                        <th>Performance</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentHistory.length > 0 ? (
                                        stats.recentHistory.map((sess, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: '600' }}>{sess.exercise || "General"}</td>
                                                <td>{new Date(sess.timestamp * 1000).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</td>
                                                <td>{sess.total_reps} Reps</td>
                                                <td>
                                                    <span className={`status-badge ${sess.accuracy > 80 ? 'status-normal' : 'status-alert'}`}>
                                                        {sess.accuracy > 80 ? 'Optimal' : 'Needs Focus'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#A0AEC0', padding: '30px' }}>No recent sessions.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default PatientHome;