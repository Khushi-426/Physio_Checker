import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  LogOut,
  Settings,
  FileText,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // --- Styles ---
  const navContainerStyle = {
    height: "80px",
    background: "rgba(255, 255, 255, 0.95)",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 999,
    backdropFilter: "blur(20px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    width: "100%",
    boxSizing: "border-box"
  };

  const logoStyle = {
    margin: 0,
    color: "#1a1a1a",
    fontSize: "1.5rem",
    fontWeight: "800",
    letterSpacing: "-1px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  };

  const linkStyle = (active) => ({
    textDecoration: "none",
    color: active ? "#2C5D31" : "#555",
    fontWeight: active ? "700" : "500",
    fontSize: "0.95rem",
    padding: "8px 12px",
    borderRadius: "8px",
    background: active ? "rgba(44, 93, 49, 0.08)" : "transparent",
    transition: "all 0.2s"
  });

  // --- LOGGED IN NAV ---
  if (user) {
    return (
      <>
        <nav style={navContainerStyle}>
          {/* LEFT: Logo */}
          <Link to="/patient-dashboard" style={{ textDecoration: "none" }}>
            <h2 style={logoStyle}>
              PHYSIO<span style={{ color: "var(--primary-color, #2C5D31)" }}>CHECK</span>
            </h2>
          </Link>

          {/* RIGHT: Desktop Menu */}
          <div className="desktop-menu" style={{ display: "none", alignItems: "center", gap: "10px" }}>
            
            {/* Direct Navigation Links for Desktop */}
            <Link to="/patient-dashboard" style={linkStyle(isActive('/patient-dashboard'))}>
                Dashboard
            </Link>
            <Link to="/analytics/accuracy" style={linkStyle(isActive('/analytics/accuracy'))}>
                Reports
            </Link>
            
            <div style={{ width: '1px', height: '24px', background: '#eee', margin: '0 8px' }}></div>

            {/* Profile Dropdown */}
            <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
            >
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', 
                    cursor: 'pointer', padding: '6px 12px', borderRadius: '12px',
                    transition: 'background 0.2s',
                    background: isProfileOpen ? 'rgba(0,0,0,0.03)' : 'transparent'
                }}>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: "500", lineHeight: 1 }}>
                            Hello,
                        </span>
                        <span style={{ fontWeight: "700", color: "#1a1a1a", fontSize: '0.95rem', lineHeight: 1.2 }}>
                            {user.name}
                        </span>
                    </div>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #2C5D31 0%, #69B341 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#fff', boxShadow: '0 4px 10px rgba(44, 93, 49, 0.2)'
                    }}>
                        <User size={18} />
                    </div>
                    <ChevronDown size={16} color="#888" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isProfileOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: "absolute",
                                top: "100%", 
                                right: 0,
                                marginTop: "10px",
                                width: "260px",
                                background: "#ffffff",
                                border: "1px solid rgba(0,0,0,0.06)",
                                borderRadius: "16px",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                                padding: "8px",
                                zIndex: 1000,
                                overflow: "hidden",
                            }}
                        >
                            <Link to="/profile/overview" style={dropdownItemStyle}>
                                <div style={iconBoxStyle}><Settings size={18} color="#2C5D31" /></div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#333' }}>My Profile</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Account settings</div>
                                </div>
                            </Link>

                            <Link to="/analytics/accuracy" style={dropdownItemStyle}>
                                <div style={iconBoxStyle}><FileText size={18} color="#2C5D31" /></div>
                                 <div>
                                    <div style={{ fontWeight: '600', color: '#333' }}>Daily Report</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Check progress</div>
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
          </div>

          {/* MOBILE TOGGLE */}
          <div style={{ display: "flex", alignItems: "center" }} className="mobile-toggle">
             <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
             >
                {isMobileMenuOpen ? <X size={24} color="#333" /> : <Menu size={24} color="#333" />}
             </button>
          </div>
        </nav>

        {/* MOBILE DRAWER */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                    background: '#fff',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    position: 'fixed',
                    top: '80px',
                    left: 0,
                    right: 0,
                    zIndex: 998,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                     <div style={{ paddingBottom: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            background: '#2C5D31', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
                        }}>
                            <span style={{ fontWeight: 'bold' }}>{user.name.charAt(0)}</span>
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', color: '#333' }}>{user.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{user.role || 'Patient'}</div>
                        </div>
                     </div>

                     <Link to="/patient-dashboard" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle(isActive('/patient-dashboard'))}>
                        <LayoutDashboard size={18} /> Dashboard
                     </Link>
                     <Link to="/profile/overview" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle(isActive('/profile/overview'))}>
                        <Settings size={18} /> My Profile
                     </Link>
                     <Link to="/analytics/accuracy" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle(isActive('/analytics/accuracy'))}>
                        <FileText size={18} /> Reports
                     </Link>
                     
                     <button onClick={handleLogout} style={{ ...mobileLinkStyle(false), color: '#d32f2f', border: 'none', background: 'none', textAlign: 'left', paddingLeft: 0 }}>
                        <LogOut size={18} /> Sign Out
                     </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
           @media (min-width: 768px) {
             .mobile-toggle { display: none !important; }
             .desktop-menu { display: flex !important; }
           }
           @media (max-width: 767px) {
             .mobile-toggle { display: flex !important; }
             .desktop-menu { display: none !important; }
           }
        `}</style>
      </>
    );
  }

  // --- LOGGED OUT VIEW ---
  return (
    <nav style={navContainerStyle}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <h2 style={logoStyle}>PHYSIO<span style={{ color: "var(--primary-color, #2C5D31)" }}>CHECK</span></h2>
      </Link>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Link to="/auth/login" style={{ textDecoration: "none", color: "#1a1a1a", fontWeight: "600", fontSize: '0.95rem' }}>Login</Link>
        <Link to="/auth/signup" style={{ 
            textDecoration: "none", background: "#1a1a1a", color: "#fff", 
            padding: "10px 20px", borderRadius: "30px", fontWeight: "600", fontSize: '0.9rem',
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
            Get Started
        </Link>
      </div>
    </nav>
  );
};

const dropdownItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    textDecoration: "none",
    borderRadius: "10px",
    transition: "background 0.2s",
    cursor: "pointer",
    color: 'inherit'
};

const mobileLinkStyle = (active) => ({
    textDecoration: 'none',
    color: active ? '#2C5D31' : '#333',
    fontWeight: '600',
    fontSize: '1rem',
    padding: '10px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
});

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