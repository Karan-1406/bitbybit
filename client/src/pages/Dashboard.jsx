import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bed,
  Ambulance,
  Building2,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';

function StatCard({ icon: Icon, label, value, subtitle, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card-hover p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

function HospitalCard({ hospital, index }) {
  const occupancy = Math.round(
    ((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100
  );
  const occupancyColor =
    occupancy > 85
      ? 'bg-red-500'
      : occupancy > 60
        ? 'bg-yellow-500'
        : 'bg-green-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{hospital.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{hospital.address}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${occupancy > 85
            ? 'severity-critical'
            : occupancy > 60
              ? 'severity-medium'
              : 'severity-low'
            }`}
        >
          {occupancy}% Full
        </span>
      </div>

      {/* Bed bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">General Beds</span>
            <span className="text-white font-medium">
              {hospital.availableBeds}/{hospital.totalBeds}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancy}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className={`h-full ${occupancyColor} rounded-full`}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">ICU Beds</span>
            <span className="text-white font-medium">
              {hospital.availableIcuBeds}/{hospital.icuBeds}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${hospital.icuBeds
                  ? ((hospital.icuBeds - hospital.availableIcuBeds) / hospital.icuBeds) * 100
                  : 0
                  }%`,
              }}
              transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
              className="h-full bg-accent-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1 mt-3">
        {hospital.specialties?.slice(0, 3).map((s) => (
          <span
            key={s}
            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400"
          >
            {s}
          </span>
        ))}
        {hospital.specialties?.length > 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
            +{hospital.specialties.length - 3}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hospRes, ambRes] = await Promise.all([
        axios.get('/api/hospitals'),
        axios.get('/api/ambulances'),
      ]);
      setHospitals(hospRes.data.hospitals || []);
      setAmbulances(ambRes.data.ambulances || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const availableAmbulances = ambulances.filter(
    (a) => a.status === 'available'
  ).length;
  const totalIcuAvailable = hospitals.reduce(
    (sum, h) => sum + (h.availableIcuBeds || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            District Dashboard
          </motion.h1>
          <p className="text-sm text-gray-500 mt-1">
            Bhagalpur · Real-time availability overview
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary flex items-center gap-2 text-sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Hospitals"
          value={hospitals.length}
          subtitle="Active in district"
          color="bg-primary-500/20 text-primary-400"
          delay={0}
        />
        <StatCard
          icon={Bed}
          label="Available Beds"
          value={availableBeds}
          subtitle={`of ${totalBeds} total`}
          color="bg-accent-500/20 text-accent-400"
          delay={0.1}
        />
        <StatCard
          icon={Ambulance}
          label="Ambulances Ready"
          value={availableAmbulances}
          subtitle={`of ${ambulances.length} total`}
          color="bg-yellow-500/20 text-yellow-400"
          delay={0.2}
        />
        <StatCard
          icon={HeartPulse}
          label="ICU Available"
          value={totalIcuAvailable}
          subtitle="Across all hospitals"
          color="bg-red-500/20 text-red-400"
          delay={0.3}
        />
      </div>

      {/* Hospital grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          Hospital Status
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-card p-5 animate-pulse h-48"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.map((h, i) => (
              <HospitalCard key={h._id} hospital={h} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Alert section */}
      {hospitals.some(
        (h) => ((h.totalBeds - h.availableBeds) / h.totalBeds) * 100 > 85
      ) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-4 border-orange-500/30 bg-orange-500/5 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
            <p className="text-sm text-orange-300">
              Some hospitals are at high occupancy (&gt;85%). Consider redirecting
              patients to facilities with more availability.
            </p>
          </motion.div>
        )}
    </div>
  );
}
