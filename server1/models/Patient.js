const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientID: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
  },
  triageData: {
    symptoms: { type: String, default: '' },
    history: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    languageUsed: {
      type: String,
      enum: ['en-US', 'hi-IN'],
      default: 'en-US',
    },
    aiAnalysis: { type: String, default: '' },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Patient', patientSchema);
