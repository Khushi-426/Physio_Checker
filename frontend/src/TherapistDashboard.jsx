// frontend/src/TherapistDashboard.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  Search,
  ChevronRight,
  ChevronLeft,
  LogOut,
  AlertCircle,
  Calendar,
  User,
  Activity,
  TrendingUp
} from "lucide-react";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import "./TherapistDashboard.css";

const TherapistDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    highRiskCount: 0,
    activeProtocols: 0,
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
            console.error("Server Status:", response.status);
            throw new Error("API Connection Failed");
        }

        const rawData = await response.json();

        // CRITICAL CHECK: Ensure we have an array before mapping
        if (!Array.isArray(rawData)) {
            console.error("Invalid data format received:", rawData);
            setPatients([]);
            setLoading(false);
            return;
        }

        // PROCESS PATIENTS
        const processedPatients = rawData.map(p => ({
            ...p,
            img: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&color=fff`,
            lastActiveDate: new Date(p.lastActive),
            // Ensure these fields exist for the UI, default to null if missing
            age: p.age,
            weight: p.weight,
            bloodGroup: p.bloodGroup
        }));

        // Sort by Last Active (Desc)
        processedPatients.sort((a, b) => b.lastActiveDate - a.lastActiveDate);

        setPatients(processedPatients);
        if (processedPatients.length > 0) setSelectedPatient(processedPatients[0]);

        // CALCULATE METRICS
        const totalP = processedPatients.length;
        const riskCount = processedPatients.filter(p => p.status === "High Risk").length;
        const activeProto = processedPatients.filter(p => p.hasActiveProtocol).length;
        const avgAdh = totalP > 0 ? Math.round(processedPatients.reduce((sum, p) => sum + p.completionRate, 0) / totalP) : 0;

        setMetrics({ totalPatients: totalP, highRiskCount: riskCount, activeProtocols: activeProto, avgAdherence: avgAdh });

        // GENERATE ALERTS
        const newAlerts = [];
        processedPatients.forEach(p => {
            if (p.status === "High Risk") {
                newAlerts.push({
                    id: p._id + "_risk",
                    type: "risk",
                    text: `${p.name} accuracy drop detected.`,
                    time: "Attention Needed"
                });
            }
            const oneDayAgo = new Date(Date.now() - 86400000);
            if (new Date(p.lastActive) > oneDayAgo) {
                newAlerts.push({
                    id: p._id + "_act",
                    type: "success",
                    text: `${p.name} finished a session.`,
                    time: new Date(p.lastActive).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                });
            }
        });

        setAlerts(newAlerts.slice(0, 10));
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
    return patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [patients, searchTerm]);

  if (loading) return <div className="loading-screen">Loading Dashboard...</div>;

  return (
    <div className="td-container">
      {/* --- SIDEBAR --- */}
      <aside className={`td-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="td-logo-area">
            {!isSidebarCollapsed && <span className="logo-text">Physio<span className="accent">Check</span></span>}
            <button className="collapse-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                {isSidebarCollapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
            </button>
        </div>
        <nav className="td-nav">
            <div className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                <LayoutDashboard size={20} />{!isSidebarCollapsed && <span>Overview</span>}
            </div>
            <div className={`nav-item ${activeTab === "patients" ? "active" : ""}`} onClick={() => navigate("/therapist/monitoring")}>
                <Users size={20} />{!isSidebarCollapsed && <span>Patients</span>}
            </div>
            <div className={`nav-item ${activeTab === "assignments" ? "active" : ""}`} onClick={() => navigate("/therapist/assignments")}>
                <FileText size={20} />{!isSidebarCollapsed && <span>Assignments</span>}
            </div>
        </nav>
        <div className="td-logout" onClick={logout}>
            <LogOut size={20} />{!isSidebarCollapsed && <span>Logout</span>}
        </div>
      </aside>

      {/* --- MAIN DASHBOARD --- */}
      <main className="td-main">
        <header className="td-header">
            <div><h1>Dashboard Overview</h1><p className="subtitle">Welcome back, Dr. {user?.name?.split(" ")[0] || "Therapist"}</p></div>
            <div className="header-date">{new Date().toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long'})}</div>
        </header>

        {/* METRICS */}
        <div className="metrics-row">
            <div className="metric-card"><div className="icon-box blue"><Users size={20}/></div><div><h3>{metrics.totalPatients}</h3><p>Total Patients</p></div></div>
            <div className="metric-card"><div className="icon-box red"><AlertCircle size={20}/></div><div><h3>{metrics.highRiskCount}</h3><p>High Risk</p></div></div>
            <div className="metric-card"><div className="icon-box orange"><Activity size={20}/></div><div><h3>{metrics.activeProtocols}</h3><p>Active Protocols</p></div></div>
            <div className="metric-card"><div className="icon-box green"><TrendingUp size={20}/></div><div><h3>{metrics.avgAdherence}%</h3><p>Avg Adherence</p></div></div>
        </div>

        <div className="middle-section">
            <div className="card notifications-panel">
                <div className="card-header"><h4>Notifications</h4><span className="badge">{alerts.length}</span></div>
                <div className="alert-list">
                    {alerts.length === 0 ? <p className="empty-state">No new alerts.</p> : alerts.map((alert, i) => (
                        <div key={i} className={`alert-item ${alert.type}`}>
                            <div className="dot"></div>
                            <div className="alert-content"><p>{alert.text}</p><span>{alert.time}</span></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card graph-panel">
                <div className="card-header"><h4>Global Engagement</h4></div>
                <div className="chart-wrapper-main">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{name:'M',val:30},{name:'T',val:50},{name:'W',val:45},{name:'T',val:60},{name:'F',val:metrics.avgAdherence}]}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2FA4A9" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#2FA4A9" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip />
                            <Area type="monotone" dataKey="val" stroke="#2FA4A9" fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="recent-section">
            <div className="section-header"><h4>Recent Active Patients</h4></div>
            <div className="recent-grid">
                {patients.length === 0 ? <p>No patients found.</p> : patients.slice(0, 4).map(patient => (
                    <div key={patient._id} className={`patient-mini-card ${selectedPatient?._id === patient._id ? 'selected' : ''}`} onClick={() => setSelectedPatient(patient)}>
                        <img src={patient.img} alt={patient.name} />
                        <div className="pm-info"><h5>{patient.name}</h5><span>{patient.status}</span></div>
                        <div className="pm-arrow"><ChevronRight size={16}/></div>
                    </div>
                ))}
            </div>
        </div>
      </main>

      {/* --- RIGHT PANEL (NOW SHOWS REAL DATA) --- */}
      <aside className="td-right-panel">
        <div className="search-box">
            <Search size={18} className="search-icon"/>
            <input type="text" placeholder="Search patient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {searchTerm && (
            <div className="search-results-dropdown">
                {filteredPatients.map(p => (
                    <div key={p._id} className="search-result-item" onClick={() => { setSelectedPatient(p); setSearchTerm(""); }}>{p.name}</div>
                ))}
            </div>
        )}

        {selectedPatient ? (
            <div className="profile-detail">
                <div className="profile-header">
                    <img src={selectedPatient.img} alt="Profile" className="profile-lg-img"/>
                    <h3>{selectedPatient.name}</h3>
                    <p className="email-text">{selectedPatient.email}</p>
                </div>

                {/* --- THIS SECTION DISPLAYS THE REAL FETCHED DATA --- */}
                <div className="vitals-grid">
                    <div className="vital-item">
                        <span className="label">Age</span>
                        <span className="val">{selectedPatient.age || "--"}</span>
                    </div>
                    <div className="vital-item">
                        <span className="label">Weight</span>
                        <span className="val">{selectedPatient.weight || "--"}</span>
                    </div>
                    <div className="vital-item">
                        <span className="label">Blood</span>
                        <span className="val">{selectedPatient.bloodGroup || "--"}</span>
                    </div>
                </div>
                {/* ------------------------------------------------- */}

                <hr className="divider"/>

                <div className="panel-section">
                    <h4><Calendar size={16}/> Activity Heatmap</h4>
                    <div className="calendar-heatmap">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className={`cal-box ${selectedPatient.loginHistory[i] ? 'active' : ''}`}></div>
                        ))}
                    </div>
                </div>

                <div className="panel-section">
                    <h4><Activity size={16}/> Accuracy Trend</h4>
                    <div className="mini-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedPatient.accuracyTrend}>
                                <Line type="monotone" dataKey="val" stroke="#2FA4A9" strokeWidth={3} dot={false} />
                                <Tooltip />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="acc-stat"><span>Avg Accuracy:</span><strong>{selectedPatient.completionRate}%</strong></div>
                </div>

                <button className="full-profile-btn" onClick={() => navigate(`/therapist/patient-detail/${selectedPatient._id}`)}>
                    View Full Medical Record
                </button>
            </div>
        ) : (
            <div className="no-selection"><User size={48} color="#cbd5e1"/><p>Select a patient</p></div>
        )}
      </aside>
    </div>
  );
};

export default TherapistDashboard;