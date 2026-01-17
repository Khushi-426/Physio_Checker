// PatientHome.jsx
// Full rebuild: Ambient + Glass + Abstract Body (inline fallback + external asset support)
// Preserves original fetch logic & calculations.

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const PatientHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- state (original fetch logic preserved) ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    avgAccuracy: 0,
    totalSessions: 0,
    totalReps: 0
  });

  // fetch function — unchanged logic (only error text standardized)
  const fetchSessionHistory = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/sessions/my-history?email=${user.email}`);
      if (!response.ok) throw new Error("Failed to sync session data.");
      const data = await response.json();
      setHistory(data);

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

  // --- Inline SVG fallback (polished abstract body) ---
  const AbstractBodySVG = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 400 900"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="gBody" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#bff3e6" stopOpacity="0.95" />
          <stop offset="1" stopColor="#bfe7ff" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blurred" />
          <feMerge>
            <feMergeNode in="blurred" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* soft halo behind body */}
      <circle cx="200" cy="350" r="220" fill="url(#gBody)" opacity="0.12" />

      {/* simplified wireframe body */}
      <g transform="translate(0, -30)" stroke="#dffaf6" strokeWidth="1.6" fill="none" filter="url(#glow)" opacity="0.98">
        <path d="M190 160 C170 180 160 240 170 300 C180 380 220 380 230 300 C240 240 230 180 210 160" />
        <path d="M200 120 C195 122 190 140 200 155 C210 140 205 122 200 120" />
        <ellipse cx="200" cy="100" rx="28" ry="36" />
        <path d="M170 200 C130 220 120 300 125 360" />
        <path d="M230 200 C270 220 280 300 275 360" />
        <path d="M190 380 C180 520 170 620 170 740" />
        <path d="M210 380 C220 520 230 620 230 740" />
      </g>

      {/* nodes */}
      {[
        [200, 130], [180, 190], [220, 190], [170, 320], [230, 320], [190, 480], [210, 480], [200, 700]
      ].map((p, i) => (
        <g key={i} transform={`translate(${p[0]}, ${p[1]})`} opacity="0.95">
          <circle r="7" fill="#fff9c4" />
          <circle r="4" fill="#fff" />
        </g>
      ))}

      {/* subtle connective strands */}
      <g stroke="#dff7ee" strokeWidth="0.9" opacity="0.7">
        <path d="M200 130 L180 190 L170 320 L190 480 L200 700" />
        <path d="M200 130 L220 190 L230 320 L210 480" />
      </g>
    </svg>
  );

  // small presentational cards (glass)
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
      {/* Ambient background (fixed, under everything) */}
      <div className="pc-ambient" />

      {/* Abstract body atmosphere (absolute) */}
      <div className="pc-body-atmosphere" aria-hidden>
        {/* External asset - put /abstract-body.svg or /sag.png in public/ for this to load */}
        <img
          src="/abstract-body.svg"
          alt=""
          className="pc-body-img"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        {/* Inline fallback always present behind image: visible when image not loaded */}
        <AbstractBodySVG className="pc-body-fallback" />
      </div>

      {/* Main content area — offset to the right to show atmosphere */}
      <main className="pc-content">
        <header className="pc-header">
          <div>
            <h1 className="pc-title">Recovery Analytics</h1>
            <div className="pc-subtitle">Patient Portal • {user?.name || "Guest"}</div>
          </div>
          <div className={`pc-sync ${loading ? "loading" : error ? "error" : "ok"}`}>
            <span className="pc-sync-dot" /> {loading ? "SYNCING DATABASE..." : error ? "OFFLINE" : "DATABASE SYNCED"}
          </div>
        </header>

        {/* Stats row (floating glass cards) */}
        <section className="pc-stats-row">
          <StatCard Icon={CheckCircle} label="Avg. Accuracy" value={`${stats.avgAccuracy}%`} subLabel="Target: >85%" colorHex="#10B981" />
          <StatCard Icon={Activity} label="Total Workouts" value={stats.totalSessions} subLabel="Sessions Completed" colorHex="#3B82F6" />
          <StatCard Icon={Dumbbell} label="Total Reps" value={stats.totalReps} subLabel="Lifetime Repetitions" colorHex="#F59E0B" />
        </section>

        {/* Large glass table section */}
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

        {/* Floating CTA (keeps left hotspot clear) */}
        <motion.button className="pc-fab" whileHover={{ scale: 1.04 }} onClick={() => navigate("/track")}>
          <Play size={16} /> <span>Start New Session</span>
        </motion.button>
      </main>
    </div>
  );
};

export default PatientHome;
