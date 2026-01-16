// frontend/src/pages/Profile.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Trophy,
  Flame,
  Calendar,
  TrendingUp,
  Target,
  ChevronRight,
  User,
  Edit2,
  Save,
  X
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Profile.css";

// Mock stats for the charts (keep these visual for now)
const MOCK_STATS = {
  metrics: {
    total_workouts: 12,
    total_minutes: 240,
    streak: 3,
    total_reps: 450,
    accuracy: 88,
  },
  graph_data: [
    { name: "Mon", score: 65 },
    { name: "Tue", score: 72 },
    { name: "Wed", score: 68 },
    { name: "Thu", score: 85 },
    { name: "Fri", score: 82 },
    { name: "Sat", score: 90 },
    { name: "Sun", score: 94 },
  ],
};

const Profile = () => {
  const { user } = useAuth(); 
  const [profileData, setProfileData] = useState({
    name: "",
    age: "",
    weight: "",
    bloodGroup: "",
    email: ""
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- FETCH REAL USER DATA ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let token = user?.token;
        if (!token) {
           const stored = localStorage.getItem("physio_user");
           if (stored) token = JSON.parse(stored).token;
        }
        
        if(!token) return;

        const res = await fetch("http://127.0.0.1:5001/api/auth/user", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            setProfileData({
                name: data.name || "",
                age: data.age || "",
                weight: data.weight || "",
                bloodGroup: data.bloodGroup || "",
                email: data.email
            });
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load profile", err);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    try {
        let token = user?.token || JSON.parse(localStorage.getItem("physio_user"))?.token;
        
        const res = await fetch("http://127.0.0.1:5001/api/auth/update-profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                name: profileData.name,
                age: Number(profileData.age),
                weight: profileData.weight,
                bloodGroup: profileData.bloodGroup
            })
        });

        if (res.ok) {
            setIsEditing(false);
            // Optionally show success toast
        } else {
            alert("Failed to save profile.");
        }
    } catch (err) {
        console.error("Save error:", err);
    }
  };

  const COLORS = { primary: "#69B341", orange: "#F59E0B", red: "#EF4444", blue: "#3B82F6" };

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* --- HEADER --- */}
        <div className="profile-header">
          <div className="header-left">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="welcome-text">
                Welcome back, <span className="highlight">{profileData.name || "Patient"}</span>
              </h1>
              <div className="user-phase-badge">
                <Activity size={16} /> Week 4 — Mobility Phase
              </div>
            </motion.div>
          </div>
          <div className="header-right">
             <div className="date-pill">
              <Calendar size={18} />
              <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* --- PERSONAL DETAILS CARD (NEW) --- */}
        <motion.div 
            className="card personal-details-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: "20px", padding: "20px", position: "relative" }}
        >
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "15px"}}>
                <h3 style={{display:"flex", alignItems:"center", gap:"10px", margin:0}}>
                    <User size={20} color="#69B341"/> My Details
                </h3>
                {!isEditing ? (
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                        <Edit2 size={16}/> Edit
                    </button>
                ) : (
                    <div style={{display:"flex", gap:"10px"}}>
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}><X size={16}/></button>
                        <button className="save-btn" onClick={handleSave}><Save size={16}/> Save</button>
                    </div>
                )}
            </div>

            <div className="details-grid">
                <div className="detail-item">
                    <label>Full Name</label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={profileData.name} 
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            placeholder="Enter Name"
                        />
                    ) : (
                        <span className="value">{profileData.name || "Not Set"}</span>
                    )}
                </div>

                <div className="detail-item">
                    <label>Age</label>
                    {isEditing ? (
                        <input 
                            type="number" 
                            value={profileData.age} 
                            onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                            placeholder="25"
                        />
                    ) : (
                        <span className="value">{profileData.age || "--"}</span>
                    )}
                </div>

                <div className="detail-item">
                    <label>Weight (kg)</label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={profileData.weight} 
                            onChange={(e) => setProfileData({...profileData, weight: e.target.value})}
                            placeholder="70kg"
                        />
                    ) : (
                        <span className="value">{profileData.weight || "--"}</span>
                    )}
                </div>

                <div className="detail-item">
                    <label>Blood Group</label>
                    {isEditing ? (
                        <select 
                            value={profileData.bloodGroup} 
                            onChange={(e) => setProfileData({...profileData, bloodGroup: e.target.value})}
                        >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    ) : (
                        <span className="value">{profileData.bloodGroup || "--"}</span>
                    )}
                </div>
            </div>
        </motion.div>

        {/* --- STATS GRID --- */}
        <div className="stats-grid">
          <StatCard title="Total Sessions" value={MOCK_STATS.metrics.total_workouts} icon={Activity} color={COLORS.primary} subtext="+3 this week" />
          <StatCard title="Minutes Active" value={MOCK_STATS.metrics.total_minutes} icon={Clock} color={COLORS.orange} subtext="Avg 20m/session" />
          <StatCard title="Current Streak" value={`${MOCK_STATS.metrics.streak} Days`} icon={Flame} color={COLORS.red} subtext="Keep it up!" />
          <StatCard title="Total Reps" value={MOCK_STATS.metrics.total_reps} icon={Target} color={COLORS.blue} subtext="Target: 1000" />
        </div>

        {/* --- CHARTS --- */}
        <div className="dashboard-grid">
          <motion.div className="card chart-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="card-header">
              <h3><TrendingUp size={20} /> Recovery Progress</h3>
            </div>
            <div className="chart-area">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={MOCK_STATS.graph_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Area type="monotone" dataKey="score" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="side-column">
            <motion.div className="card accuracy-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="card-header"><h3><Trophy size={20} /> Form Accuracy</h3></div>
              <div className="donut-wrapper">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[{ name: "Accuracy", value: 88 }, { name: "Error", value: 12 }]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                        <Cell fill={COLORS.primary} />
                        <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-label"><span className="percentage">88%</span><span className="label">Excellent</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CSS Styles for the Input Forms */}
      <style>{`
        .edit-btn, .save-btn, .cancel-btn {
            display: flex; align-items: center; gap: 6px;
            padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600;
        }
        .edit-btn { background: #E6F4EA; color: #69B341; }
        .save-btn { background: #69B341; color: white; }
        .cancel-btn { background: #F3F4F6; color: #6B7280; }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        .detail-item { display: flex; flex-direction: column; gap: 5px; }
        .detail-item label { font-size: 0.8rem; color: #6B7280; font-weight: 500; }
        .detail-item .value { font-size: 1.1rem; color: #1F2937; font-weight: 600; }
        .detail-item input, .detail-item select {
            padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 1rem; width: 100%;
        }
        @media (max-width: 768px) {
            .details-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <motion.div className="stat-card" whileHover={{ y: -5 }}>
    <div className="stat-header">
      <div className="icon-box" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
    </div>
    <div className="stat-content">
      <h2 style={{ color: "#1A3C34" }}>{value}</h2>
      <p>{title}</p>
      {subtext && <span className="stat-subtext" style={{ color: color }}>{subtext}</span>}
    </div>
  </motion.div>
);

export default Profile;