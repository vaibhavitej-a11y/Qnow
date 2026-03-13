import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PatientTracker from './pages/PatientTracker';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patient/:id" element={<PatientTracker />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
