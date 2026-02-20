
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, Map, Users, Settings, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import PatientRecords from './pages/PatientRecords';
import AIAvatar from './pages/AIAvatar';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
        {/* Simple Sidebar */}
        <aside className="w-64 bg-black/20 border-r border-white/5 flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <Activity className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">SETU</span>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/map" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300">
              <Map className="w-5 h-5" />
              Map View
            </Link>
            <Link to="/records" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300">
              <Users className="w-5 h-5" />
              Patients
            </Link>
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300">
              <Settings className="w-5 h-5" />
              Admin
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <header className="h-16 border-b border-white/5 flex items-center px-6">
            <h1 className="text-lg font-medium">Healthcare Management System</h1>
          </header>

          <div className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/records" element={<PatientRecords />} />
              <Route path="/ai-avatar" element={<AIAvatar />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
