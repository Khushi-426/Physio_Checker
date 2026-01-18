// frontend/src/pages/TherapistPatientDetail.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Activity,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Dumbbell,
  Droplet,
  PieChart as PieIcon,
  Zap
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

const TherapistPatientDetail = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real Data States
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [stats, setStats] = useState({
    accuracyTrend: [],
    errorRates: [],
    overallAccuracy: 0,
    totalReps: 0,
    totalDurationMin: 0,
    focusDistribution: [],
    mostFrequentExercise: "None",
    sessionsLastWeek: 0
  });

  // --- SAFE RENDER HELPER ---
  const safeRender = (value, fallback = "--") => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return fallback;
    }
    return value;
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Profile
        const profileReq = axios.post("http://localhost:5001/api/user/profile/get", { email });
        // 2. Fetch Session History
        const historyReq = axios.get(`http://localhost:5001/api/sessions/my-history?email=${email}`);
        // 3. Fetch Assigned Exercises
        const assignedReq = axios.get(`http://localhost:5001/api/exercises?email=${email}`);

        const [profileRes, historyRes, assignedRes] = await Promise.all([
          profileReq,
          historyReq,
          assignedReq
        ]);

        // --- PROCESS PROFILE ---
        setProfile(profileRes.data);

        // --- PROCESS HISTORY & ANALYTICS ---
        const rawHistory = historyRes.data || [];
        setHistory(rawHistory);

        if (rawHistory.length > 0) {
          // A. Accuracy Trend (Last 10 sessions)
          const trendData = rawHistory
            .slice(0, 10)
            .reverse()
            .map(session => ({
              date: new Date(session.performedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              accuracy: Number(session.qualityScore) || 0
            }));
          
          // B. Overall Accuracy & Totals
          const totalAcc = rawHistory.reduce((sum, s) => sum + (Number(s.qualityScore) || 0), 0);
          let avgAcc = Math.round(totalAcc / rawHistory.length);
          if (Number.isNaN(avgAcc)) avgAcc = 0;

          const totalReps = rawHistory.reduce((sum, s) => sum + (s.reps || 0), 0);
          const totalDurationSec = rawHistory.reduce((sum, s) => sum + (s.duration || 0), 0);

          // C. Exercise Distribution & Errors
          const exerciseGroups = {};
          let lastWeekCount = 0;
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

          rawHistory.forEach(s => {
            const name = s.exerciseType || "Unknown";
            if (!exerciseGroups[name]) exerciseGroups[name] = { totalErr: 0, count: 0 };
            
            const acc = Number(s.qualityScore) || 0;
            exerciseGroups[name].totalErr += (100 - acc);
            exerciseGroups[name].count += 1;

            if (new Date(s.performedAt).getTime() > oneWeekAgo) {
              lastWeekCount++;
            }
          });

          // Sort for "Most Frequent"
          const sortedEx = Object.keys(exerciseGroups).sort((a,b) => exerciseGroups[b].count - exerciseGroups[a].count);
          const mostFrequent = sortedEx[0] || "None";

          // Format for Pie Chart
          const pieData = Object.keys(exerciseGroups).map(name => ({
            name,
            value: exerciseGroups[name].count
          }));

          // Format for Error Bar Chart
          const errorData = Object.keys(exerciseGroups).map(name => {
            const avgError = exerciseGroups[name].totalErr / exerciseGroups[name].count;
            return {
              name,
              error: Number.isNaN(avgError) ? 0 : Math.round(avgError)
            };
          });

          setStats({
            accuracyTrend: trendData,
            errorRates: errorData,
            overallAccuracy: avgAcc,
            totalReps,
            totalDurationMin: Math.round(totalDurationSec / 60),
            focusDistribution: pieData,
            mostFrequentExercise: mostFrequent,
            sessionsLastWeek: lastWeekCount
          });
        }

        // --- PROCESS ASSIGNED EXERCISES ---
        const allExercises = assignedRes.data || [];
        const activeAssigned = allExercises.filter(ex => ex.recommended || ex.assignedDetails);
        setAssigned(activeAssigned);

      } catch (err) {
        console.error("Error fetching patient details:", err);
        setError("Failed to load patient data.");
      } finally {
        setLoading(false);
      }
    };

    if (email) fetchPatientData();
  }, [email]);

  // --- COLORS (For Charts) ---
  const COLORS = ['#26658C', '#54ACBF', '#023859', '#A7EBF2', '#8884d8'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#26658C]"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-[#011C40]">
        <AlertCircle className="w-12 h-12 text-[#D32F2F] mb-4" />
        <h2 className="text-xl font-bold">Unable to Load Patient Record</h2>
        <p className="text-gray-500 mb-6">{error || "Patient not found."}</p>
        <button onClick={() => navigate(-1)} className="text-[#26658C] hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-12">
      
      {/* --- HEADER (Structural Authority) --- */}
      <header className="bg-[#011C40] text-white sticky top-0 z-20 px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Medical Report</h1>
              <p className="text-sm text-gray-300 flex items-center gap-2 opacity-80">
                <span className="font-semibold">{profile.name}</span>
                <span>|</span> 
                {profile.email}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <span className="px-4 py-1.5 bg-[#26658C] text-white rounded-md text-sm font-medium shadow-sm flex items-center gap-2">
                <Activity className="w-4 h-4" /> Active Protocol
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* --- VITALS & HIGH LEVEL STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Card Component Helper */}
          {[{
             icon: Calendar, label: "Age", value: `${safeRender(profile.age)} yrs`, color: "text-[#54ACBF]", bg: "bg-[#A7EBF2]/20"
            }, {
             icon: User, label: "Weight", value: `${safeRender(profile.weight)} kg`, color: "text-[#54ACBF]", bg: "bg-[#A7EBF2]/20"
            }, {
             icon: Droplet, label: "Blood Type", value: safeRender(profile.bloodGroup), color: "text-[#54ACBF]", bg: "bg-[#A7EBF2]/20"
            }, {
             icon: TrendingUp, label: "Avg Accuracy", value: `${stats.overallAccuracy}%`, color: stats.overallAccuracy >= 80 ? "text-green-600" : "text-[#26658C]", bg: "bg-[#A7EBF2]/20"
            }, {
             icon: Zap, label: "Total Sessions", value: history.length, color: "text-[#26658C]", bg: "bg-[#A7EBF2]/20"
          }].map((item, idx) => (
             <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center text-center">
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-full flex items-center justify-center mb-3`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider">{item.label}</p>
                <p className="text-lg font-bold text-[#011C40]">{item.value}</p>
             </div>
          ))}
        </div>

        {/* --- ROW 1: TRENDS & DISTRIBUTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ACCURACY TREND */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#011C40] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#26658C]" /> Recovery Trend
                </h2>
                <p className="text-sm text-gray-500">Form accuracy over last 10 sessions</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {stats.accuracyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.accuracyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#26658C" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#26658C", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#023859" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Not enough data.</div>
              )}
            </div>
          </div>

          {/* EXERCISE DISTRIBUTION (New Feature) */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-[#011C40] flex items-center gap-2 mb-2">
              <PieIcon className="w-5 h-5 text-[#26658C]" /> Focus Distribution
            </h2>
            <p className="text-sm text-gray-500 mb-4">Breakdown of performed exercises</p>
            
            <div className="flex-1 min-h-[250px]">
              {stats.focusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.focusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.focusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available.</div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
               {stats.focusDistribution.map((entry, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                    <span>{entry.name} ({entry.value})</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* --- ROW 2: DETAILED METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* ASSIGNED EXERCISES */}
           <div className="md:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <h2 className="text-lg font-bold text-[#011C40] flex items-center gap-2 mb-4">
              <Dumbbell className="w-5 h-5 text-[#26658C]" /> Assigned Protocol
            </h2>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {assigned.length > 0 ? assigned.map((ex, idx) => (
                <div key={idx} className="p-4 rounded-md border-l-4 border-[#26658C] bg-gray-50 hover:bg-[#A7EBF2]/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[#011C40]">{ex.title}</h3>
                    <span className="text-xs font-bold text-[#26658C] bg-[#A7EBF2]/30 px-2 py-1 rounded">
                      {ex.assignedDetails?.difficulty || "Medium"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ex.assignedDetails?.sets || 3} Sets</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {ex.assignedDetails?.reps || 10} Reps</span>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 text-center py-4">No exercises assigned.</p>
              )}
            </div>
            <button 
              onClick={() => navigate('/therapist/assignments')}
              className="w-full mt-4 py-2.5 bg-[#26658C] text-white rounded-md hover:bg-[#023859] transition-colors font-medium text-sm shadow-sm"
            >
              Update Protocol
            </button>
          </div>

          {/* ERROR RATES */}
          <div className="md:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
             <h2 className="text-lg font-bold text-[#011C40] flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-[#26658C]" /> Form Correction Needs
             </h2>
             <div className="h-[250px] w-full">
               {stats.errorRates.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={stats.errorRates} layout="vertical" margin={{ left: 40, right: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                     <XAxis type="number" domain={[0, 100]} hide />
                     <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 13, fontWeight: 500, fill: '#011C40'}} axisLine={false} tickLine={false} />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', borderColor: '#e2e8f0' }} />
                     <Bar dataKey="error" radius={[0, 4, 4, 0]} barSize={20}>
                       {stats.errorRates.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.error > 25 ? '#D32F2F' : '#26658C'} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">No error data available.</div>
               )}
             </div>
          </div>
        </div>

        {/* --- SESSION HISTORY TABLE --- */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-[#A7EBF2]/10">
             <h2 className="text-lg font-bold text-[#011C40] flex items-center gap-2">
               <CheckCircle className="w-5 h-5 text-[#26658C]" /> Completed Session Log
             </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[#011C40] text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Exercise</th>
                  <th className="px-6 py-4">Reps</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Quality Score</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((session) => (
                  <tr key={session._id} className="hover:bg-[#A7EBF2]/10 transition-colors">
                    <td className="px-6 py-4 text-[#023859] font-medium text-sm">
                      {new Date(session.performedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{session.exerciseType}</td>
                    <td className="px-6 py-4 text-gray-600">{session.reps}</td>
                    <td className="px-6 py-4 text-gray-600">{session.duration}s</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (session.qualityScore || 0) >= 80 ? 'bg-green-500' : 
                              (session.qualityScore || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${session.qualityScore || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{session.qualityScore || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        Done
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
               <div className="p-12 text-center text-gray-400">No history found.</div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default TherapistPatientDetail;