import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-brand">
          <div className="header-logo">
            <span className="logo-icon">Q</span>
          </div>
          <div className="header-title">
            <h1>QNow</h1>
            <span className="header-subtitle">Patient Queue Optimization</span>
          </div>
        </Link>

        <nav className="header-nav">
          {isDashboard ? (
            <div className="header-badge">
              <span className="badge-dot"></span>
              Receptionist Dashboard
            </div>
          ) : (
            <Link to="/" className="btn-secondary header-link">
              ← Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
