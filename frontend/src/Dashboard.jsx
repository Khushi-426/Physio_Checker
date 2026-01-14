// frontend/src/Dashboard.jsx

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial, Environment, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, Zap, Eye, ArrowRight, Lock, CheckCircle } from 'lucide-react';

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
         {/* Core Sphere */}
        <Sphere args={[1, 64, 64]} scale={1.8}>
            <MeshDistortMaterial 
                color="#69B341" 
                envMapIntensity={1} 
                clearcoat={1} 
                clearcoatRoughness={0} 
                metalness={0.1} 
                distort={0.3} 
                speed={2}
            />
        </Sphere>
        {/* Wireframe Outer Shell */}
        <Icosahedron args={[1, 2]} ref={mesh} scale={2.6}>
            <meshStandardMaterial color="#2C5D31" wireframe transparent opacity={0.2} />
        </Icosahedron>
      </group>
      <Environment preset="city" />
    </Float>
  );
};

// --- Reusable Components ---
const SectionTitle = ({ title, subtitle }) => (
    <div style={{ textAlign: 'center', marginBottom: '70px' }}>
        <h2 style={{ fontSize: '2.8rem', color: '#1A3C34', fontWeight: '800', marginBottom: '15px', letterSpacing: '-0.02em' }}>{title}</h2>
        <p style={{ color: '#4A635D', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', opacity: 0.8 }}>{subtitle}</p>
    </div>
);

const BenefitCard = ({ icon: Icon, title, text }) => (
    <motion.div 
        whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ 
            background: '#ffffff', 
            padding: '40px 35px', 
            borderRadius: '24px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
        }}
    >
        <div style={{ 
            width: '64px', height: '64px', borderRadius: '18px', 
            background: 'linear-gradient(135deg, rgba(105, 179, 65, 0.15) 0%, rgba(105, 179, 65, 0.05) 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' 
        }}>
            <Icon size={30} color="#2C5D31" />
        </div>
        <h3 style={{ color: '#1A3C34', fontSize: '1.4rem', marginBottom: '12px', fontWeight: '700' }}>{title}</h3>
        <p style={{ color: '#5A756E', lineHeight: '1.7', fontSize: '1.05rem' }}>{text}</p>
    </motion.div>
);

const StepCard = ({ num, title, desc }) => (
    <div style={{ flex: 1, minWidth: '280px', textAlign: 'left', padding: '0 20px', position: 'relative' }}>
        <div style={{ 
            fontSize: '5rem', fontWeight: '900', color: '#F0F5EF', 
            position: 'absolute', top: '-40px', left: '10px', zIndex: 0 
        }}>
            {num}
        </div>
        <h3 style={{ position: 'relative', zIndex: 1, color: '#1A3C34', fontSize: '1.6rem', marginBottom: '15px', fontWeight: '800' }}>{title}</h3>
        <p style={{ position: 'relative', zIndex: 1, color: '#5A756E', lineHeight: '1.6', fontSize: '1.1rem' }}>{desc}</p>
    </div>
);

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ width: '100%', background: '#FDFCFB', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ 
          minHeight: '92vh', display: 'flex', alignItems: 'center', 
          padding: '0 8%', position: 'relative',
          background: 'radial-gradient(circle at 70% 30%, rgba(105, 179, 65, 0.05) 0%, transparent 60%)'
      }}>
        <div style={{ flex: 1.2, zIndex: 2 }}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '30px', 
                    background: '#fff', border: '1px solid #E0E0E0', 
                    color: '#2C5D31', fontWeight: '600', marginBottom: '30px', 
                    fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}>
                    <Zap size={16} fill="#2C5D31" />
                    <span>AI-Powered Rehabilitation v2.0</span>
                </div>
                
                <h1 style={{ 
                    fontSize: '5rem', fontWeight: '800', color: '#1A3C34', 
                    lineHeight: '1.05', marginBottom: '30px', letterSpacing: '-0.03em' 
                }}>
                    Recovery <br/>
                    <span style={{ 
                        background: 'linear-gradient(90deg, #69B341 0%, #2C5D31 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Reimagined.</span>
                </h1>
                
                <p style={{ fontSize: '1.35rem', color: '#5A756E', maxWidth: '580px', marginBottom: '50px', lineHeight: '1.6' }}>
                    Clinical-grade physiotherapy from the comfort of your home. 
                    Real-time AI guidance to ensure every move counts.
                </p>
                
                {/* --- NEW BUTTONS LAYOUT --- */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button 
                        onClick={() => navigate('/auth/signup')}
                        style={{ 
                            padding: '18px 45px', borderRadius: '40px', border: 'none', 
                            background: '#1A3C34', color: '#fff', fontSize: '1.1rem', fontWeight: '700',
                            cursor: 'pointer', boxShadow: '0 15px 35px rgba(26, 60, 52, 0.25)',
                            transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 20px 40px rgba(26, 60, 52, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 15px 35px rgba(26, 60, 52, 0.25)';
                        }}
                    >
                        Join Now <ArrowRight size={20} />
                    </button>

                    <button 
                        onClick={() => navigate('/auth/login')}
                        style={{ 
                            padding: '18px 45px', borderRadius: '40px', 
                            border: '1px solid #E0E0E0', background: '#fff', 
                            color: '#1A3C34', fontSize: '1.1rem', fontWeight: '700',
                            cursor: 'pointer', transition: 'all 0.3s ease',
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = '#1A3C34';
                            e.target.style.background = '#F9FBF9';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = '#E0E0E0';
                            e.target.style.background = '#fff';
                        }}
                    >
                        Login
                    </button>
                </div>
                
                <div style={{ marginTop: '40px', display: 'flex', gap: '30px', color: '#666', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} color="#69B341" /> No equipment needed
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} color="#69B341" /> Instant feedback
                    </div>
                </div>

            </motion.div>
        </div>

        {/* 3D Visual */}
        <div style={{ flex: 1, height: '700px', position: 'relative' }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <HeroGraphic />
            </Canvas>
            
            {/* Visual Flair Card */}
            <motion.div 
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
                style={{
                    position: 'absolute', bottom: '25%', right: '5%',
                    background: 'rgba(255, 255, 255, 0.95)', padding: '25px', borderRadius: '20px',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.08)', backdropFilter: 'blur(20px)',
                    display: 'flex', alignItems: 'center', gap: '20px', zIndex: 10,
                    border: '1px solid rgba(255,255,255,0.5)'
                }}
            >
                <div style={{ 
                    background: '#E8F5E9', padding: '15px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Activity color="#2C5D31" size={28} />
                </div>
                <div>
                    <div style={{ fontWeight: '800', color: '#1A3C34', fontSize: '1.2rem' }}>98% Accuracy</div>
                    <div style={{ fontSize: '0.9rem', color: '#69B341', fontWeight: '500' }}>Pose Estimation Active</div>
                </div>
            </motion.div>
        </div>
      </section>


      {/* 2. ABOUT & BENEFITS */}
      <section style={{ padding: '120px 8%' }}>
        <SectionTitle 
            title="Why PhysioCheck?" 
            subtitle="We bridge the gap between clinical therapy and home exercise using medical-grade AI analysis."
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', maxWidth: '1300px', margin: '0 auto' }}>
            <BenefitCard 
                icon={Eye} 
                title="Computer Vision" 
                text="Our AI analyzes body posture and joint angles in real-time, detecting micro-errors invisible to the naked eye."
            />
            <BenefitCard 
                icon={Shield} 
                title="Injury Prevention" 
                text="Get instant alerts when you over-extend or break form, significantly reducing the risk of strain or injury."
            />
            <BenefitCard 
                icon={Zap} 
                title="Instant Feedback" 
                text="No more guessing. Receive corrective guidance instantly on your screen as you perform each repetition."
            />
            <BenefitCard 
                icon={Lock} 
                title="Private & Secure" 
                text="Your data is encrypted. Video processing happens securely, ensuring your privacy is never compromised."
            />
        </div>
      </section>


      {/* 3. HOW IT WORKS */}
      <section style={{ padding: '120px 8%', background: '#F5F8F5', borderRadius: '40px', margin: '0 2%' }}>
         <SectionTitle 
            title="How It Works" 
            subtitle="Professional-grade analysis with zero hardware. Just you and your camera."
        />
        
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '60px', maxWidth: '1100px', margin: '0 auto', flexWrap: 'wrap' }}>
            <StepCard 
                num="01" 
                title="Set Up" 
                desc="Place your device on a stable surface. Ensure your full body is visible in the camera frame."
            />
            <StepCard 
                num="02" 
                title="Analyze" 
                desc="Our AI builds a 33-point skeletal wireframe of your body to track movement in 3D space."
            />
            <StepCard 
                num="03" 
                title="Correct" 
                desc="Follow visual guides. If your form deviates, the system alerts you to correct it immediately."
            />
        </div>
      </section>


      {/* 4. CTA BANNER */}
      <section style={{ padding: '100px 5%' }}>
        <div style={{ 
            background: '#1A3C34', 
            borderRadius: '40px', padding: '100px 40px', textAlign: 'center', color: '#fff',
            maxWidth: '1200px', margin: '0 auto', boxShadow: '0 30px 60px rgba(26, 60, 52, 0.25)',
            position: 'relative', overflow: 'hidden'
        }}>
            {/* Background Decoration */}
            <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(105, 179, 65, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>

            <h2 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '25px', position: 'relative' }}>Start Your Recovery Journey</h2>
            <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 50px auto', position: 'relative', lineHeight: '1.6' }}>
                Join thousands of users trusting PhysioCheck for safe, effective, and smart rehabilitation.
            </p>
            
            <button 
                onClick={() => navigate('/auth/signup')}
                style={{ 
                    padding: '20px 55px', borderRadius: '50px', border: 'none', 
                    background: '#fff', color: '#1A3C34', fontSize: '1.15rem', fontWeight: '800',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px',
                    position: 'relative', zIndex: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
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
        <h3 style={{ color: '#1A3C34', fontWeight: '800', fontSize: '1.8rem', marginBottom: '25px' }}>
            PHYSIO<span style={{ color: '#69B341' }}>CHECK</span>
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px', color: '#5A756E', fontSize: '1rem', fontWeight: '500' }}>
            <span style={{ cursor: 'pointer' }}>About Us</span>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ cursor: 'pointer' }}>Contact Support</span>
        </div>
        <div style={{ color: '#999', fontSize: '0.9rem' }}>
            © 2024 PhysioCheck AI. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;