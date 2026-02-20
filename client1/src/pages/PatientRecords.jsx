import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Globe,
} from 'lucide-react';
import axios from 'axios';

const severityColors = {
  Critical: 'severity-critical',
  High: 'severity-high',
  Medium: 'severity-medium',
  Low: 'severity-low',
};

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients');
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientID?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity =
      filterSeverity === 'all' || p.triageData?.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  const severityCounts = {
    all: patients.length,
    Critical: patients.filter((p) => p.triageData?.severity === 'Critical').length,
    High: patients.filter((p) => p.triageData?.severity === 'High').length,
    Medium: patients.filter((p) => p.triageData?.severity === 'Medium').length,
    Low: patients.filter((p) => p.triageData?.severity === 'Low').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white"
        >
          Patient Records
        </motion.h1>
        <p className="text-sm text-gray-500 mt-1">
          Doctor View · {patients.length} patients registered
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or Patient ID..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(severityCounts).map(([sev, count]) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterSeverity === sev
                  ? sev === 'all'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : `${severityColors[sev]}`
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                }`}
            >
              {sev === 'all' ? 'All' : sev} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Patient list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No patients found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient, index) => (
            <motion.div
              key={patient.patientID}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card-hover overflow-hidden"
            >
              {/* Main row */}
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === patient.patientID ? null : patient.patientID
                  )
                }
                className="w-full p-5 flex items-center gap-4 text-left"
              >
                {/* Severity dot */}
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${patient.triageData?.severity === 'Critical'
                      ? 'bg-red-500'
                      : patient.triageData?.severity === 'High'
                        ? 'bg-orange-500'
                        : patient.triageData?.severity === 'Medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white truncate">{patient.name}</p>
                    <span className="text-xs text-primary-400 font-mono">
                      {patient.patientID}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(patient.timestamp).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {patient.triageData?.languageUsed === 'hi-IN' ? 'Hindi' : 'English'}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${severityColors[patient.triageData?.severity] || 'severity-medium'
                    }`}
                >
                  {patient.triageData?.severity || 'Medium'}
                </span>

                {expandedId === patient.patientID ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Expanded detail */}
              {expandedId === patient.patientID && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-white/5 p-5 bg-white/[0.02]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Age</p>
                      <p className="text-white">{patient.age}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> Symptoms
                      </p>
                      <p className="text-white text-sm">{patient.triageData?.symptoms || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Medical History</p>
                      <p className="text-white text-sm">{patient.triageData?.history || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">AI Analysis</p>
                      <p className="text-accent-300 text-sm">
                        {patient.triageData?.aiAnalysis || 'Not available'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
