const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');

// Get all ambulances (optionally filter by district)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.district ? { district: req.query.district } : {};
    const ambulances = await Ambulance.find(filter).populate('hospitalId', 'name');
    res.json({ success: true, ambulances });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update ambulance location (triggers Socket.io broadcast)
router.put('/:id/location', async (req, res) => {
  try {
    const { lat, lng, status } = req.body;
    const updateData = { lat, lng };
    if (status) updateData.status = status;

    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found' });
    }

    // Emit socket event for real-time tracking
    const io = req.app.get('io');
    if (io) {
      io.emit('ambulance-update', ambulance);
    }

    res.json({ success: true, ambulance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create ambulance (for seeding)
router.post('/', async (req, res) => {
  try {
    const ambulance = new Ambulance(req.body);
    await ambulance.save();
    res.status(201).json({ success: true, ambulance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
