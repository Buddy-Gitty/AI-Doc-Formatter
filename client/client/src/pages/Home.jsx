import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Wand2, Download, Sun, Moon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import '../App.css';

const Home = ({ session, theme, toggleTheme }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-transparent pt-4 pb-4">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-3 text-gradient" to="/">
            <Wand2 className="text-primary" /> FormatAI
          </Link>
          <div className="d-flex align-items-center gap-3">
            <button 
              onClick={toggleTheme} 
              className="btn btn-link text-secondary p-2 theme-toggle-btn"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {session ? (
              <>
                <Link to="/formatter" className="btn btn-outline-theme px-4 rounded-pill">
                  Formatter
                </Link>
                <button onClick={handleLogout} className="btn btn-gradient px-4 rounded-pill">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn btn-outline-theme px-4 rounded-pill">
                  Login
                </Link>
                <Link to="/auth" className="btn btn-gradient px-4 rounded-pill">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mt-5 pt-5 text-center">
        <div className="row justify-content-center">
          <div className="col-lg-8 animate-fade-in">
            <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-4 border border-primary border-opacity-25 shadow-sm">
              ✨ Powered by Claude 3.5 Sonnet
            </div>
            <h1 className="display-3 fw-bold theme-text-primary mb-4 hero-title">
              Transform raw text into <br/>
              <span className="text-gradient">beautifully formatted</span> documents.
            </h1>
            <p className="lead theme-text-secondary mb-5 fs-4">
              Stop fighting with Word processors. Upload your raw notes, assignment, or report and let AI do the perfect formatting in seconds.
            </p>
            
            <div className="d-flex justify-content-center gap-4">
              {session ? (
                <Link to="/formatter" className="btn btn-gradient btn-lg px-5 py-3 rounded-pill shadow-lg d-flex align-items-center gap-2">
                  Format Your Documents <Wand2 size={20} />
                </Link>
              ) : (
                <Link to="/auth" className="btn btn-gradient btn-lg px-5 py-3 rounded-pill shadow-lg d-flex align-items-center gap-2">
                  Get Started Free <Wand2 size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mt-5 pt-5 mb-5 pb-5">
        <div className="row g-4 justify-content-center">
          <div className="col-md-4">
            <div className="feature-card glass-panel text-center p-5 h-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon-wrapper mb-4 mx-auto bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                <FileText size={40} />
              </div>
              <h3 className="theme-text-primary mb-3">Upload Anything</h3>
              <p className="theme-text-secondary">
                Drop in a .txt, .pdf, or .docx file with messy, unformatted text.
              </p>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="feature-card glass-panel text-center p-5 h-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon-wrapper mb-4 mx-auto bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                <Wand2 size={40} />
              </div>
              <h3 className="theme-text-primary mb-3">AI Formatting</h3>
              <p className="theme-text-secondary">
                Claude analyzes your content and structures it perfectly with headings, lists, and layout.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-card glass-panel text-center p-5 h-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon-wrapper mb-4 mx-auto bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                <Download size={40} />
              </div>
              <h3 className="theme-text-primary mb-3">Export to Word</h3>
              <p className="theme-text-secondary">
                Download a clean, professional .docx file ready to be shared or submitted.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="footer mt-auto py-5 glass-panel border-0 border-top border-secondary border-opacity-10">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4 text-center text-md-start mb-4 mb-md-0">
              <Link className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 fw-bold fs-4 text-gradient text-decoration-none" to="/">
                <Wand2 className="text-primary" /> FormatAI
              </Link>
              <p className="theme-text-secondary mt-2 small">
                The future of document formatting powered by AI.
              </p>
            </div>
            <div className="col-md-4 text-center mb-4 mb-md-0">
              <div className="d-flex justify-content-center gap-4">
                <Link to="/" className="theme-text-secondary text-decoration-none hover-light">Home</Link>
                <Link to="/formatter" className="theme-text-secondary text-decoration-none hover-light">Formatter</Link>
                <Link to="/auth" className="theme-text-secondary text-decoration-none hover-light">Login</Link>
              </div>
            </div>
            <div className="col-md-4 text-center text-md-end">
              <p className="theme-text-secondary mb-0 small">
                © {new Date().getFullYear()} FormatAI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
