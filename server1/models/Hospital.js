const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    default: 'Lucknow',
  },
  address: {
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
  totalBeds: {
    type: Number,
    required: true,
    default: 100,
  },
  availableBeds: {
    type: Number,
    required: true,
    default: 50,
  },
  icuBeds: {
    type: Number,
    default: 10,
  },
  availableIcuBeds: {
    type: Number,
    default: 5,
  },
  contact: {
    type: String,
    default: '',
  },
  specialties: [{
    type: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
