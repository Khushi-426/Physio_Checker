// frontend/src/Dashboard.jsx

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial, Environment, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, ArrowRight, CheckCircle, Stethoscope, UserCheck, Video, BarChart2, ShieldCheck } from 'lucide-react';

// --- Theme Constants (Rich Forest & Cream) ---
const THEME = {
    primary: '#2C5D31',    // Rich Leaf Green
    primaryLight: '#69B341', // Fresh Green
    dark: '#1A3C34',       // Deep Forest Green (Text/Headings)
    text: '#4A635D',       // Muted Green-Grey
    bg: '#FDFCFB',         // Creamish White
    cardBg: 'rgba(255, 255, 255, 0.9)',
    accentGradient: 'linear-gradient(135deg, #1A3C34 0%, #2C5D31 100%)',
    softGradient: 'radial-gradient(circle at 70% 30%, rgba(105, 179, 65, 0.08) 0%, transparent 60%)'
};

// --- 3D Hero Element ---
const HeroGraphic = () => {
  const mesh = useRef();
  useFrame((state) => {
    if(mesh.current) {
        mesh.current.rotation.x = state.clock.getElapsedTime() * 0.2;
        mesh.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group scale={1.2}>
        <Sphere args={[1, 64, 64]} scale={1.8}>
            <MeshDistortMaterial 
                color={THEME.primaryLight} 
                envMapIntensity={1} 
                clearcoat={1} 
                clearcoatRoughness={0} 
                metalness={0.1} 
                distort={0.3} 
                speed={2}
            />
        </Sphere>
        <Icosahedron args={[1, 2]} ref={mesh} scale={2.65}>
            <meshStandardMaterial color={THEME.dark} wireframe transparent opacity={0.15} />
        </Icosahedron>
      </group>
      <Environment preset="city" />
    </Float>
  );
};

// --- Components ---

const ProcessCard = ({ icon: Icon, step, title, desc, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay, duration: 0.6 }}
        style={{ 
            position: 'relative', flex: 1, minWidth: '280px',
            background: THEME.cardBg, backdropFilter: 'blur(10px)',
            border: '1px solid rgba(26, 60, 52, 0.05)', borderRadius: '24px',
            padding: '40px 30px', boxShadow: '0 20px 40px rgba(26, 60, 52, 0.04)',
            zIndex: 2, overflow: 'hidden'
        }}
    >
        {/* Step Number Background */}
        <div style={{
            position: 'absolute', top: -15, right: -5, fontSize: '7rem',
            fontWeight: '900', color: THEME.primary, opacity: 0.06, zIndex: 0
        }}>
            {step}
        </div>

        {/* Floating Icon */}
        <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: THEME.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '25px', boxShadow: '0 10px 20px rgba(26, 60, 52, 0.15)',
            position: 'relative', zIndex: 1
        }}>
            <Icon color="#fff" size={28} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: THEME.dark, marginBottom: '15px', position: 'relative', zIndex: 1 }}>{title}</h3>
        <p style={{ color: THEME.text, lineHeight: '1.6', fontSize: '1rem', position: 'relative', zIndex: 1 }}>{desc}</p>
    </motion.div>
);

const SectionTitle = ({ title, subtitle }) => (
    <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative', zIndex: 2 }}>
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            <h2 style={{ fontSize: '3rem', color: THEME.dark, fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.03em' }}>
                {title}
            </h2>
            <div style={{ width: '60px', height: '6px', background: THEME.accentGradient, margin: '0 auto 25px auto', borderRadius: '3px' }}></div>
            <p style={{ color: THEME.text, fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', opacity: 0.9 }}>{subtitle}</p>
        </motion.div>
    </div>
);

const Dashboard = () => {
  const navigate = useNavigate();

  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div style={{ width: '100%', background: THEME.bg, overflowX: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ 
          minHeight: '85vh', display: 'flex', alignItems: 'center', 
          padding: '0 8%', position: 'relative', overflow: 'hidden',
          background: THEME.softGradient
      }}>
        <div style={{ flex: 1.1, zIndex: 2 }}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '30px', 
                    background: '#fff', border: '1px solid #E0E0E0', 
                    color: THEME.primary, fontWeight: '600', marginBottom: '30px', 
                    fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}>
                    <Zap size={16} fill={THEME.primary} />
                    <span>Next-Gen AI Rehabilitation</span>
                </div>
                
                <h1 style={{ 
                    fontSize: '4.8rem', fontWeight: '800', color: THEME.dark, 
                    lineHeight: '1.1', marginBottom: '25px', letterSpacing: '-0.03em' 
                }}>
                    Recovery <br/>
                    <span style={{ 
                        background: 'linear-gradient(90deg, #69B341 0%, #1A3C34 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Reimagined.</span>
                </h1>
                
                <p style={{ fontSize: '1.25rem', color: THEME.text, maxWidth: '540px', marginBottom: '45px', lineHeight: '1.7' }}>
                    Connect with your therapist and perform guided exercises with real-time AI correction. Clinical precision, from home.
                </p>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button 
                        onClick={() => navigate('/auth/signup')}
                        style={{ 
                            padding: '16px 40px', borderRadius: '50px', border: 'none', 
                            background: THEME.dark, color: '#fff', fontSize: '1.05rem', fontWeight: '700',
                            cursor: 'pointer', boxShadow: '0 15px 35px rgba(26, 60, 52, 0.25)',
                            transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        Get Started <ArrowRight size={18} />
                    </button>

                    <button 
                        onClick={() => navigate('/auth/login')}
                        style={{ 
                            padding: '16px 40px', borderRadius: '50px', 
                            border: `1px solid #E0E0E0`, background: '#fff', 
                            color: THEME.dark, fontSize: '1.05rem', fontWeight: '700',
                            cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = THEME.dark;
                            e.target.style.background = '#F9FBF9';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = '#E0E0E0';
                            e.target.style.background = '#fff';
                        }}
                    >
                        Patient Login
                    </button>
                </div>
            </motion.div>
        </div>

        <div style={{ flex: 1, height: '650px', position: 'relative' }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <HeroGraphic />
            </Canvas>
            
            {/* Floating Stats Card */}
            <motion.div 
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
                style={{
                    position: 'absolute', bottom: '20%', right: '5%',
                    background: 'rgba(255, 255, 255, 0.95)', padding: '20px 25px', borderRadius: '20px',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', gap: '20px', zIndex: 10,
                    border: '1px solid rgba(255,255,255,0.6)'
                }}
            >
                <div style={{ 
                    background: '#E8F5E9', padding: '12px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Activity color={THEME.primary} size={24} />
                </div>
                <div>
                    <div style={{ fontWeight: '800', color: THEME.dark, fontSize: '1.1rem' }}>Active Monitoring</div>
                    <div style={{ fontSize: '0.85rem', color: THEME.primary, fontWeight: '600' }}>Live Pose Tracking</div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* 2. FEATURE SECTIONS */}
      <section style={{ padding: '60px 8%', overflow: 'hidden' }}>
        
        {/* Therapist Section (Image LEFT) */}
        <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeUp}
            style={{ 
                display: 'flex', alignItems: 'center', gap: '100px', 
                marginBottom: '140px', flexWrap: 'wrap' 
            }}
        >
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                    position: 'absolute', width: '90%', height: '90%', 
                    background: 'linear-gradient(135deg, rgba(26, 60, 52, 0.1) 0%, rgba(105, 179, 65, 0.05) 100%)',
                    borderRadius: '50px', transform: 'rotate(-6deg)', zIndex: 0
                }}></div>
                <img 
                    src="/doc.png" 
                    alt="Therapist Dashboard" 
                    style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px', objectFit: 'contain', dropShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                />
            </div>

            <div style={{ flex: 1, minWidth: '350px' }}>
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '20px', background: '#E8F5E9',
                    color: THEME.primary, fontWeight: '600', fontSize: '0.9rem', marginBottom: '25px'
                }}>
                    <Stethoscope size={18} /> For Professionals
                </div>
                <h2 style={{ fontSize: '2.8rem', fontWeight: '800', color: THEME.dark, lineHeight: '1.2', marginBottom: '25px' }}>
                    Effortless Protocol <br/> Management
                </h2>
                <p style={{ fontSize: '1.1rem', color: THEME.text, lineHeight: '1.7', marginBottom: '35px' }}>
                    Create personalized recovery plans in seconds. Our library of clinician-verified exercises allows you to build specific protocols, assign them to patients instantly, and monitor adherence remotely.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: THEME.dark, fontWeight: '600', fontSize: '1.05rem' }}>
                        <div style={{ padding: 6, background: '#E8F5E9', borderRadius: '50%' }}><CheckCircle size={20} color={THEME.primary} /></div>
                        Data-Driven Progress Tracking
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: THEME.dark, fontWeight: '600', fontSize: '1.05rem' }}>
                        <div style={{ padding: 6, background: '#E8F5E9', borderRadius: '50%' }}><CheckCircle size={20} color={THEME.primary} /></div>
                        Remote Intervention Capabilities
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Patient Section (Image RIGHT) */}
        <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeUp}
            style={{ 
                display: 'flex', alignItems: 'center', gap: '100px', 
                flexWrap: 'wrap-reverse' 
            }}
        >
            <div style={{ flex: 1, minWidth: '350px' }}>
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '20px', background: '#E3F2FD',
                    color: '#1565C0', fontWeight: '600', fontSize: '0.9rem', marginBottom: '25px'
                }}>
                    <UserCheck size={18} /> For Patients
                </div>
                <h2 style={{ fontSize: '2.8rem', fontWeight: '800', color: THEME.dark, lineHeight: '1.2', marginBottom: '25px' }}>
                    Your Personal AI <br/> Physio Coach
                </h2>
                <p style={{ fontSize: '1.1rem', color: THEME.text, lineHeight: '1.7', marginBottom: '35px' }}>
                    Recover confidently from the comfort of your home. Our AI analyzes 33 skeletal points on your body to ensure your form is perfect, reducing injury risk and maximizing recovery speed.
                </p>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                        onClick={() => navigate('/auth/signup')}
                        style={{ 
                            padding: '14px 35px', borderRadius: '30px', 
                            background: THEME.dark, color: '#fff', fontWeight: '600',
                            border: 'none', cursor: 'pointer', boxShadow: '0 8px 25px rgba(26, 60, 52, 0.2)',
                            fontSize: '1rem'
                        }}
                    >
                        Start Your Recovery
                    </button>
                    <button 
                         onClick={() => {}}
                         style={{ 
                            padding: '14px 35px', borderRadius: '30px', 
                            background: 'transparent', color: THEME.dark, fontWeight: '600',
                            border: `2px solid ${THEME.dark}`, cursor: 'pointer', fontSize: '1rem'
                        }}
                    >
                        View Demo
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                    position: 'absolute', width: '90%', height: '90%', 
                    background: 'linear-gradient(135deg, rgba(21, 101, 192, 0.1) 0%, rgba(21, 101, 192, 0.02) 100%)',
                    borderRadius: '50px', transform: 'rotate(6deg)', zIndex: 0
                }}></div>
                <img 
                    src="/exee.png" 
                    alt="Patient Exercising" 
                    style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px', objectFit: 'contain' }}
                />
            </div>
        </motion.div>

      </section>

      {/* 3. HOW IT WORKS (Rich Green Theme) */}
      <section style={{ 
          padding: '100px 8%', background: '#F5F8F5', position: 'relative',
          borderRadius: '40px', margin: '0 2%'
      }}>
         {/* Background Decoration */}
         <div style={{
             position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
             backgroundImage: 'radial-gradient(#A5D6A7 1px, transparent 1px)',
             backgroundSize: '30px 30px', opacity: 0.3, pointerEvents: 'none'
         }}></div>

         <SectionTitle 
            title="How It Works" 
            subtitle="Clinical-grade analysis powered by computer vision. Simple, secure, and effective."
        />
        
        <div style={{ 
            display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '30px', 
            maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap', position: 'relative'
        }}>
            {/* Connecting Line (Desktop Only) */}
            <div style={{
                position: 'absolute', top: '70px', left: '15%', right: '15%', height: '2px',
                borderTop: '2px dashed #A5D6A7', zIndex: 0, display: window.innerWidth > 768 ? 'block' : 'none'
            }}></div>

            <ProcessCard 
                icon={Video} 
                step="01" 
                title="Setup" 
                desc="Place your laptop or phone on a stable surface. Ensure your full body is visible in the frame."
                delay={0}
            />
            <ProcessCard 
                icon={BarChart2} 
                step="02" 
                title="Perform" 
                desc="Follow the on-screen guide. Our AI builds a 3D skeletal model of your body in real-time."
                delay={0.2}
            />
            <ProcessCard 
                icon={ShieldCheck} 
                step="03" 
                title="Feedback" 
                desc="Get instant audio-visual corrections. Your therapist receives a detailed report of your session."
                delay={0.4}
            />
        </div>
      </section>

      {/* 4. CTA BANNER */}
      <section style={{ padding: '100px 5%' }}>
        <div style={{ 
            background: THEME.dark, 
            borderRadius: '40px', padding: '80px 40px', textAlign: 'center', color: '#fff',
            maxWidth: '1200px', margin: '0 auto', boxShadow: '0 30px 60px rgba(26, 60, 52, 0.25)',
            position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(105, 179, 65, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-50%', right: '-20%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(105, 179, 65, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>

            <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '25px', position: 'relative', zIndex: 2 }}>
                Ready to Transform Your Rehab?
            </h2>
            <p style={{ fontSize: '1.2rem', color: '#E8F5E9', maxWidth: '600px', margin: '0 auto 50px auto', position: 'relative', lineHeight: '1.6', zIndex: 2, opacity: 0.9 }}>
                Join the platform that is bridging the gap between clinical therapy and home convenience.
            </p>
            
            <button 
                onClick={() => navigate('/auth/signup')}
                style={{ 
                    padding: '18px 50px', borderRadius: '50px', border: 'none', 
                    background: '#fff', color: THEME.dark, fontSize: '1.1rem', fontWeight: '700',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px',
                    position: 'relative', zIndex: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
                Create Free Account <ArrowRight size={20} />
            </button>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer style={{ padding: '60px 5%', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
            <Activity color={THEME.primary} size={32} />
            <h3 style={{ color: THEME.dark, fontWeight: '800', fontSize: '1.8rem' }}>
                PHYSIO<span style={{ color: THEME.primary }}>CHECK</span>
            </h3>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px', color: '#5A756E', fontSize: '1rem', fontWeight: '500' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => {}}>About Us</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => {}}>Privacy Policy</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => {}}>Terms of Service</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => {}}>Contact Support</span>
        </div>
        <div style={{ color: '#889995', fontSize: '0.9rem' }}>
            © 2024 PhysioCheck AI. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;