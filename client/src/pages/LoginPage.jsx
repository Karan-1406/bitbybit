import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Stethoscope,
  Truck,
  Shield,
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Activity,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roles = [
  {
    id: 'patient',
    label: 'Patient',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/25',
    border: 'border-rose-500/30',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    desc: 'Book appointments & view records',
  },
  {
    id: 'driver',
    label: 'Ambulance Driver',
    icon: Truck,
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/25',
    border: 'border-amber-500/30',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    desc: 'Manage routes & availability',
  },
  {
    id: 'doctor',
    label: 'Doctor',
    icon: Stethoscope,
    color: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/25',
    border: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    desc: 'Manage patients & diagnoses',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/25',
    border: 'border-violet-500/30',
    textColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    desc: 'Control beds & system settings',
  },
];

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30"
          >
            <Activity className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            SETU
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Smart Emergency Triage Unit</p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedRole ? (
            /* ── ROLE SELECTION ── */
            <motion.div
              key="roles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-8">
                <h2 className="text-xl font-semibold text-white text-center mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-400 text-center text-sm mb-8">
                  Select your role to continue
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {roles.map((role, i) => (
                    <motion.button
                      key={role.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i, duration: 0.3 }}
                      onClick={() => setSelectedRole(role)}
                      className={`group relative p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
                        hover:${role.bgColor} hover:${role.border} transition-all duration-300
                        hover:shadow-lg ${role.glow} cursor-pointer text-left`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-3
                        shadow-lg ${role.glow} group-hover:scale-110 transition-transform duration-300`}>
                        <role.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-white text-sm">{role.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{role.desc}</p>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm">
                    New patient?{' '}
                    <button
                      onClick={onSwitchToRegister}
                      className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── LOGIN FORM ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-8">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to roles
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center
                    shadow-lg ${selectedRole.glow}`}>
                    <selectedRole.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {selectedRole.label} Login
                    </h2>
                    <p className="text-gray-500 text-sm">{selectedRole.desc}</p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="input-field pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="input-field pl-11"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${selectedRole.color}
                      hover:opacity-90 transition-all duration-300 shadow-lg ${selectedRole.glow}
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {selectedRole.id === 'patient' && (
                  <p className="text-gray-500 text-sm text-center mt-4">
                    Don't have an account?{' '}
                    <button
                      onClick={onSwitchToRegister}
                      className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                    >
                      Register
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
