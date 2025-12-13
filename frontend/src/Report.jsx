import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

const Report = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/report_data')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{height:'100vh', background:'var(--bg-color)', color:'var(--text-primary)', display:'flex', alignItems:'center', justifyContent:'center'}}>Generating Report...</div>;

  if (!data || !data.summary) {
    return (
        <div style={{height:'100vh', background:'var(--bg-color)', color:'var(--text-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px'}}>
            <h2>No Session Data Found</h2>
            <p style={{color:'var(--text-secondary)'}}>The session data was lost or no workout was performed.</p>
            <button 
                onClick={() => navigate('/')} 
                style={{padding:'12px 24px', background:'var(--primary-color)', color:'#fff', border:'none', borderRadius:'30px', cursor:'pointer', fontWeight:'bold', boxShadow: '0 5px 15px rgba(118, 176, 65, 0.4)'}}
            >
                Return to Dashboard
            </button>
        </div>
    );
  }

  const { summary } = data;
  const totalReps = summary.RIGHT.total_reps + summary.LEFT.total_reps;

  // --- Recommendation Logic ---
  const getRecommendations = () => {
    const recs = [];
    if (totalReps === 0) {
      return [{ title: "Start Up", text: "No reps detected. Ensure you are visible in the frame next time.", color: "#aaa" }];
    }

    // Tempo
    const rTime = summary.RIGHT.min_time;
    const lTime = summary.LEFT.min_time;
    if (rTime > 0 && lTime > 0) {
        const ratio = Math.max(rTime, lTime) / Math.min(rTime, lTime);
        if (ratio > 1.25) {
            const slower = rTime > lTime ? 'RIGHT' : 'LEFT';
            recs.push({ title: "Tempo Imbalance", text: `Your ${slower} arm is significantly slower. Try to match the speed of both arms.`, color: "#ff9800" });
        } else if (rTime < 1.5) {
            recs.push({ title: "Too Fast", text: "Slow down! Fast reps reduce muscle tension. Aim for 2-3 seconds per rep.", color: "#D32F2F" });
        } else {
            recs.push({ title: "Great Tempo", text: "Your repetition speed is consistent and controlled. Keep it up!", color: "var(--primary-color)" });
        }
    }

    // Form
    const rErr = summary.RIGHT.error_count;
    const lErr = summary.LEFT.error_count;
    if (rErr > 0 || lErr > 0) {
        const side = rErr > lErr ? "RIGHT" : (lErr > rErr ? "LEFT" : "BOTH");
        recs.push({ title: `Form Check (${side})`, text: `Detected ${rErr + lErr} form errors (Over-curl/Over-extend). Focus on stopping before locking out your elbows.`, color: "#D32F2F" });
    } else {
        recs.push({ title: "Perfect Form", text: "Zero form errors detected! Your technique is solid.", color: "var(--primary-color)" });
    }

    // Balance
    const diff = Math.abs(summary.RIGHT.total_reps - summary.LEFT.total_reps);
    if (diff > 2) {
        recs.push({ title: "Muscle Imbalance", text: `You did ${diff} more reps on one side. Always finish your set with equal reps.`, color: "#ff9800" });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  // Animation Variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', padding: '40px', fontFamily: 'sans-serif' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom:'1px solid rgba(0,0,0,0.05)', paddingBottom:'20px' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>Session <span style={{color: 'var(--primary-color)'}}>Report</span></h1>
                <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>Duration: {data.duration} seconds</p>
            </div>
            <button onClick={() => navigate('/')} style={{ background:'white', border:'1px solid #eee', color:'var(--text-primary)', padding:'10px 20px', borderRadius:'30px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                <ArrowLeft size={18} /> Back to Dashboard
            </button>
        </header>

        <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            
            {/* Total Summary */}
            <motion.div variants={item} style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '20px', textAlign: 'center', gridColumn: '1 / -1', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '5rem', fontWeight: '900', color: 'var(--primary-color)', lineHeight: 1 }}>{totalReps}</div>
                <div style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '2px', fontWeight: '600', marginTop: '10px' }}>Total Repetitions</div>
            </motion.div>

            {/* Right Arm Card */}
            <motion.div variants={item} style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '20px', borderTop: '5px solid #D32F2F', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <h2 style={{ color: '#D32F2F', display: 'flex', alignItems: 'center', gap: '10px' }}>RIGHT ARM <Activity size={20}/></h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
                    <span style={{color: 'var(--text-secondary)'}}>Reps</span> <span style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>{summary.RIGHT.total_reps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
                    <span style={{color: 'var(--text-secondary)'}}>Best Time</span> <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{summary.RIGHT.min_time.toFixed(2)}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{color: 'var(--text-secondary)'}}>Errors</span> <span style={{ fontWeight: 'bold', color: summary.RIGHT.error_count > 0 ? '#D32F2F' : 'var(--primary-color)' }}>{summary.RIGHT.error_count}</span>
                </div>
            </motion.div>

            {/* Left Arm Card */}
            <motion.div variants={item} style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '20px', borderTop: '5px solid var(--primary-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <h2 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>LEFT ARM <Activity size={20}/></h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
                    <span style={{color: 'var(--text-secondary)'}}>Reps</span> <span style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>{summary.LEFT.total_reps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
                    <span style={{color: 'var(--text-secondary)'}}>Best Time</span> <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{summary.LEFT.min_time.toFixed(2)}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{color: 'var(--text-secondary)'}}>Errors</span> <span style={{ fontWeight: 'bold', color: summary.LEFT.error_count > 0 ? '#D32F2F' : 'var(--primary-color)' }}>{summary.LEFT.error_count}</span>
                </div>
            </motion.div>

            {/* Recommendations Panel */}
            <motion.div variants={item} style={{ background: '#fff', padding: '30px', borderRadius: '20px', gridColumn: '1 / -1', marginTop: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <h3 style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px', color: 'var(--text-primary)' }}>AI Analysis & Recommendations</h3>
                
                {recommendations.length > 0 ? recommendations.map((rec, index) => (
                    <div key={index} style={{ marginBottom: '25px', display: 'flex', gap: '15px' }}>
                        <div style={{ paddingTop: '2px' }}>
                           {rec.title.includes("Perfect") || rec.title.includes("Great") ? <CheckCircle color={rec.color} size={24} /> : <AlertTriangle color={rec.color} size={24} />}
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', color: rec.color, fontSize: '1.1rem' }}>{rec.title}</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5' }}>{rec.text}</p>
                        </div>
                    </div>
                )) : <div style={{color:'var(--text-secondary)'}}>No specific recommendations available.</div>}
            </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default Report;