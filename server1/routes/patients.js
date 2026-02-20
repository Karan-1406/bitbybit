const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { v4: uuidv4 } = require('uuid');

// Create a new patient record
router.post('/', async (req, res) => {
  try {
    const { name, age, symptoms, history, severity, languageUsed, aiAnalysis } = req.body;
    const patient = new Patient({
      patientID: `PT-${uuidv4().slice(0, 8).toUpperCase()}`,
      name,
      age,
      triageData: {
        symptoms,
        history,
        severity: severity || 'Medium',
        languageUsed: languageUsed || 'en-US',
        aiAnalysis: aiAnalysis || '',
      },
    });
    await patient.save();
    res.status(201).json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all patients (doctor view)
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ timestamp: -1 });
    res.json({ success: true, patients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single patient by patientID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientID: req.params.id });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    await Patient.findOneAndDelete({ patientID: req.params.id });
    res.json({ success: true, message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
