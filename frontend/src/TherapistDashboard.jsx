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
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid
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
            console.warn("API unavailable.");
            setLoading(false);
            return;
        }

        const rawResponse = await response.json();
        const rawList = rawResponse.patients || (Array.isArray(rawResponse) ? rawResponse : []);

        if (!Array.isArray(rawList)) {
            setPatients([]);
            setLoading(false);
            return;
        }

        // --- PROCESS PATIENTS (REAL DATA ONLY) ---
        const processedPatients = rawList.map((p) => {
            // 1. Safe Date Parsing
            const lastActiveRaw = p.lastActive || p.last_session_ts || p.updatedAt;
            const lastActiveDate = lastActiveRaw ? new Date(lastActiveRaw) : null;

            // 2. Real Counters
            const completed = typeof p.completedSessions === 'number' ? p.completedSessions : 0;
            const assigned = typeof p.assignedSessions === 'number' && p.assignedSessions > 0 ? p.assignedSessions : 20;
            
            // 3. Calculate Real Adherence
            const realAdherence = Math.round((completed / assigned) * 100);

            return {
                ...p,
                // Ensure ID exists
                _id: p._id || p.id,
                name: p.name || "Unknown Patient",
                email: p.email || "No Email",
                img: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "User")}&background=E0F2FE&color=0284C7&bold=true`,
                lastActiveDate: lastActiveDate,
                
                // Vitals
                age: p.age || "--",
                weight: p.weight || "--",
                bloodGroup: p.bloodGroup || "--",

                // Metrics
                adherence: realAdherence > 100 ? 100 : realAdherence,
                completedSessions: completed,
                assignedSessions: assigned,
                completionRate: p.completionRate || 0, // Real Accuracy
                
                // Arrays
                loginHistory: Array.isArray(p.loginHistory) ? p.loginHistory : [],
                accuracyTrend: Array.isArray(p.accuracyTrend) ? p.accuracyTrend : []
            };
        });

        // Sort by Last Active (Most recent first)
        processedPatients.sort((a, b) => {
            if (!a.lastActiveDate) return 1;
            if (!b.lastActiveDate) return -1;
            return b.lastActiveDate - a.lastActiveDate;
        });

        setPatients(processedPatients);
        
        // Auto-select first patient
        if (processedPatients.length > 0 && !selectedPatient) {
            setSelectedPatient(processedPatients[0]);
        }

        // --- CALCULATE DASHBOARD METRICS ---
        const totalP = processedPatients.length;
        const riskCount = processedPatients.filter(p => p.status === "High Risk").length;
        
        const totalAdherence = processedPatients.reduce((sum, p) => sum + p.adherence, 0);
        const avgAdh = totalP > 0 ? Math.round(totalAdherence / totalP) : 0;

        const totalEx = 6; // Hardcoded per previous request

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

  // SEARCH FILTER
  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  // --- HANDLERS ---
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

  // --- SUB-COMPONENT: Status Badge ---
  const StatusBadge = ({ status }) => {
    const isRisk = status === "High Risk";
    return (
        <span className={`status-pill ${isRisk ? "risk" : "normal"}`}>
            {status || "Active"}
        </span>
    );
  };

  // --- SUB-COMPONENT: Adherence Bar ---
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

  // --- HELPER: Format Last Active ---
  const formatLastActive = (dateObj) => {
    if (dateObj && dateObj.getFullYear() > 1970) {
        return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return "Never";
  };

  // --- ✅ LOADING STATE: ANIMATION ONLY ---
  if (loading) return (
    <div style={{
        display: 'flex', 
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
        />
      </div>
    </div>
  );

  return (
    <div className="td-container">
      
      {/* --- MAIN DASHBOARD AREA --- */}
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

        {/* METRICS ROW */}
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

        {/* PATIENT LIST TABLE */}
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

      {/* --- RIGHT PANEL (UPDATED) --- */}
      <aside className="td-right-panel">
        {selectedPatient ? (
            <div className="detail-content">
                
                {/* 1. Header Card with Last Active */}
                <div className="rp-header-card">
                    <img src={selectedPatient.img} alt="Profile" className="rp-avatar"/>
                    <div className="rp-header-info">
                        <h2>{selectedPatient.name}</h2>
                        <div className="rp-badges">
                            <StatusBadge status={selectedPatient.status} />
                            <div className="last-active-badge">
                                <Clock size={12}/>
                                {formatLastActive(selectedPatient.lastActiveDate)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Quick Vitals */}
                <div className="rp-section vitals-box">
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

                {/* 3. Action Buttons (Cleaned) */}
                <div className="rp-actions">
                    <button className="btn-assign" onClick={handleAssignClick}>
                        <PlusCircle size={18}/> Assign New Exercise
                    </button>
                </div>

                <div className="rp-divider"></div>

                {/* 4. Performance Chart (Matched to Patient Analytics Style) */}
                <div className="rp-section chart-section">
                    <div className="chart-header">
                        <h4><Activity size={16}/> Recovery Trend</h4>
                        <span className="acc-score">{selectedPatient.completionRate}% Avg</span>
                    </div>
                    
                    <div className="chart-box">
                        {selectedPatient.accuracyTrend && selectedPatient.accuracyTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={selectedPatient.accuracyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        cursor={{ stroke: '#2C5D31', strokeWidth: 1 }}
                                    />
                                    {/* Updated Line Style to Match Patient Daily Report (#2C5D31) */}
                                    <Line 
                                        type="monotone" 
                                        dataKey="val" 
                                        stroke="#2C5D31" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, fill: '#2C5D31' }} 
                                        activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                           <div className="no-data-msg">Not enough session data yet.</div>
                        )}
                    </div>
                    
                    <div className="session-counter">
                        <span>Completed Sessions</span>
                        <strong>{selectedPatient.completedSessions} / {selectedPatient.assignedSessions}</strong>
                    </div>
                </div>

                {/* 5. Footer Action */}
                <button className="btn-full-record" onClick={() => navigate(`/therapist/patient-detail/${selectedPatient.email}`)}>
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