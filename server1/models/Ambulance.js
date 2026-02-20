const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
  },
  driverName: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    default: '',
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'en-route', 'busy', 'offline'],
    default: 'available',
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
  },
  district: {
    type: String,
    default: 'Lucknow',
  },
}, { timestamps: true });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
