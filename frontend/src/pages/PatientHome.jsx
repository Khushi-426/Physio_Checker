// frontend/src/pages/PatientHome.jsx

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Play,
  Activity,
  CheckCircle,
  Dumbbell,
  History,
  AlertCircle,
  RefreshCw,
  Calendar
} from "lucide-react";
import "./PatientHome.css";

// Ensure this matches your Flask backend port (default 5001)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const PatientHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    avgAccuracy: 0,
    totalSessions: 0,
    totalReps: 0
  });

  // --- DATA FETCHING ---
  const fetchSessionHistory = useCallback(async () => {
    // If no user is logged in yet, wait (keep loading or just return)
    if (!user?.email) {
      // If auth is done but no user, stop loading
      if (user === null) setLoading(false); 
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching history for: ${user.email} from ${API_URL}`);
      const response = await fetch(`${API_URL}/api/sessions/my-history?email=${user.email}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setHistory(data);

      // Calculate Stats
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
      setError("Could not load data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Trigger fetch on mount or when user changes
  useEffect(() => {
    fetchSessionHistory();
  }, [fetchSessionHistory]);

  // --- RENDER HELPERS ---
  const StatCard = ({ label, value, subLabel, Icon, colorHex }) => (
    <motion.div className="pc-stat-card" whileHover={{ y: -6 }}>
      <div className="pc-stat-icon" style={{ background: `${colorHex}20`, color: colorHex }}>
        <Icon size={18} />
      </div>
      <div className="pc-stat-text">
        <div className="pc-stat-label">{label}</div>
        <div className="pc-stat-value">{value}</div>
        {subLabel && <div className="pc-stat-sub">{subLabel}</div>}
      </div>
    </motion.div>
  );

  return (
    <div className="pc-root">
      {/* Background is handled in CSS via .pc-ambient */}
      <div className="pc-ambient" />

      {/* Main Content */}
      <main className="pc-content">
        
        {/* Header */}
        <header className="pc-header">
          <div>
            <h1 className="pc-title">Recovery Analytics</h1>
            <div className="pc-subtitle">Patient Portal • {user?.name || "Guest"}</div>
          </div>
          <div className={`pc-sync ${loading ? "loading" : error ? "error" : "ok"}`}>
            <span className="pc-sync-dot" /> 
            {loading ? "SYNCING..." : error ? "OFFLINE" : "ONLINE"}
          </div>
        </header>

        {/* Stats Row */}
        <section className="pc-stats-row">
          <StatCard Icon={CheckCircle} label="Avg. Accuracy" value={`${stats.avgAccuracy}%`} subLabel="Target: >85%" colorHex="#10B981" />
          <StatCard Icon={Activity} label="Total Workouts" value={stats.totalSessions} subLabel="Sessions Completed" colorHex="#3B82F6" />
          <StatCard Icon={Dumbbell} label="Total Reps" value={stats.totalReps} subLabel="Lifetime Repetitions" colorHex="#F59E0B" />
        </section>

        {/* History Panel */}
        <motion.section className="pc-history-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pc-history-header">
            <div className="pc-history-title"><History size={18} /> <span>Session History</span></div>
          </div>

          {loading ? (
            <div className="pc-center">Loading analytics…</div>
          ) : error ? (
            <div className="pc-center pc-error">
              <AlertCircle size={36} />
              <div className="pc-error-text">{error}</div>
              <p style={{fontSize: "0.8rem", marginTop: "10px"}}>Check if 'app.py' is running on port 5001.</p>
              <button className="pc-btn-outline" onClick={fetchSessionHistory}><RefreshCw size={14} /> Retry</button>
            </div>
          ) : history.length === 0 ? (
            <div className="pc-center pc-empty">
              <Calendar size={36} />
              <div>No sessions yet — start your first session.</div>
              <button className="pc-cta" onClick={() => navigate("/track")}>Start First Session</button>
            </div>
          ) : (
            <div className="pc-table-scroll">
              <table className="pc-table" cellSpacing="0">
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
                  {history.map(sess => (
                    <tr key={sess._id}>
                      <td>
                        <div className="pc-td-title">{sess.exerciseType}</div>
                        <div className="pc-td-sub">{sess.duration ? `${Math.floor(sess.duration / 60)}m ${Math.round(sess.duration % 60)}s` : 'N/A'}</div>
                      </td>
                      <td>
                        <div className="pc-perf">
                          <div className="pc-bar" aria-hidden>
                            <div className="pc-fill" style={{ width: `${sess.qualityScore}%`, background: sess.qualityScore > 85 ? '#10B981' : (sess.qualityScore > 60 ? '#F59E0B' : '#EF4444') }} />
                          </div>
                          <div className="pc-perc">{sess.qualityScore}%</div>
                        </div>
                      </td>
                      <td className="pc-td-strong">{sess.reps}</td>
                      <td>
                        <div className="pc-td-title">{new Date(sess.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        <div className="pc-td-sub">{new Date(sess.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td><span className="pc-pill synced">SYNCED</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* FAB */}
        <motion.button className="pc-fab" whileHover={{ scale: 1.04 }} onClick={() => navigate("/track")}>
          <Play size={16} /> <span>Start New Session</span>
        </motion.button>
      </main>
    </div>
  );
};

export default PatientHome;