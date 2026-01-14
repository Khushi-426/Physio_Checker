// frontend/src/components/Navbar.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  Settings,
  FileText,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navStyle = {
    height: "80px",
    background: "rgba(255, 255, 255, 0.9)",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    position: "sticky",
    top: 0,
    zIndex: 999,
    backdropFilter: "blur(20px)",
  };

  const logoStyle = {
    margin: 0,
    color: "#1a1a1a",
    fontSize: "1.6rem",
    fontWeight: "800",
    letterSpacing: "-1px",
    textDecoration: "none",
  };

  // --- 1. LOGGED IN VIEW ---
  if (user) {
    return (
      <nav style={navStyle}>
        {/* LEFT: Logo */}
        <Link to="/patient-dashboard" style={{ textDecoration: "none" }}>
          <h2 style={logoStyle}>
            PHYSIO<span style={{ color: "var(--primary-color)" }}>CHECK</span>
          </h2>
        </Link>

        {/* RIGHT: Profile & Dropdown */}
        <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
        >
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', 
                cursor: 'pointer', padding: '8px 12px', borderRadius: '12px',
                transition: 'background 0.2s'
            }}>
                <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "#888", fontWeight: "500" }}>
                        Hello,
                    </span>
                    <span style={{ fontWeight: "700", color: "#1a1a1a", fontSize: '1rem' }}>
                        {user.name}
                    </span>
                </div>
                <div style={{ 
                    width: '42px', height: '42px', borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #2C5D31 0%, #69B341 100%)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#fff', boxShadow: '0 4px 10px rgba(44, 93, 49, 0.2)'
                }}>
                    <User size={20} />
                </div>
                <ChevronDown size={16} color="#888" />
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "absolute",
                            top: "110%", // Slight gap
                            right: 0,
                            width: "260px",
                            background: "#ffffff",
                            border: "1px solid rgba(0,0,0,0.06)",
                            borderRadius: "16px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                            padding: "8px",
                            zIndex: 1000,
                            overflow: "hidden",
                        }}
                    >
                        {/* Option 1: My Profile */}
                        <Link to="/profile/overview" style={dropdownItemStyle}>
                            <div style={iconBoxStyle}><Settings size={18} color="#2C5D31" /></div>
                            <div>
                                <div style={{ fontWeight: '600', color: '#333' }}>My Profile</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>Edit weight, blood group...</div>
                            </div>
                        </Link>

                        {/* Option 2: Daily Report */}
                        <Link to="/analytics/accuracy" style={dropdownItemStyle}>
                            <div style={iconBoxStyle}><FileText size={18} color="#2C5D31" /></div>
                             <div>
                                <div style={{ fontWeight: '600', color: '#333' }}>Daily Report</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>Check your progress</div>
                            </div>
                        </Link>

                        <div style={{ height: '1px', background: '#f0f0f0', margin: '6px 0' }}></div>
                        
                        <button onClick={handleLogout} style={{ ...dropdownItemStyle, width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: '#d32f2f' }}>
                            <div style={{ ...iconBoxStyle, background: '#FFEBEE' }}><LogOut size={18} color="#d32f2f" /></div>
                            <span style={{ fontWeight: '600' }}>Logout</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </nav>
    );
  }

  // --- 2. LOGGED OUT VIEW ---
  return (
    <nav style={navStyle}>
      <div style={{ width: "120px", visibility: "hidden" }}>Placeholder</div>
      <Link to="/" style={{ textDecoration: "none", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        <h2 style={logoStyle}>PHYSIO<span style={{ color: "var(--primary-color)" }}>CHECK</span></h2>
      </Link>
      <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
        <Link to="/auth/login" style={{ textDecoration: "none", color: "#1a1a1a", fontWeight: "600" }}>Login</Link>
        <Link to="/auth/signup" style={{ textDecoration: "none", background: "#1a1a1a", color: "#fff", padding: "10px 24px", borderRadius: "30px", fontWeight: "600" }}>Sign Up</Link>
      </div>
    </nav>
  );
};

// Styles
const dropdownItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    textDecoration: "none",
    borderRadius: "10px",
    transition: "background 0.2s",
    cursor: "pointer",
};

const iconBoxStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#E8F5E9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

export default Navbar;