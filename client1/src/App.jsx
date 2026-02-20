import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MapPin,
  Bot,
  Users,
  Settings,
  Menu,
  X,
  Activity,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import AIAvatar from './pages/AIAvatar';
import PatientRecords from './pages/PatientRecords';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Full nav items with role permissions
const allNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['patient', 'driver', 'doctor', 'admin'] },
  { path: '/map', icon: MapPin, label: 'Map View', roles: ['patient', 'driver', 'doctor', 'admin'] },
  { path: '/avatar', icon: Bot, label: 'AI Avatar', roles: ['patient', 'doctor', 'admin'] },
  { path: '/patients', icon: Users, label: 'Patients', roles: ['doctor', 'admin'] },
  { path: '/admin', icon: Settings, label: 'Admin', roles: ['admin'] },
];

// Role display config
const roleConfig = {
  patient: { label: 'Patient', color: 'text-rose-400', bg: 'bg-rose-500/20' },
  driver: { label: 'Driver', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  doctor: { label: 'Doctor', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  admin: { label: 'Admin', color: 'text-violet-400', bg: 'bg-violet-500/20' },
};

// Protected route component
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading SETU...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) => item.roles.includes(user.role));
  const rc = roleConfig[user.role] || roleConfig.patient;

  return (
    <Router>
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-dark-950/80 backdrop-blur-2xl border-r border-white/5 
            flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">SETU</h1>
                <p className="text-xs text-gray-500">Smart Emergency Triage</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center border border-white/10">
                <User className="w-5 h-5 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${rc.bg} ${rc.color} font-medium`}>
                  {rc.label}
                </span>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-white/5 space-y-3">
            {/* District badge */}
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-gray-500">Active District</p>
              <p className="text-sm font-semibold text-primary-400">Bhagalpur</p>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-16 bg-dark-950/60 backdrop-blur-xl border-b border-white/5 flex items-center px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors mr-4"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-400">System Online</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:inline">{user.email}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${rc.bg} ${rc.color} font-medium`}>
                {rc.label}
              </span>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route
                path="/avatar"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                    <AIAvatar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <PatientRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
