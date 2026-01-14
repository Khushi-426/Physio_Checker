// frontend/src/pages/PatientHome.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Play, Zap, Calendar, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// --- Stats Card Component ---
const StatsCard = ({ title, value, subtitle, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay, duration: 0.5 }}
        whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(0,0,0,0.08)' }}
        style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '160px',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ 
                background: `${color}15`, 
                padding: '12px', 
                borderRadius: '14px',
                color: color
            }}>
                <Icon size={24} />
            </div>
            {/* Background Decor */}
            <Icon size={100} color={color} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.08 }} />
        </div>
        
        <div>
            <h3 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1a1a1a', margin: '10px 0 5px 0' }}>{value}</h3>
            <div style={{ fontSize: '0.9rem', color: '#888', fontWeight: '500' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '0.8rem', color: color, marginTop: '5px', fontWeight: '600' }}>{subtitle}</div>}
        </div>
    </motion.div>
);

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalSessions: 0,
        avgAccuracy: 0,
        totalReps: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(true);

    // --- Fetch Real Stats ---
    useEffect(() => {
        const fetchStats = async () => {
            if (user?.email) {
                try {
                    // Using your detailed analytics endpoint
                    const res = await axios.post('http://localhost:5001/api/user/analytics_detailed', {
                        email: user.email
                    });
                    
                    const data = res.data;
                    const history = data.history || [];
                    
                    const totalSessions = data.total_sessions || 0;
                    const totalReps = history.reduce((acc, sess) => acc + (sess.total_reps || 0), 0);
                    
                    // Calc Avg Accuracy
                    let totalAcc = 0;
                    history.forEach(sess => {
                        const sessAcc = sess.accuracy || Math.max(0, 100 - ((sess.total_errors || 0) * 5));
                        totalAcc += sessAcc;
                    });
                    const avgAccuracy = totalSessions > 0 ? Math.round(totalAcc / totalSessions) : 0;
                    const streak = totalSessions > 0 ? 1 : 0; // Simplified streak logic

                    setStats({ totalSessions, avgAccuracy, totalReps, streak });
                } catch (err) {
                    console.error("Failed to fetch stats", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchStats();
    }, [user]);

    return (
        <div style={{ 
            height: 'calc(100vh - 80px)', // Full height minus navbar
            display: 'flex',
            background: '#F9F9F9',
            overflow: 'hidden'
        }}>
            
            {/* --- LEFT SIDE: IMAGE & GLASS OVERLAY --- */}
            <div style={{ 
                flex: '4', 
                position: 'relative', 
                background: '#EAEAEA',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                overflow: 'hidden'
            }}>
                {/* Background Gradient */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #D8E6D9 100%)'
                }} />

                {/* Human Image */}
                <motion.img 
                    src="/human.png" 
                    alt="Training Model"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    style={{
                        height: '95%',
                        objectFit: 'contain',
                        zIndex: 1,
                        position: 'relative',
                        bottom: 0
                    }}
                />

                {/* Glassmorphism Button Overlay */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                    }}
                >
                     <div style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(25px)',
                        padding: '10px',
                        borderRadius: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    }}>
                        <button 
                            onClick={() => navigate('/track')}
                            style={{
                                background: '#1A3C34',
                                color: '#fff',
                                border: 'none',
                                padding: '18px 45px',
                                borderRadius: '25px',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                whiteSpace: 'nowrap',
                                transition: 'transform 0.2s',
                                boxShadow: '0 10px 20px rgba(26, 60, 52, 0.3)'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            <Play fill="#fff" size={20} /> Start Training
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* --- RIGHT SIDE: STATS --- */}
            <div style={{ 
                flex: '6', 
                padding: '60px 80px', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 style={{ fontSize: '3.5rem', color: '#1a1a1a', marginBottom: '15px', lineHeight: '1.1', fontWeight: '800' }}>
                        Welcome back,<br/>
                        <span style={{ color: '#69B341' }}>{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.2rem', marginBottom: '60px', maxWidth: '500px' }}>
                        Your AI Coach is ready. Here is a summary of your recovery progress this week.
                    </p>

                    {/* Stats Grid */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                        gap: '30px',
                        marginBottom: '50px'
                    }}>
                        <StatsCard 
                            title="Total Sessions" 
                            value={stats.totalSessions} 
                            subtitle="All time"
                            icon={Calendar} 
                            color="#2196F3" 
                            delay={0.2}
                        />
                        <StatsCard 
                            title="Accuracy" 
                            value={`${stats.avgAccuracy}%`} 
                            subtitle="Average Score"
                            icon={Zap} 
                            color="#FF9800" 
                            delay={0.3}
                        />
                        <StatsCard 
                            title="Total Reps" 
                            value={stats.totalReps} 
                            subtitle="Cumulative"
                            icon={Activity} 
                            color="#4CAF50" 
                            delay={0.4}
                        />
                        <StatsCard 
                            title="Streak" 
                            value={stats.streak} 
                            subtitle="Active Days"
                            icon={TrendingUp} 
                            color="#9C27B0" 
                            delay={0.5}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PatientHome;