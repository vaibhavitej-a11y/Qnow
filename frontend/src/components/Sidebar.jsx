import React from 'react';
import './Sidebar.css';

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'register', icon: '📝', label: 'Register Patient' },
    { id: 'queue', icon: '👥', label: 'Live Queue' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'hospitals', icon: '🏥', label: 'Multi-Hospital' },
    { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">Q</div>
        <div className="brand-text">
          <h2>QNow</h2>
          <p>2.0 Management</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="status-dot"></div> Live Sync Active
      </div>
    </div>
  );
}

export default Sidebar;
