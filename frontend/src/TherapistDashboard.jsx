// frontend/src/TherapistDashboard.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { DotLottieReact } from '@lottiefiles/dotlottie-react'; 
import {
  Users,
  Search,
  ChevronRight,
  LogOut,
  AlertCircle,
  Activity,
  TrendingUp,
  Dumbbell,
  Clock,
  PlusCircle,
  FileText,
  MessageSquare,
  Zap
} from "lucide-react";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import "./TherapistDashboard.css";

const TherapistDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  
  // ✅ FILTER STATE (Default: 'all')
  const [graphFilter, setGraphFilter] = useState('all'); 

  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    highRiskCount: 0,
    totalExercises: 0,
    avgAdherence: 0,
  });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let token = user?.token;
        if (!token) {
           const stored = localStorage.getItem("physio_user");
           if (stored) token = JSON.parse(stored).token;
        }

        const response = await fetch("http://127.0.0.1:5001/api/therapist/patients", {
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
          }
        });

        if (!response.ok) {
            setLoading(false);
            return;
        }

        const rawResponse = await response.json();
        const rawList = rawResponse.patients || [];

        if (!Array.isArray(rawList)) {
            setPatients([]);
            setLoading(false);
            return;
        }

        // --- PROCESS PATIENTS ---
        const processedPatients = rawList.map((p) => {
            // ✅ LAST ACTIVE PARSING
            let lastActiveDate = null;
            const rawTs = p.lastActive || p.last_session_ts || p.updatedAt;
            
            if (rawTs) {
                const tsNum = Number(rawTs);
                if (!isNaN(tsNum)) {
                     lastActiveDate = new Date(tsNum > 10000000000 ? tsNum : tsNum * 1000);
                } else {
                     lastActiveDate = new Date(rawTs);
                }
            }

            const completed = typeof p.completedSessions === 'number' ? p.completedSessions : 0;
            const assigned = typeof p.assignedSessions === 'number' && p.assignedSessions > 0 ? p.assignedSessions : 20;
            const realAdherence = Math.round((completed / assigned) * 100);

            // ✅ HANDLE ACCURACY TREND (WITH TIMESTAMPS)
            let rawTrend = Array.isArray(p.accuracyTrend) ? p.accuracyTrend : [];
            const formattedTrend = rawTrend.map((item, i) => {
                const val = typeof item === 'object' ? item.val : item;
                const ts = typeof item === 'object' ? item.ts : null;
                return {
                    name: `S${i + 1}`,
                    val: Number(val),
                    ts: ts ? (ts > 10000000000 ? ts : ts * 1000) : null // normalize to ms
                };
            });

            return {
                ...p,
                _id: p._id || p.id,
                name: p.name || "Unknown Patient",
                email: p.email || "No Email",
                img: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "User")}&background=E0F2FE&color=0284C7&bold=true`,
                lastActiveDate: lastActiveDate,
                age: p.age || "--",
                weight: p.weight || "--",
                bloodGroup: p.bloodGroup || "--",
                adherence: realAdherence > 100 ? 100 : realAdherence,
                completedSessions: completed,
                assignedSessions: assigned,
                completionRate: p.completionRate || 0,
                loginHistory: Array.isArray(p.loginHistory) ? p.loginHistory : [],
                accuracyTrend: formattedTrend,
                dailyCheckin: p.dailyCheckin // ✅ Check-in Data
            };
        });

        // Sort by Last Active
        processedPatients.sort((a, b) => {
            const dateA = a.lastActiveDate || new Date(0);
            const dateB = b.lastActiveDate || new Date(0);
            return dateB - dateA;
        });

        setPatients(processedPatients);
        
        if (processedPatients.length > 0 && !selectedPatient) {
            setSelectedPatient(processedPatients[0]);
        }

        // Metrics Calculation
        const totalP = processedPatients.length;
        const riskCount = processedPatients.filter(p => p.status === "High Risk").length;
        const totalAdherence = processedPatients.reduce((sum, p) => sum + p.adherence, 0);
        const avgAdh = totalP > 0 ? Math.round(totalAdherence / totalP) : 0;
        const totalEx = 6; 

        setMetrics({ 
            totalPatients: totalP, 
            highRiskCount: riskCount, 
            totalExercises: totalEx, 
            avgAdherence: avgAdh 
        });
        
        setLoading(false);

      } catch (err) {
        console.error("Dashboard Error:", err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]); 

  // --- FILTERED GRAPH DATA LOGIC ---
  const getFilteredData = () => {
    if (!selectedPatient || !selectedPatient.accuracyTrend) return [];
    
    const data = selectedPatient.accuracyTrend;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (graphFilter === '7d') {
        return data.filter(d => d.ts && (now - d.ts) <= (7 * oneDay));
    }
    if (graphFilter === '30d') {
        return data.filter(d => d.ts && (now - d.ts) <= (30 * oneDay));
    }
    return data; // 'all'
  };

  const graphData = getFilteredData();

  // --- HELPERS ---
  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const handleAssignClick = () => {
    if (selectedPatient) {
        navigate("/therapist/assignments", { 
            state: { 
                selectedPatient: selectedPatient,
                patientId: selectedPatient._id 
            } 
        });
    }
  };

  const StatusBadge = ({ status }) => {
    const isRisk = status === "High Risk";
    return (
        <span className={`status-pill ${isRisk ? "risk" : "normal"}`}>
            {status || "Active"}
        </span>
    );
  };

  const AdherenceBar = ({ value }) => {
    const color = value < 50 ? "#ef4444" : value < 80 ? "#f59e0b" : "#10b981";
    return (
        <div className="adherence-wrapper">
            <div className="progress-bg">
                <div 
                    className="progress-fill" 
                    style={{ width: `${value}%`, backgroundColor: color }}
                ></div>
            </div>
            <span className="adh-text">{value}%</span>
        </div>
    );
  };

  const formatLastActive = (dateObj) => {
    if (dateObj && dateObj.getFullYear() > 1970) {
        return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return "Never";
  };

  // --- STYLES ---
  const styles = {
    glassCard: {
      background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '50px',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      boxShadow: '0 20px 40px -10px rgba(14, 165, 233, 0.15)',
      padding: '30px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '24px'
    },
    // ✅ NEW: Alert Card Style for Notification
    alertCard: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(15px)',
      borderRadius: '30px',
      padding: '20px',
      borderLeft: '6px solid #f59e0b', // Orange accent
      boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)',
      marginBottom: '24px',
      width: '100%'
    },
    circularAvatar: {
      width: '110px',
      height: '110px', 
      borderRadius: '50%',
      objectFit: 'cover',
      border: '4px solid white',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      marginBottom: '16px'
    },
    profileName: {
      fontSize: '1.4rem',
      fontWeight: '800',
      color: '#1e293b',
      margin: '0 0 8px 0',
      textAlign: 'center'
    },
    glassVitals: {
      display: 'flex',
      justifyContent: 'space-around',
      width: '100%',
      background: 'rgba(255,255,255,0.5)',
      borderRadius: '30px',
      padding: '16px',
      marginTop: '20px',
      border: '1px solid rgba(255,255,255,0.4)'
    },
    filterBtn: (isActive) => ({
        padding: '4px 10px',
        fontSize: '0.75rem',
        borderRadius: '12px',
        border: 'none',
        background: isActive ? '#0ea5e9' : 'transparent',
        color: isActive ? 'white' : '#64748b',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.2s'
    })
  };

  if (loading) return (
    <div style={{
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        backgroundColor: '#f8fafc',
        width: '100%'
    }}>
      <div style={{ width: 450, height: 450 }}>
        <DotLottieReact
          src="/LoadingAnimation.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '1rem' }}>
        Loading Dashboard...
      </p>
    </div>
  );

  return (
    <div className="td-container">
      <main className="td-main">
        <header className="td-header">
            <div className="header-left">
                <div className="logo-box">
                    <Activity size={24} color="white" />
                </div>
                <div className="header-text">
                    <h1>PhysioCheck<span className="dot">.</span></h1>
                    <p>Therapy Management Portal</p>
                </div>
            </div>
            <div className="header-right">
                <div className="doctor-badge">
                   <div className="doc-avatar">Dr</div>
                   <span>Dr. {user?.name?.split(" ")[0] || "Therapist"}</span>
                </div>
                <button className="logout-btn-header" onClick={logout} title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </header>

        {/* Metrics Row */}
        <div className="metrics-row">
            <div className="metric-card">
                <div className="metric-icon blue"><Users size={20}/></div>
                <div className="metric-info">
                    <h3>{metrics.totalPatients}</h3>
                    <p>Active Patients</p>
                </div>
            </div>
            <div className="metric-card">
                <div className="metric-icon red"><AlertCircle size={20}/></div>
                <div className="metric-info">
                    <h3>{metrics.highRiskCount}</h3>
                    <p>Attention Needed</p>
                </div>
            </div>
            <div className="metric-card">
                <div className="metric-icon orange"><Dumbbell size={20}/></div>
                <div className="metric-info">
                    <h3>{metrics.totalExercises}</h3>
                    <p>Total Exercises</p>
                </div>
            </div>
            <div className="metric-card">
                <div className="metric-icon green"><TrendingUp size={20}/></div>
                <div className="metric-info">
                    <h3>{metrics.avgAdherence}%</h3>
                    <p>Avg Adherence</p>
                </div>
            </div>
        </div>

        {/* Patient Table */}
        <div className="patient-section-wrapper">
            <div className="section-header">
                <div className="sh-left">
                    <h4>Patient Roster</h4>
                    <span className="badge-count">{filteredPatients.length} Found</span>
                </div>
                <div className="search-bar-inline">
                    <Search size={16} color="#94a3b8"/>
                    <input 
                        type="text" 
                        placeholder="Search by name..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="clinical-table">
                    <thead>
                        <tr>
                            <th width="35%">Patient</th>
                            <th width="15%">Status</th>
                            <th width="25%">Protocol Adherence</th>
                            <th width="20%">Last Active</th>
                            <th width="5%"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.length === 0 ? (
                             <tr><td colSpan="5" className="empty-cell">No patients found matching your search.</td></tr>
                        ) : (
                            filteredPatients.map(patient => (
                                <tr 
                                    key={patient._id} 
                                    className={selectedPatient?._id === patient._id ? "selected-row" : ""}
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    <td>
                                        <div className="user-cell">
                                            <img src={patient.img} alt="p" />
                                            <div>
                                                <div className="u-name">{patient.name}</div>
                                                <div className="u-email">{patient.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><StatusBadge status={patient.status} /></td>
                                    <td><AdherenceBar value={patient.adherence} /></td>
                                    <td>
                                        <div className="date-cell">
                                            <Clock size={14} style={{marginRight:6, opacity:0.6}}/>
                                            {formatLastActive(patient.lastActiveDate)}
                                        </div>
                                    </td>
                                    <td>
                                        <ChevronRight size={18} color="#cbd5e1"/>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      <aside className="td-right-panel" style={{ background: '#f8fafc' }}>
        {selectedPatient ? (
            <div className="detail-content" style={{ padding: '24px' }}>
                
                {/* Profile Card */}
                <div style={styles.glassCard}>
                    <img 
                      src={selectedPatient.img} 
                      alt="Profile" 
                      style={styles.circularAvatar}
                    />
                    <h2 style={styles.profileName}>{selectedPatient.name}</h2>
                    
                    <div className="rp-badges" style={{ justifyContent: 'center', width: '100%', gap: '10px' }}>
                        <StatusBadge status={selectedPatient.status} />
                        <div className="last-active-badge" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                            <Clock size={12}/>
                            {formatLastActive(selectedPatient.lastActiveDate)}
                        </div>
                    </div>

                    <div style={styles.glassVitals}>
                        <div className="vital">
                            <span className="lbl">Age</span>
                            <span className="val">{selectedPatient.age}</span>
                        </div>
                        <div className="vr"></div>
                        <div className="vital">
                            <span className="lbl">Weight</span>
                            <span className="val">{selectedPatient.weight}</span>
                        </div>
                        <div className="vr"></div>
                        <div className="vital">
                            <span className="lbl">Blood</span>
                            <span className="val">{selectedPatient.bloodGroup}</span>
                        </div>
                    </div>
                </div>

                {/* Assign Button */}
                <div className="rp-actions" style={{ marginBottom: '24px' }}>
                    <button 
                        className="btn-assign" 
                        onClick={handleAssignClick}
                        style={{ 
                            borderRadius: '25px',
                            boxShadow: '0 8px 20px -4px rgba(14, 165, 233, 0.4)',
                            fontWeight: '700'
                        }}
                    >
                        <PlusCircle size={18}/> Assign New Exercise
                    </button>
                </div>

                {/* Graph Section */}
                <div 
                    key={selectedPatient.email} 
                    style={{ ...styles.glassCard, borderRadius: '30px', alignItems: 'stretch', padding: '20px' }}
                >
                    <div className="chart-header" style={{ marginBottom: '16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin:0, fontSize:'1rem', color:'#334155' }}>
                                <Activity size={18} color="#0ea5e9"/> Recovery Trend
                            </h4>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                <button style={styles.filterBtn(graphFilter === '7d')} onClick={() => setGraphFilter('7d')}>7 Days</button>
                                <button style={styles.filterBtn(graphFilter === '30d')} onClick={() => setGraphFilter('30d')}>30 Days</button>
                                <button style={styles.filterBtn(graphFilter === 'all')} onClick={() => setGraphFilter('all')}>All Time</button>
                            </div>
                        </div>
                        <span className="acc-score" style={{ background: '#f0f9ff', color: '#0ea5e9', fontWeight:700 }}>
                            {selectedPatient.completionRate}% Avg
                        </span>
                    </div>
                    
                    <div className="chart-box" style={{ height: '180px', width: '100%' }}>
                        {graphData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        cursor={{ stroke: '#0ea5e9', strokeWidth: 1 }}
                                        formatter={(value) => [`${value}%`, "Accuracy"]}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="val" 
                                        stroke="#0ea5e9" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorVal)" 
                                        dot={{ r: 4, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} 
                                        activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
                                        animationDuration={1500} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                           <div className="no-data-msg" style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:'0.9rem'}}>
                                No data for this period.
                           </div>
                        )}
                    </div>
                    
                    {/* ✅ DYNAMIC COUNT: Updates based on filter */}
                    <div className="session-counter" style={{ marginTop: '12px', borderTop:'1px solid #f1f5f9', paddingTop:'12px', display:'flex', justifyContent:'space-between', fontSize:'0.9rem' }}>
                        <span style={{color: '#64748b'}}>Completed Sessions</span>
                        <strong style={{color: '#0f172a'}}>{graphData.length}</strong>
                    </div>
                </div>

                {/* ✅ NEW: DAILY CHECK-IN NOTIFICATION (Below Graph) */}
                {selectedPatient.dailyCheckin ? (
                    <div style={styles.alertCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent:'space-between', marginBottom:'10px' }}>
                            <h4 style={{ margin: 0, color: '#d97706', display:'flex', alignItems:'center', gap:'8px' }}>
                                <MessageSquare size={18}/> Daily Check-In
                            </h4>
                            <span style={{ fontSize:'0.75rem', color:'#92400e', fontWeight:600 }}>
                                Today
                            </span>
                        </div>
                        <div style={{ display:'flex', gap:'20px', alignItems:'center' }}>
                            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', background:'rgba(255,255,255,0.6)', padding:'10px', borderRadius:'15px' }}>
                                <span style={{ fontSize:'0.75rem', color:'#92400e', fontWeight:700, textTransform:'uppercase' }}>Fatigue</span>
                                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#d97706', marginTop:'4px' }}>
                                    {selectedPatient.dailyCheckin.fatigue}
                                </div>
                            </div>
                            <div style={{ flex:1 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                                    <span style={{ fontSize:'0.75rem', color:'#92400e', fontWeight:700 }}>PAIN</span>
                                    <span style={{ fontSize:'0.8rem', fontWeight:800, color:'#ef4444' }}>{selectedPatient.dailyCheckin.pain}/10</span>
                                </div>
                                <div style={{ height:'8px', width:'100%', background:'#fee2e2', borderRadius:'10px', overflow:'hidden' }}>
                                    <div style={{ width: `${selectedPatient.dailyCheckin.pain * 10}%`, height:'100%', background: 'linear-gradient(90deg, #fca5a5, #ef4444)' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Empty State for notification
                     <div style={{ ...styles.alertCard, borderLeft: '6px solid #cbd5e1', background:'rgba(255,255,255,0.5)', opacity:0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap:'10px', color:'#64748b' }}>
                            <Zap size={18}/> <span style={{fontSize:'0.9rem'}}>No check-in received today.</span>
                        </div>
                     </div>
                )}

                <button 
                    className="btn-full-record" 
                    onClick={() => navigate(`/therapist/patient-detail/${selectedPatient.email}`)}
                    style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '25px' }}
                >
                    <FileText size={16}/> View Full Medical Record
                </button>

            </div>
        ) : (
            <div className="no-selection-state">
                <Users size={64} color="#e2e8f0"/>
                <p>Select a patient from the roster<br/>to view details.</p>
            </div>
        )}
      </aside>
    </div>
  );
};

export default TherapistDashboard;