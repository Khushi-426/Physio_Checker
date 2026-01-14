// frontend/src/pages/PatientHome.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis 
} from 'recharts';
import { Play, Activity, User, Ruler, HeartPulse, Thermometer } from 'lucide-react';
import './PatientHome.css';

const PatientHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Initial State with Mock Data for UI completeness
    // (In a real app, you would fetch age/height/weight from the backend)
    const [stats, setStats] = useState({
        muscleActivation: 78,
        rangeOfMotion: 82,
        recoveryIndex: 65,
        painLevel: 12, // Lower is better
        recentHistory: []
    });

    const [profile] = useState({
        name: user?.name || "Alex Johnson",
        age: 28,
        height: "182 cm",
        weight: "75 kg",
        bloodGroup: "O+"
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
                    
                    // Calculate dynamic metrics based on history
                    let totalAcc = 0;
                    history.forEach(sess => {
                        const sessAcc = sess.accuracy || Math.max(0, 100 - ((sess.total_errors || 0) * 5));
                        totalAcc += sessAcc;
                    });
                    
                    const avgAccuracy = history.length > 0 ? Math.round(totalAcc / history.length) : 0;
                    
                    setStats(prev => ({ 
                        ...prev,
                        muscleActivation: avgAccuracy || 78, // Map accuracy to muscle activation
                        recoveryIndex: Math.min(100, (history.length * 5) + 40), // Dynamic recovery score
                        recentHistory: history.slice(-4).reverse() 
                    }));
                } catch (err) {
                    console.error("Failed to fetch stats", err);
                }
            }
        };
        fetchStats();
    }, [user]);

    // --- Reusable Component: Health Gauge ---
    const HealthGauge = ({ value, max = 100, label, color, icon: Icon, suffix = "%" }) => {
        const data = [{ name: 'L1', value: value, fill: color }];
        return (
            <div className="gauge-card">
                <div className="gauge-header">
                    <Icon size={18} color={color} />
                    <span className="gauge-label">{label}</span>
                </div>
                <div className="gauge-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                            innerRadius="70%" 
                            outerRadius="100%" 
                            barSize={8} 
                            data={data} 
                            startAngle={90} 
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
                            <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="gauge-value">
                        <span style={{ color: color }}>{value}</span>
                        <small>{suffix}</small>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="patient-dashboard-container">
            {/* --- LEFT PANEL: BIOMETRIC SCANNER --- */}
            <section className="left-panel">
                <div className="hologram-wrapper">
                    <img src="/human.png" alt="Biometric Scan" className="human-model" />
                    
                    {/* Futuristic Overlays */}
                    <div className="scan-line"></div>
                    <div className="joint-marker shoulder-l"></div>
                    <div className="joint-marker knee-r"></div>
                    
                    <div className="model-status">
                        <div className="status-dot"></div>
                        <span>LIVE TRACKING ACTIVE</span>
                    </div>

                    <button className="start-session-btn" onClick={() => navigate('/track')}>
                        <div className="btn-glow"></div>
                        <Play size={20} fill="currentColor" /> 
                        <span>START THERAPY</span>
                    </button>
                </div>
            </section>

            {/* --- RIGHT PANEL: CLINICAL DASHBOARD --- */}
            <section className="right-panel">
                
                {/* 1. Header & Title */}
                <header className="dashboard-header">
                    <div>
                        <h1 className="main-title">PhysioCheck Dashboard</h1>
                        <p className="sub-title">Clinical Rehabilitation Monitoring System v2.4</p>
                    </div>
                    <div className="system-status">
                        <span className="pulse-icon"></span> System Nominal
                    </div>
                </header>

                {/* 2. Patient Profile Bar */}
                <motion.div 
                    className="patient-profile-bar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="profile-item">
                        <User size={16} className="profile-icon" />
                        <div>
                            <span className="p-label">PATIENT</span>
                            <span className="p-value">{profile.name}</span>
                        </div>
                    </div>
                    <div className="profile-divider"></div>
                    <div className="profile-item">
                        <span className="p-label">AGE</span>
                        <span className="p-value">{profile.age}</span>
                    </div>
                    <div className="profile-item">
                        <span className="p-label">HEIGHT</span>
                        <span className="p-value">{profile.height}</span>
                    </div>
                    <div className="profile-item">
                        <span className="p-label">WEIGHT</span>
                        <span className="p-value">{profile.weight}</span>
                    </div>
                    <div className="profile-item">
                        <span className="p-label">BLOOD</span>
                        <span className="p-value">{profile.bloodGroup}</span>
                    </div>
                </motion.div>

                {/* 3. Key Metrics Gauges */}
                <motion.div 
                    className="gauges-grid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <HealthGauge 
                        value={stats.muscleActivation} 
                        label="Muscle Activation" 
                        color="#4CC9F0" 
                        icon={Activity} 
                    />
                    <HealthGauge 
                        value={stats.rangeOfMotion} 
                        label="Range of Motion" 
                        color="#4361EE" 
                        icon={Ruler} 
                        suffix="°" 
                    />
                    <HealthGauge 
                        value={stats.recoveryIndex} 
                        label="Recovery Index" 
                        color="#10B981" 
                        icon={HeartPulse} 
                    />
                    <HealthGauge 
                        value={stats.painLevel} 
                        max={100}
                        label="Pain Level" 
                        color="#F72585" 
                        icon={Thermometer} 
                        suffix="/10" 
                    />
                </motion.div>

                {/* 4. Clinical Data Table */}
                <motion.div 
                    className="clinical-table-wrapper"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="table-header">
                        <h3>Recent Analysis Log</h3>
                        <button className="export-btn">Export Report</button>
                    </div>
                    <table className="clinical-table">
                        <thead>
                            <tr>
                                <th>EXERCISE NAME</th>
                                <th>JOINT INVOLVED</th>
                                <th>PERFORMANCE</th>
                                <th>NORMAL RANGE</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentHistory.length > 0 ? (
                                stats.recentHistory.map((sess, idx) => (
                                    <tr key={idx}>
                                        <td className="fw-600">{sess.exercise || "Rehab Routine A"}</td>
                                        <td>{sess.exercise?.includes("Knee") ? "Knee Joint (Tibiofemoral)" : "Glenohumeral Joint"}</td>
                                        <td>
                                            <div className="perf-bar-container">
                                                <div 
                                                    className="perf-bar" 
                                                    style={{ width: `${sess.accuracy || 85}%`, background: sess.accuracy > 80 ? '#10B981' : '#F59E0B' }}
                                                ></div>
                                            </div>
                                            <span className="perf-text">{sess.accuracy || 85}% Acc</span>
                                        </td>
                                        <td className="text-muted">
                                            {sess.exercise?.includes("Squat") ? "0° - 130°" : "0° - 180°"}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${sess.accuracy > 80 ? 'optimal' : 'check'}`}>
                                                {sess.accuracy > 80 ? 'OPTIMAL' : 'REVIEW'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Mock rows for UI visualization if no data
                                <>
                                    <tr>
                                        <td className="fw-600">Knee Extension</td>
                                        <td>Knee Joint</td>
                                        <td>
                                            <div className="perf-bar-container"><div className="perf-bar" style={{ width: '92%', background: '#10B981' }}></div></div>
                                            <span className="perf-text">92% Acc</span>
                                        </td>
                                        <td className="text-muted">0° - 135°</td>
                                        <td><span className="status-pill optimal">OPTIMAL</span></td>
                                    </tr>
                                    <tr>
                                        <td className="fw-600">Shoulder Abduction</td>
                                        <td>Shoulder Complex</td>
                                        <td>
                                            <div className="perf-bar-container"><div className="perf-bar" style={{ width: '68%', background: '#F59E0B' }}></div></div>
                                            <span className="perf-text">68% Acc</span>
                                        </td>
                                        <td className="text-muted">0° - 180°</td>
                                        <td><span className="status-pill check">REVIEW</span></td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </motion.div>

            </section>
        </div>
    );
};

export default PatientHome;