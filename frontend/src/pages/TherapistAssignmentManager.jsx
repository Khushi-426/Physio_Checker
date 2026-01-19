import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronRight, User, Calendar, 
  CheckCircle, X, ArrowRight, Layers, Sparkles, 
  Hash, Activity, AlertCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// --- CONFIGURATION ---
// ✅ FIX: Pointing to Flask Port 5001 (Since your logs show it's hitting Flask)
const API_BASE = 'http://localhost:5001/api';

// --- EXERCISE DATABASE ---
const MUSCLE_EXERCISE_MAP = {
  shoulders: [
    { 
      id: 'shoulder_press', 
      name: 'Shoulder Press', 
      difficulty: 'Intermediate', 
      type: 'Strength', 
      defaultSets: 3, 
      defaultReps: 12,
      description: 'Overhead press to build deltoid strength.'
    },
    { 
      id: 'lateral_raise', 
      name: 'Lateral Raise', 
      difficulty: 'Intermediate', 
      type: 'Isolation', 
      defaultSets: 3, 
      defaultReps: 12,
      description: 'Isolation exercise to develop the side deltoids for wider shoulders.'
    }
  ],
  arms: [
    { 
      id: 'bicep_curl', 
      name: 'Bicep Curl', 
      difficulty: 'Beginner', 
      type: 'Isolation', 
      defaultSets: 3, 
      defaultReps: 10,
      description: 'Standard curl for bicep isolation and rehabilitation.'
    }
  ],
  legs: [
    { 
      id: 'squat', 
      name: 'Squat', 
      difficulty: 'Intermediate', 
      type: 'Compound', 
      defaultSets: 4, 
      defaultReps: 10,
      description: 'Compound movement for quadriceps, glutes, and core.'
    },
    { 
      id: 'knee_lift', 
      name: 'Knee Lift', 
      difficulty: 'Beginner', 
      type: 'Mobility', 
      defaultSets: 2, 
      defaultReps: 15,
      description: 'Low-impact exercise to improve hip flexion and balance.'
    }
  ],
  back: [
    { 
      id: 'standing_row', 
      name: 'Standing Row', 
      difficulty: 'Intermediate', 
      type: 'Strength', 
      defaultSets: 3, 
      defaultReps: 12,
      description: 'Pulling movement to strengthen the upper back and lats.'
    }
  ]
};

// =======================================================
// ✅ REALISTIC BODY WITH NARROW PASTEL ZONES
// =======================================================
const RealisticBody = ({ onPartClick, activePart, view }) => {
  const zones = {
    front: [
      { id: 'shoulders', x: 30, y: 15, width: 40, height: 12, rx: 6 },
      { id: 'arms', x: 25, y: 30, width: 50, height: 22, rx: 8 },
      { id: 'legs', x: 32, y: 55, width: 36, height: 40, rx: 8 }
    ],
    back: [
      { id: 'back', x: 33, y: 20, width: 34, height: 35, rx: 8 }
    ]
  };

  const activeZones = zones[view] || [];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img 
        src={view === 'front' ? "/body_front_real.png" : "/body_back_real.png"} 
        alt={`Human Anatomy ${view}`} 
        style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))' }} 
      />
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
        {activeZones.map((zone) => (
          <motion.rect
            key={zone.id}
            x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={zone.rx}
            initial={false}
            animate={{
              fill: activePart === zone.id ? "rgba(252, 165, 165, 0.35)" : "rgba(252, 165, 165, 0.0)"
            }}
            whileHover={{ 
              fill: activePart === zone.id ? "rgba(252, 165, 165, 0.45)" : "rgba(252, 165, 165, 0.15)",
              cursor: "pointer"
            }}
            transition={{ duration: 0.2 }}
            onClick={() => onPartClick(zone.id)}
          />
        ))}
      </svg>
      <div style={styles.viewLabel}>{view === 'front' ? "Frontal View" : "Dorsal View"}</div>
    </div>
  );
};

// --- TOAST NOTIFICATION COMPONENT ---
const NotificationToast = ({ message, type, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: 20 }}
    style={{
      position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: type === 'error' ? '#FEF2F2' : '#F0FDF4',
      border: `1px solid ${type === 'error' ? '#F87171' : '#4ADE80'}`,
      padding: '12px 24px', borderRadius: '50px',
      display: 'flex', alignItems: 'center', gap: '10px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000
    }}
  >
    {type === 'error' ? <AlertCircle color="#DC2626" size={20}/> : <CheckCircle color="#16A34A" size={20}/>}
    <span style={{ color: type === 'error' ? '#991B1B' : '#166534', fontWeight: 600 }}>{message}</span>
  </motion.div>
);

const TherapistAssignmentManager = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // --- STATE ---
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize patient from direct navigation
  const [selectedPatient, setSelectedPatient] = useState(location.state?.selectedPatient || null);
  
  // Track if we came directly from Dashboard (Direct Mode)
  const [isDirectMode] = useState(!!location.state?.selectedPatient);

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('front'); 
  const [activeMuscle, setActiveMuscle] = useState(null);
  const [assignedExercises, setAssignedExercises] = useState([]);
  const [prescriptions, setPrescriptions] = useState({});
  const [notification, setNotification] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`${API_BASE}/therapist/patients`);
        setPatients(res.data.patients || res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setLoading(false);
        showNotification("Failed to load patient directory", "error");
      }
    };
    fetchPatients();
  }, []);

  // --- HANDLERS ---
  const showNotification = (msg, type = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePrescriptionChange = (exId, field, value) => {
    setPrescriptions(prev => ({
      ...prev,
      [exId]: { ...prev[exId], [field]: value }
    }));
  };

  const initPrescription = (ex) => {
    if (!prescriptions[ex.id]) {
      setPrescriptions(prev => ({
        ...prev,
        [ex.id]: { sets: ex.defaultSets, reps: ex.defaultReps, duration: 14 } 
      }));
    }
  };

  const handleAssign = async (exercise) => {
    if (!selectedPatient) return;

    const config = prescriptions[exercise.id] || { sets: 3, reps: 10, duration: 14 };
    const newAssignment = { ...exercise, ...config, timestamp: Date.now() };
    setAssignedExercises(prev => [...prev, newAssignment]);
    
    try {
      // ✅ Corrected Endpoint Call matching new Flask Route
      await axios.post(`${API_BASE}/protocols/assign`, { 
        patientId: selectedPatient.id || selectedPatient._id, // Handle both ID formats
        exerciseName: exercise.name, 
        sets: parseInt(config.sets),
        reps: parseInt(config.reps),
        duration: parseInt(config.duration),
        difficulty: exercise.difficulty 
      });
      showNotification(`Assigned ${exercise.name} to ${selectedPatient.name}`, 'success');
    } catch (error) {
      console.error(error);
      showNotification("Network Error: Could not sync assignment.", 'error');
    }
  };

  const handleBack = () => {
    if (isDirectMode || !selectedPatient) {
        navigate('/therapist-dashboard');
    } else {
        setSelectedPatient(null);
        setActiveMuscle(null);
        setView('front');
    }
  };

  const visiblePatients = useMemo(() => {
    let result = [...patients];
    if (searchQuery) {
      return result.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return result.sort((a, b) => new Date(b.date_joined) - new Date(a.date_joined)).slice(0, 6);
  }, [patients, searchQuery]);

  if (loading && !selectedPatient) return <div style={styles.loadingState}>Loading Clinical Records...</div>;

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={handleBack} style={styles.backButton}>
            <ChevronRight style={{ transform: 'rotate(180deg)' }} size={20}/> 
            {(selectedPatient && !isDirectMode) ? 'Back to Directory' : 'Dashboard'}
          </button>
          
          <div>
             <h1 style={styles.title}>{selectedPatient ? selectedPatient.name : 'Patient Assignment'}</h1>
             {selectedPatient && <span style={styles.subtitle}>Prescription Management</span>}
          </div>
        </div>

        {selectedPatient && (
           <div style={styles.patientBadge}>
             <div style={{ textAlign: 'right' }}>
               <div style={styles.badgeLabel}>ACTIVE PROTOCOLS</div>
               <div style={styles.badgeValue}>{assignedExercises.length} Assigned</div>
             </div>
             <div style={styles.avatarSmall}>{selectedPatient.name.charAt(0)}</div>
           </div>
        )}
      </header>

      <main style={styles.main}>
        {!selectedPatient ? (
          // PATIENT DIRECTORY
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={styles.searchContainer}>
               <div style={styles.glassSearch}>
                <Search style={{ color: '#0ea5e9', opacity: 0.8 }} size={22} />
                <input type="text" placeholder="Search patient name or email..." style={styles.transparentInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
            </div>
            <div style={styles.gridList}>
              {visiblePatients.map((p, index) => (
                <motion.div 
                  key={p.email || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPatient(p)} style={styles.patientCard} whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                >
                  <div style={styles.cardHeader}>
                      <div style={styles.avatarRow}>{p.name ? p.name.charAt(0) : '?'}</div>
                      <span style={{ ...styles.statusDot, backgroundColor: p.status === 'High Risk' ? '#ef4444' : '#22c55e' }} />
                  </div>
                  <h3 style={styles.cardName}>{p.name}</h3>
                  <div style={styles.cardInfo}><User size={14}/> {p.email}</div>
                  <div style={styles.cardFooter}><span>Assign Protocol</span><ArrowRight size={16} /></div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          // INTERACTIVE ASSIGNMENT UI
          <div style={styles.splitLayout}>
            {/* LEFT: BODY MODEL */}
            <div style={styles.modelContainer}>
              <div style={styles.toggleContainer}>
                <button onClick={() => setView('front')} style={view === 'front' ? styles.toggleActive : styles.toggleInactive}>Front</button>
                <div style={styles.toggleDivider} />
                <button onClick={() => setView('back')} style={view === 'back' ? styles.toggleActive : styles.toggleInactive}>Back</button>
              </div>
              <div style={styles.canvasWrapper}>
                <AnimatePresence mode='wait'>
                  <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%', height: '100%' }}>
                    <RealisticBody onPartClick={setActiveMuscle} activePart={activeMuscle} view={view} />
                  </motion.div>
                </AnimatePresence>
              </div>
              {!activeMuscle && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.instructionBox}>
                    <Sparkles size={16} color="#ef4444"/><span>Select a body zone to view exercises</span>
                  </motion.div>
              )}
            </div>

            {/* RIGHT: PREMIUM EXERCISE PANEL */}
            <motion.div style={styles.panelContainer} layout>
              {activeMuscle ? (
                <>
                  <div style={styles.panelHeader}>
                    <div>
                      <h2 style={styles.panelTitle}>{activeMuscle.charAt(0).toUpperCase() + activeMuscle.slice(1)} Protocols</h2>
                      <div style={styles.panelBreadcrumb}>Clinical Library • {MUSCLE_EXERCISE_MAP[activeMuscle]?.length || 0} Available</div>
                    </div>
                    <button onClick={() => setActiveMuscle(null)} style={styles.closeBtn}><X size={20}/></button>
                  </div>
                  
                  <div style={styles.scrollArea}>
                    {(MUSCLE_EXERCISE_MAP[activeMuscle] || []).map(ex => {
                      const isAssigned = assignedExercises.find(a => a.id === ex.id);
                      const currentConfig = prescriptions[ex.id] || { sets: ex.defaultSets, reps: ex.defaultReps, duration: 14 };
                      
                      return (
                        <motion.div 
                          key={ex.id} 
                          style={styles.exerciseCard} 
                          onMouseEnter={() => initPrescription(ex)}
                          whileHover={{ y: -2 }}
                        >
                          {/* CARD TOP: INFO */}
                          <div style={styles.cardTop}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                                <div style={styles.tagsRow}>
                                    <span style={{...styles.tag, backgroundColor: '#eff6ff', color: '#1d4ed8'}}>{ex.difficulty}</span>
                                    <span style={{...styles.tag, backgroundColor: '#fdf4ff', color: '#a21caf'}}>{ex.type}</span>
                                </div>
                                {isAssigned && <CheckCircle size={20} color="#16a34a" />}
                            </div>
                            <h3 style={styles.exName}>{ex.name}</h3>
                            <p style={styles.exDesc}>{ex.description}</p>
                          </div>
                          
                          {/* CARD BOTTOM: ACTIONS */}
                          <div style={styles.cardBottom}>
                            {!isAssigned && (
                                <div style={styles.statsGrid}>
                                    <div style={styles.statBox}>
                                        <label style={styles.statLabel}><Layers size={10}/> SETS</label>
                                        <input type="number" value={currentConfig.sets} onChange={(e) => handlePrescriptionChange(ex.id, 'sets', e.target.value)} style={styles.statInput} />
                                    </div>
                                    <div style={styles.statBox}>
                                        <label style={styles.statLabel}><Hash size={10}/> REPS</label>
                                        <input type="number" value={currentConfig.reps} onChange={(e) => handlePrescriptionChange(ex.id, 'reps', e.target.value)} style={styles.statInput} />
                                    </div>
                                    <div style={styles.statBox}>
                                        <label style={styles.statLabel}><Calendar size={10}/> DAYS</label>
                                        <input type="number" value={currentConfig.duration} onChange={(e) => handlePrescriptionChange(ex.id, 'duration', e.target.value)} style={styles.statInput} />
                                    </div>
                                </div>
                            )}

                            <button onClick={() => handleAssign(ex)} disabled={!!isAssigned} style={isAssigned ? styles.btnAssigned : styles.btnAssign}>
                                {isAssigned ? "Assigned Successfully" : "Assign Protocol"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}><Activity size={32} color="#94a3b8"/></div>
                  <h3 style={styles.emptyTitle}>Clinical Workspace</h3>
                  <p style={styles.emptyText}>Select an anatomical zone from the 3D model to access specific rehabilitation protocols.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>

      {/* NOTIFICATION TOAST OVERLAY */}
      <AnimatePresence>
        {notification && (
            <NotificationToast 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification(null)}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- PREMIUM STYLES SYSTEM ---
const styles = {
  // BASE
  container: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", sans-serif', color: '#0f172a' },
  main: { padding: '30px', maxWidth: '1600px', margin: '0 auto' },
  splitLayout: { display: 'flex', gap: '30px', height: 'calc(100vh - 140px)' },
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' },

  // HEADER
  header: { backgroundColor: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 },
  title: { margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { fontSize: '0.85rem', color: '#64748b', fontWeight: 500 },
  backButton: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s' },
  patientBadge: { display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', backgroundColor: '#f8fafc', borderRadius: '40px', border: '1px solid #e2e8f0' },
  badgeLabel: { fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' },
  badgeValue: { fontWeight: 700, color: '#0ea5e9', fontSize: '0.95rem' },
  avatarSmall: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' },

  // DIRECTORY
  searchContainer: { marginBottom: '30px' },
  glassSearch: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  transparentInput: { border: 'none', outline: 'none', fontSize: '1.1rem', width: '100%', color: '#334155', background: 'transparent' },
  gridList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  patientCard: { padding: '24px', backgroundColor: 'white', borderRadius: '20px', cursor: 'pointer', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatarRow: { width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  cardName: { margin: 0, fontSize: '1.1rem', fontWeight: 600 },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' },
  cardFooter: { marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0ea5e9', fontWeight: 600, fontSize: '0.9rem' },

  // MODEL LEFT
  modelContainer: { flex: 2, backgroundColor: 'white', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  toggleContainer: { position: 'absolute', top: '24px', right: '24px', display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', zIndex: 20 },
  toggleActive: { padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'white', color: '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  toggleInactive: { padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', transition: 'color 0.2s' },
  toggleDivider: { width: '1px', backgroundColor: '#cbd5e1', margin: '4px 0' },
  canvasWrapper: { height: '95%', width: '100%', maxWidth: '750px', margin: '0 auto', position: 'relative' },
  viewLabel: { position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' },
  instructionBox: { position: 'absolute', bottom: '30px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#334155', fontWeight: 500 },

  // RIGHT PANEL (PREMIUM UI)
  panelContainer: { flex: 1.3, minWidth: '420px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -5px rgba(0,0,0,0.05)' },
  panelHeader: { padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' },
  panelTitle: { margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' },
  panelBreadcrumb: { fontSize: '0.85rem', color: '#64748b', marginTop: '4px', fontWeight: 500 },
  closeBtn: { background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'all 0.2s' },
  
  scrollArea: { padding: '24px 32px', overflowY: 'auto', flex: 1, backgroundColor: '#fcfcfc' },
  
  // NEW PREMIUM CARD
  exerciseCard: { 
    backgroundColor: 'white', 
    borderRadius: '16px', 
    marginBottom: '20px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  },
  cardTop: { padding: '24px' },
  tagsRow: { display: 'flex', gap: '8px' },
  tag: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  exName: { margin: '12px 0 6px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' },
  exDesc: { margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5' },
  
  cardBottom: { padding: '20px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' },
  
  // STAT BOX INPUTS
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' },
  statBox: { backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  statLabel: { fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' },
  statInput: { width: '100%', border: 'none', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', outline: 'none', backgroundColor: 'transparent' },

  // GRADIENT BUTTONS
  btnAssign: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', letterSpacing: '0.5px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)', transition: 'transform 0.1s' },
  btnAssigned: { width: '100%', padding: '14px', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '12px', cursor: 'default', fontWeight: '700', fontSize: '0.95rem' },

  // EMPTY STATE
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' },
  emptyIcon: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  emptyTitle: { fontSize: '1.2rem', fontWeight: 700, color: '#334155', margin: '0 0 8px 0' },
  emptyText: { fontSize: '0.95rem', color: '#94a3b8', maxWidth: '250px', lineHeight: '1.6' }
};

export default TherapistAssignmentManager;