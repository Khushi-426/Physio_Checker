// frontend/src/Report.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { 
    Calendar, 
    Activity, 
    ClipboardCheck, 
    Timer, 
    TrendingUp, 
    Download,
    ChevronLeft
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './App.css'; // Assuming global styles or reuse existing css

const Report = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyStats, setDailyStats] = useState({
        totalReps: 0,
        avgAccuracy: 0,
        totalSessions: 0,
        durationMinutes: 0,
        sessions: []
    });

    useEffect(() => {
        const fetchDailyReport = async () => {
            try {
                setLoading(true);
                let token = user?.token;
                if (!token) {
                    const stored = localStorage.getItem('physio_user');
                    if (stored) token = JSON.parse(stored).token;
                }

                if (!token) return;

                // Fetch full history - In a production app, you might want an endpoint that accepts a date query
                const res = await axios.get('http://localhost:5000/api/sessions/my-history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const allHistory = res.data || [];
                
                // Filter for the selected date
                const selectedDateStart = new Date(reportDate);
                selectedDateStart.setHours(0, 0, 0, 0);
                const selectedDateEnd = new Date(reportDate);
                selectedDateEnd.setHours(23, 59, 59, 999);

                const todaysSessions = allHistory.filter(session => {
                    const sessionDate = new Date(session.performedAt || session.timestamp * 1000);
                    return sessionDate >= selectedDateStart && sessionDate <= selectedDateEnd;
                });

                // Calculate Daily Stats
                if (todaysSessions.length > 0) {
                    const totalReps = todaysSessions.reduce((acc, s) => acc + (s.reps || 0), 0);
                    const totalScore = todaysSessions.reduce((acc, s) => acc + (s.qualityScore || 0), 0);
                    const avgAccuracy = Math.round(totalScore / todaysSessions.length);
                    // Estimate duration if not provided (e.g., 2 mins per session approx)
                    const duration = todaysSessions.reduce((acc, s) => acc + (s.duration || 120), 0); 

                    setDailyStats({
                        totalReps,
                        avgAccuracy,
                        totalSessions: todaysSessions.length,
                        durationMinutes: Math.round(duration / 60),
                        sessions: todaysSessions.map(s => ({
                            ...s,
                            time: new Date(s.performedAt || s.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            name: s.protocol?.exerciseName || s.exercise || "Exercise"
                        }))
                    });
                } else {
                    setDailyStats({
                        totalReps: 0,
                        avgAccuracy: 0,
                        totalSessions: 0,
                        durationMinutes: 0,
                        sessions: []
                    });
                }

            } catch (err) {
                console.error("Error fetching report data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDailyReport();
    }, [user, reportDate]);

    // Data for charts
    const chartData = dailyStats.sessions.map((s, i) => ({
        name: s.time,
        accuracy: s.qualityScore || 0,
        reps: s.reps || 0
    })).reverse(); // Show oldest to newest left to right

    return (
        <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <ClipboardCheck className="text-blue-600" />
                            Daily Clinical Report
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Detailed analysis of physical therapy performance
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                        <Calendar size={18} className="text-slate-500" />
                        <input 
                            type="date" 
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-700 font-medium"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                        <Download size={18} />
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <StatBox 
                            icon={Activity} 
                            label="Avg Accuracy" 
                            value={`${dailyStats.avgAccuracy}%`} 
                            color="text-emerald-600" 
                            bgColor="bg-emerald-50"
                        />
                        <StatBox 
                            icon={TrendingUp} 
                            label="Total Reps" 
                            value={dailyStats.totalReps} 
                            color="text-blue-600" 
                            bgColor="bg-blue-50"
                        />
                        <StatBox 
                            icon={ClipboardCheck} 
                            label="Sessions Completed" 
                            value={dailyStats.totalSessions} 
                            color="text-purple-600" 
                            bgColor="bg-purple-50"
                        />
                        <StatBox 
                            icon={Timer} 
                            label="Active Duration" 
                            value={`${dailyStats.durationMinutes} min`} 
                            color="text-orange-600" 
                            bgColor="bg-orange-50"
                        />
                    </div>

                    {dailyStats.sessions.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Chart */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Accuracy Trend (Today)</h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#64748B', fontSize: 12}} 
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#64748B', fontSize: 12}} 
                                                domain={[0, 100]}
                                            />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="accuracy" 
                                                stroke="#2563EB" 
                                                strokeWidth={3} 
                                                dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}}
                                                activeDot={{r: 6}}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Session Breakdown List */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Session Breakdown</h3>
                                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                    {dailyStats.sessions.map((session, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 mb-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-10 rounded-full ${getScoreColor(session.qualityScore)}`}></div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">{session.name}</h4>
                                                    <span className="text-xs text-slate-500">{session.time}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-700">{session.reps} Reps</div>
                                                <div className={`text-xs font-bold ${getTextColor(session.qualityScore)}`}>
                                                    {session.qualityScore}% Acc
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="text-slate-400" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800">No Data Available</h3>
                            <p className="text-slate-500 mt-2">
                                No therapy sessions recorded for {new Date(reportDate).toLocaleDateString()}.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Helper Components & Functions
const StatBox = ({ icon: Icon, label, value, color, bgColor }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
    >
        <div className={`p-4 rounded-xl ${bgColor} ${color}`}>
            <Icon size={28} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </motion.div>
);

const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
};

const getTextColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
};

export default Report;