import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Building2,
  Save,
  Minus,
  Plus,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import axios from 'axios';

function BedEditor({ label, value, max, onChange }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Minus className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 text-center">
          <input
            type="number"
            value={value}
            min={0}
            max={max}
            onChange={(e) =>
              onChange(Math.min(max, Math.max(0, parseInt(e.target.value) || 0)))
            }
            className="w-20 text-center text-xl font-bold text-white bg-transparent border-b-2 border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-gray-600 mt-1">of {max} total</p>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      {/* Visual bar */}
      <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${value / max < 0.2
              ? 'bg-red-500'
              : value / max < 0.4
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
          animate={{ width: `${max ? (value / max) * 100 : 0}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await axios.get('/api/hospitals');
      setHospitals(res.data.hospitals || []);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBedCount = (hospitalId, field, value) => {
    setChanges((prev) => ({
      ...prev,
      [hospitalId]: {
        ...prev[hospitalId],
        [field]: value,
      },
    }));
    // Reset saved state
    setSaved((prev) => ({ ...prev, [hospitalId]: false }));
  };

  const saveBeds = async (hospital) => {
    const hospitalChanges = changes[hospital._id];
    if (!hospitalChanges) return;

    setSaving((prev) => ({ ...prev, [hospital._id]: true }));
    try {
      await axios.put(`/api/hospitals/${hospital._id}/beds`, {
        availableBeds: hospitalChanges.availableBeds ?? hospital.availableBeds,
        availableIcuBeds: hospitalChanges.availableIcuBeds ?? hospital.availableIcuBeds,
      });

      // Update local state
      setHospitals((prev) =>
        prev.map((h) =>
          h._id === hospital._id
            ? {
              ...h,
              availableBeds: hospitalChanges.availableBeds ?? h.availableBeds,
              availableIcuBeds: hospitalChanges.availableIcuBeds ?? h.availableIcuBeds,
            }
            : h
        )
      );

      setSaved((prev) => ({ ...prev, [hospital._id]: true }));
      setChanges((prev) => {
        const next = { ...prev };
        delete next[hospital._id];
        return next;
      });

      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [hospital._id]: false }));
      }, 3000);
    } catch (err) {
      console.error('Failed to update beds:', err);
    } finally {
      setSaving((prev) => ({ ...prev, [hospital._id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white flex items-center gap-3"
        >
          <Settings className="w-7 h-7 text-primary-400" />
          Admin Panel
        </motion.h1>
        <p className="text-sm text-gray-500 mt-1">
          Update hospital bed availability
        </p>
      </div>

      {/* Hospital cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse h-56" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {hospitals.map((hospital, index) => {
            const hasChanges = !!changes[hospital._id];
            const isSaving = saving[hospital._id];
            const isSaved = saved[hospital._id];

            return (
              <motion.div
                key={hospital._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-6"
              >
                {/* Hospital header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary-500/20">
                      <Building2 className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {hospital.name}
                      </h3>
                      <p className="text-xs text-gray-500">{hospital.contact}</p>
                    </div>
                  </div>
                </div>

                {/* Bed editors */}
                <div className="grid grid-cols-2 gap-6 mb-5">
                  <BedEditor
                    label="General Beds Available"
                    value={
                      changes[hospital._id]?.availableBeds ?? hospital.availableBeds
                    }
                    max={hospital.totalBeds}
                    onChange={(v) =>
                      updateBedCount(hospital._id, 'availableBeds', v)
                    }
                  />
                  <BedEditor
                    label="ICU Beds Available"
                    value={
                      changes[hospital._id]?.availableIcuBeds ??
                      hospital.availableIcuBeds
                    }
                    max={hospital.icuBeds}
                    onChange={(v) =>
                      updateBedCount(hospital._id, 'availableIcuBeds', v)
                    }
                  />
                </div>

                {/* Save button */}
                <button
                  onClick={() => saveBeds(hospital)}
                  disabled={!hasChanges || isSaving}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${isSaved
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : hasChanges
                        ? 'btn-primary'
                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
