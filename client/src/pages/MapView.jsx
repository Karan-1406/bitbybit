import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { Locate, Ambulance as AmbulanceIcon, Building2 } from 'lucide-react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const hospitalIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background: linear-gradient(135deg, #10b981, #059669); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-1 10h-4v4h-4v-4H6v-4h4V5h4v4h4v4z"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const createAmbulanceIcon = (status) => {
  const colors = {
    available: '#22c55e',
    'en-route': '#f59e0b',
    busy: '#ef4444',
    offline: '#6b7280',
  };
  const color = colors[status] || '#6b7280';
  return new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); animation: pulse 2s infinite;">
      <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Bhagalpur district bounds
const DISTRICT_BOUNDS = [
  [25.07, 86.62], // SW corner
  [25.50, 87.50], // NE corner
];
const CENTER = [25.2425, 86.9842];

function MapBoundsRestrictor() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(DISTRICT_BOUNDS);
    map.setMinZoom(11);
  }, [map]);
  return null;
}

export default function MapView() {
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospRes, ambRes] = await Promise.all([
          axios.get('/api/hospitals'),
          axios.get('/api/ambulances'),
        ]);
        setHospitals(hospRes.data.hospitals || []);
        setAmbulances(ambRes.data.ambulances || []);
      } catch (err) {
        console.error('Failed to fetch map data:', err);
      }
    };
    fetchData();

    // Socket.io for real-time ambulance updates
    const socket = io('http://localhost:5000');
    socket.on('ambulance-update', (data) => {
      setAmbulances((prev) =>
        prev.map((a) => (a._id === data._id ? { ...a, ...data } : a))
      );
    });

    return () => socket.disconnect();
  }, []);

  const filteredAmbulances =
    filter === 'all'
      ? ambulances
      : ambulances.filter((a) => a.status === filter);

  const statusCounts = {
    all: ambulances.length,
    available: ambulances.filter((a) => a.status === 'available').length,
    'en-route': ambulances.filter((a) => a.status === 'en-route').length,
    busy: ambulances.filter((a) => a.status === 'busy').length,
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
          Live Map View
        </motion.h1>
        <p className="text-sm text-gray-500 mt-1">
          Bhagalpur District · Real-time ambulance tracking
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${filter === status
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
              }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}{' '}
            <span className="ml-1 opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card overflow-hidden"
        style={{ height: '520px' }}
      >
        <MapContainer
          center={CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          maxBounds={DISTRICT_BOUNDS}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapBoundsRestrictor />

          {/* Hospital markers */}
          {hospitals.map((h) => (
            <Marker key={h._id} position={[h.lat, h.lng]} icon={hospitalIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-primary-400">{h.name}</p>
                  <p className="text-gray-300 mt-1">
                    Beds: {h.availableBeds}/{h.totalBeds}
                  </p>
                  <p className="text-gray-300">
                    ICU: {h.availableIcuBeds}/{h.icuBeds}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{h.contact}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Ambulance markers */}
          {filteredAmbulances.map((a) => (
            <Marker
              key={a._id}
              position={[a.lat, a.lng]}
              icon={createAmbulanceIcon(a.status)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-white">{a.vehicleNumber}</p>
                  <p className="text-gray-300">Driver: {a.driverName}</p>
                  <p className="text-gray-300">
                    Status:{' '}
                    <span
                      className={`font-medium ${a.status === 'available'
                        ? 'text-green-400'
                        : a.status === 'en-route'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                        }`}
                    >
                      {a.status}
                    </span>
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{a.contact}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </motion.div>

      {/* Legend */}
      <div className="glass-card p-4 flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 border-2 border-white" />
          <span className="text-sm text-gray-400">Hospital</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
          <span className="text-sm text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white" />
          <span className="text-sm text-gray-400">En Route</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
          <span className="text-sm text-gray-400">Busy</span>
        </div>
      </div>
    </div>
  );
}
