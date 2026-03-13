import React, { useState, useEffect } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";

import RegisterTab from "./pages/tabs/RegisterTab";
import QueueTab from "./pages/tabs/QueueTab";
import DashboardTab from "./pages/tabs/DashboardTab";
import MultiHospitalTab from "./pages/tabs/MultiHospitalTab";
import DoctorsTab from "./pages/tabs/DoctorsTab";

import { connectSocket, disconnectSocket } from "./services/api";

function App() {
  const [activeTab, setActiveTab] = useState("register");
  
  // App-wide state synced from WebSocket
  const [queue, setQueue] = useState([]);
  const [meta, setMeta] = useState({ stats: null, notifications: [] });
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect websocket and listen to all global events
    const socket = connectSocket({
      onQueue: (data) => setQueue(data),
      onMeta: (data) => setMeta(data),
      onDoctors: (data) => setDoctors(data),
      onHospitals: (data) => setHospitals(data)
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      disconnectSocket();
    };
  }, []);

  // Render the appropriate tab based on Sidebar selection
  const renderTab = () => {
    switch (activeTab) {
      case "register":
        return <RegisterTab />;
      case "queue":
        return <QueueTab queue={queue} />;
      case "dashboard":
        return <DashboardTab stats={meta.stats} notifications={meta.notifications} />;
      case "hospitals":
        return <MultiHospitalTab hospitals={hospitals} />;
      case "doctors":
        return <DoctorsTab doctors={doctors} />;
      default:
        return <RegisterTab />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {!isConnected && (
          <div className="connection-banner warning">
            ⚠️ Disconnected from server. Reconnecting...
          </div>
        )}
        {renderTab()}
      </main>
    </div>
  );
}

export default App;
