import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity, Calendar, TrendingUp, User, Edit2, Save, X, AlertCircle, CheckCircle,
  ClipboardList, Scale, Play, Award, Zap, Heart, Droplet, Clock,
  Thermometer, Battery, Download
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import "./Profile.css";

// --- CUSTOM HEATMAP COMPONENT (CSS Grid) ---
const ActivityHeatmap = ({ history }) => {
    // Generate last 365 days
    const days = useMemo(() => {
        const today = new Date();
        const dates = [];
        // Look back 16 weeks (approx 4 months) for a cleaner mobile view
        for (let i = 112; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d);
        }
        return dates;
    }, []);

    // Map history to date strings
    const activityMap = useMemo(() => {
        const map = {};
        history.forEach(session => {
            const dateStr = new Date(session.performedAt).toDateString();
            map[dateStr] = (map[dateStr] || 0) + 1;
        });
        return map;
    }, [history]);

    const getColor = (count) => {
        if (!count) return "#ebedf0";
        if (count === 1) return "#9be9a8";
        if (count <= 3) return "#40c463";
        return "#216e39";
    };

    return (
        <div className="heatmap-container">
            <div className="heatmap-grid">
                {days.map((date, idx) => {
                    const count = activityMap[date.toDateString()];
                    return (
                        <div 
                            key={idx} 
                            className="heatmap-cell" 
                            style={{ backgroundColor: getColor(count) }}
                            title={`${date.toDateString()}: ${count || 0} sessions`}
                        />
                    );
                })}
            </div>
            <div className="heatmap-legend">
                <span>Less</span>
                <div style={{background: "#ebedf0"}}></div>
                <div style={{background: "#9be9a8"}}></div>
                <div style={{background: "#40c463"}}></div>
                <div style={{background: "#216e39"}}></div>
                <span>More</span>
            </div>
            <style>{`
                .heatmap-container { width: 100%; overflow-x: auto; padding: 10px 0; }
                .heatmap-grid { display: grid; grid-template-rows: repeat(7, 12px); grid-auto-flow: column; gap: 4px; }
                .heatmap-cell { width: 12px; height: 12px; border-radius: 2px; }
                .heatmap-legend { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: #666; margin-top: 8px; justify-content: flex-end; }
                .heatmap-legend div { width: 10px; height: 10px; border-radius: 2px; }
            `}</style>
        </div>
    );
};

const COLORS = { primary: "#69B341", secondary: "#1A3C34", accent: "#F59E0B", danger: "#EF4444", info: "#3B82F6", pie: ["#69B341", "#3B82F6", "#F59E0B", "#EF4444"] };

const Profile = () => {
  const { user } = useAuth(); 
  const [profileData, setProfileData] = useState({ name: "", age: "", weight: "", bloodGroup: "" });
  const [sessionHistory, setSessionHistory] = useState([]);
  const [assignedExercises, setAssignedExercises] = useState([]);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Check-in State
  const [todaysPain, setTodaysPain] = useState(5);
  const [todaysFatigue, setTodaysFatigue] = useState("Medium");
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const email = user?.email;
      if (!email) return;
      try {
        // 1. Profile
        const pRes = await fetch("http://127.0.0.1:5001/api/user/profile/get", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email})});
        if(pRes.ok) setProfileData(await pRes.json());

        // 2. History
        const hRes = await fetch(`http://127.0.0.1:5001/api/sessions/my-history?email=${email}`);
        if(hRes.ok) setSessionHistory(await hRes.json());

        // 3. Exercises (Assignments)
        const eRes = await fetch(`http://127.0.0.1:5001/api/exercises?email=${email}`);
        if(eRes.ok) {
            const all = await eRes.json();
            // Filter by backend 'recommended' flag which is now robust
            setAssignedExercises(all.filter(ex => ex.recommended));
        }

        // 4. Check-in History
        const cRes = await fetch(`http://127.0.0.1:5001/api/user/checkin_history?email=${email}`);
        if(cRes.ok) {
            const hist = await cRes.json();
            setCheckinHistory(hist);
            // Check if already checked in today
            const today = new Date().toISOString().split('T')[0];
            if(hist.length > 0 && hist[0].date_str === today) setHasCheckedIn(true);
        }

      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [user]);

  const handleCheckin = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5001/api/user/checkin", {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ email: user.email, painLevel: todaysPain, fatigue: todaysFatigue })
        });
        if(res.ok) {
            setHasCheckedIn(true);
            setNotification({type: "success", message: "Daily vitals logged successfully!"});
            setTimeout(() => setNotification(null), 3000);
        }
      } catch(e) { alert("Failed to log check-in"); }
  };

  const handleSaveProfile = async () => {
      await fetch("http://127.0.0.1:5001/api/user/profile/update", {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ email: user.email, ...profileData })
      });
      setIsEditing(false);
  };

  // Analytics Helpers
  const analytics = useMemo(() => {
    if(!sessionHistory.length) return null;
    const radarData = [
        { subject: 'Consistency', A: Math.min(sessionHistory.length * 5, 100), fullMark: 100 },
        { subject: 'Form', A: sessionHistory.reduce((a,b)=>a+(b.qualityScore||0),0)/sessionHistory.length, fullMark: 100 },
        { subject: 'Stamina', A: Math.min(sessionHistory.reduce((a,b)=>a+(b.duration||0),0)/60, 100), fullMark: 100 },
    ];
    return { radarData };
  }, [sessionHistory]);

  return (
    <div className="profile-container-v2">
      <div className="profile-wrapper-v2">
        
        {/* --- HEADER --- */}
        <div className="hero-header">
            <div className="hero-content">
                <div className="avatar-circle">{profileData.name?.[0] || "U"}</div>
                <div>
                    <h1>{profileData.name || "Patient"}</h1>
                    <div className="badges-row">
                        <span className="badge primary"><Activity size={14}/> Recovery Mode</span>
                        <span className="badge secondary">ID: {user?.email?.split('@')[0]}</span>
                    </div>
                </div>
            </div>
            <div className="hero-actions">
                 <button className="download-btn" onClick={() => alert("Downloading PDF Report...")}>
                    <Download size={18}/> Export Report
                 </button>
            </div>
        </div>

        {/* --- NOTIFICATION --- */}
        <AnimatePresence>
            {notification && (
                <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="notification-banner success">
                    <CheckCircle size={20}/> <span>{notification.message}</span>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="main-grid">
            
            {/* --- LEFT COLUMN --- */}
            <div className="left-column">
                
                {/* 1. DAILY CHECK-IN (NEW) */}
                <motion.div className="glass-card checkin-card" initial={{y:10, opacity:0}} animate={{y:0, opacity:1}}>
                    <div className="card-header-row">
                        <h3><Thermometer size={18} color="#F59E0B"/> Daily Check-in</h3>
                        {hasCheckedIn && <span className="done-badge"><CheckCircle size={12}/> Done</span>}
                    </div>
                    {!hasCheckedIn ? (
                        <div className="checkin-form">
                            <label>Pain Level (1-10)</label>
                            <input type="range" min="1" max="10" value={todaysPain} onChange={e=>setTodaysPain(e.target.value)} className="pain-slider"/>
                            <div className="slider-vals"><span>😊 1</span><span>😫 10</span></div>
                            
                            <label style={{marginTop: 10}}>Fatigue</label>
                            <div className="fatigue-opts">
                                {["Low", "Medium", "High"].map(opt => (
                                    <button key={opt} className={`f-btn ${todaysFatigue===opt?"active":""}`} onClick={()=>setTodaysFatigue(opt)}>{opt}</button>
                                ))}
                            </div>
                            <button className="submit-checkin-btn" onClick={handleCheckin}>Log Status</button>
                        </div>
                    ) : (
                        <div className="checkin-summary">
                            <div className="summary-item">
                                <span className="lbl">Pain Today</span>
                                <span className="val" style={{color: todaysPain > 5 ? '#EF4444' : '#10B981'}}>{todaysPain}/10</span>
                            </div>
                            <div className="summary-item">
                                <span className="lbl">Fatigue</span>
                                <span className="val">{todaysFatigue}</span>
                            </div>
                            <p className="streak-msg">🔥 Great job tracking your recovery!</p>
                        </div>
                    )}
                </motion.div>

                {/* 2. VITALS */}
                <motion.div className="glass-card">
                    <div className="card-header-row">
                        <h3><Heart size={18} color="#EF4444"/> Vitals</h3>
                        <button className="icon-btn" onClick={()=> isEditing ? handleSaveProfile() : setIsEditing(true)}>
                            {isEditing ? <Save size={16}/> : <Edit2 size={16}/>}
                        </button>
                    </div>
                    <div className="vitals-grid">
                        <VitalRow icon={<Clock size={14}/>} label="Age" val={profileData.age} edit={isEditing} onChange={v=>setProfileData({...profileData, age:v})} unit="yrs"/>
                        <VitalRow icon={<Scale size={14}/>} label="Weight" val={profileData.weight} edit={isEditing} onChange={v=>setProfileData({...profileData, weight:v})} unit="kg"/>
                        <VitalRow icon={<Droplet size={14}/>} label="Blood" val={profileData.bloodGroup} edit={isEditing} onChange={v=>setProfileData({...profileData, bloodGroup:v})} unit=""/>
                    </div>
                </motion.div>

                {/* 3. RADAR STATS */}
                <motion.div className="glass-card">
                    <h3><Zap size={18} color="#3B82F6"/> Physio Score</h3>
                    <div style={{height: 200, marginTop: 10}}>
                        {analytics ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <RadarChart outerRadius="70%" data={analytics.radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{fontSize:10}}/>
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false}/>
                                    <Radar name="My Stats" dataKey="A" stroke="#69B341" fill="#69B341" fillOpacity={0.4}/>
                                    <Tooltip/>
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : <div className="empty-txt">No data yet</div>}
                    </div>
                </motion.div>
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="right-column">
                
                {/* 1. ASSIGNED PROTOCOL */}
                <div className="section-title">
                    <h3><ClipboardList size={20}/> Active Protocol</h3>
                    <span className="subtitle">Dr. Therapist's Orders</span>
                </div>
                <div className="protocol-list-v2">
                    {assignedExercises.length > 0 ? (
                        assignedExercises.map((ex, i) => (
                            <Link to="/track" state={{exercise: ex.title}} key={i} className="protocol-row">
                                <div className="p-icon" style={{background: ex.color, color: ex.iconColor}}>{ex.title[0]}</div>
                                <div className="p-info">
                                    <h4>{ex.title}</h4>
                                    <span>{ex.difficulty} • {ex.duration}</span>
                                </div>
                                <div className="p-action"><Play size={16}/></div>
                            </Link>
                        ))
                    ) : (
                        <div className="empty-protocol-box">
                            <p>No active assignments found.</p>
                            <small>Ask your therapist to assign exercises.</small>
                        </div>
                    )}
                </div>

                {/* 2. ACTIVITY HEATMAP */}
                <motion.div className="glass-card full-width" style={{marginTop: 24}}>
                    <div className="card-header-row"><h3><Calendar size={18} color="#10B981"/> Consistency Map</h3></div>
                    <ActivityHeatmap history={sessionHistory} />
                </motion.div>

                {/* 3. HISTORY CHART */}
                <motion.div className="glass-card full-width">
                     <div className="card-header-row"><h3><TrendingUp size={18} color="#8B5CF6"/> Recovery Trend</h3></div>
                     <div style={{height: 200}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sessionHistory.slice(0,10).reverse()}>
                                <defs>
                                    <linearGradient id="col" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                                <Tooltip contentStyle={{borderRadius: 10, border: 'none'}}/>
                                <Area type="monotone" dataKey="qualityScore" stroke="#8B5CF6" fill="url(#col)"/>
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </motion.div>

            </div>
        </div>
      </div>
      
      {/* Inline Styles for brevity */}
      <style>{`
        .profile-container-v2 { background: #F8FAFC; min-height: 100vh; padding: 20px; font-family: 'Inter', sans-serif; }
        .profile-wrapper-v2 { max-width: 1100px; margin: 0 auto; }
        .hero-header { background: white; padding: 25px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 25px; }
        .hero-content { display: flex; gap: 20px; align-items: center; }
        .avatar-circle { width: 70px; height: 70px; background: #69B341; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; }
        .badges-row { display: flex; gap: 8px; margin-top: 5px; }
        .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .badge.primary { background: #DCFCE7; color: #166534; }
        .badge.secondary { background: #F3F4F6; color: #4B5563; }
        .download-btn { background: #1F2937; color: white; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; }
        
        .main-grid { display: grid; grid-template-columns: 300px 1fr; gap: 25px; }
        .glass-card { background: white; padding: 20px; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 2px 5px rgba(0,0,0,0.02); margin-bottom: 20px; }
        .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .card-header-row h3 { margin: 0; font-size: 1rem; color: #374151; display: flex; align-items: center; gap: 8px; }

        /* Checkin Styles */
        .checkin-card { background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%); border: 1px solid #FEF3C7; }
        .pain-slider { width: 100%; margin: 10px 0; accent-color: #F59E0B; }
        .slider-vals { display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-bottom: 15px; }
        .fatigue-opts { display: flex; gap: 5px; margin-top: 5px; margin-bottom: 15px; }
        .f-btn { flex: 1; padding: 6px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
        .f-btn.active { background: #F59E0B; color: white; border-color: #F59E0B; }
        .submit-checkin-btn { width: 100%; padding: 8px; background: #1F2937; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .done-badge { font-size: 0.75rem; background: #D1FAE5; color: #065F46; padding: 2px 8px; border-radius: 10px; display: flex; align-items: center; gap: 4px; }
        .checkin-summary { text-align: center; }
        .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .summary-item .val { font-weight: bold; }
        .streak-msg { font-size: 0.85rem; color: #F59E0B; margin-top: 10px; font-weight: 600; }

        /* Vitals */
        .vitals-grid { display: flex; flex-direction: column; gap: 10px; }
        .vital-row { display: flex; justify-content: space-between; padding: 8px; background: #F9FAFB; border-radius: 8px; font-size: 0.9rem; }
        .vital-lbl { display: flex; align-items: center; gap: 8px; color: #6B7280; }
        .vital-input { width: 60px; text-align: right; border: 1px solid #ccc; border-radius: 4px; padding: 2px; }

        /* Protocol List */
        .protocol-list-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
        .protocol-row { background: white; border: 1px solid #E5E7EB; padding: 12px; border-radius: 12px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; transition: 0.2s; }
        .protocol-row:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .p-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; }
        .p-info { flex: 1; }
        .p-info h4 { margin: 0; font-size: 0.95rem; }
        .p-info span { font-size: 0.75rem; color: #6B7280; }
        .p-action { color: #1F2937; }
        .empty-protocol-box { grid-column: 1 / -1; padding: 30px; text-align: center; background: #F9FAFB; border: 1px dashed #ccc; border-radius: 12px; color: #666; }

        .notification-banner { position: fixed; top: 20px; right: 20px; background: #D1FAE5; padding: 12px 20px; border-radius: 10px; display: flex; align-items: center; gap: 10px; color: #065F46; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; }

        @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

const VitalRow = ({icon, label, val, unit, edit, onChange}) => (
    <div className="vital-row">
        <div className="vital-lbl">{icon} {label}</div>
        <div>
            {edit ? <input className="vital-input" value={val} onChange={e=>onChange(e.target.value)}/> : <strong>{val||"--"} {unit}</strong>}
        </div>
    </div>
);

export default Profile;