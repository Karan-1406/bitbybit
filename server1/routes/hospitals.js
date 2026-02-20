const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');

// Get all hospitals (optionally filter by district)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.district ? { district: req.query.district } : {};
    const hospitals = await Hospital.find(filter);
    res.json({ success: true, hospitals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single hospital
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    res.json({ success: true, hospital });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create hospital (for seeding)
router.post('/', async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    await hospital.save();
    res.status(201).json({ success: true, hospital });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update bed counts (admin panel)
router.put('/:id/beds', async (req, res) => {
  try {
    const { availableBeds, availableIcuBeds } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { availableBeds, availableIcuBeds },
      { new: true }
    );
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    res.json({ success: true, hospital });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
