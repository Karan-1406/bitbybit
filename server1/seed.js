require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Ambulance = require('./models/Ambulance');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/careDB';

const hospitals = [
  {
    name: 'Jawaharlal Nehru Medical College & Hospital',
    district: 'Bhagalpur',
    address: 'Mayaganj, Bhagalpur, Bihar',
    lat: 25.2445,
    lng: 86.9718,
    totalBeds: 200,
    availableBeds: 52,
    icuBeds: 25,
    availableIcuBeds: 8,
    contact: '+91-641-2400733',
    specialties: ['General Surgery', 'Orthopedics', 'Cardiology', 'Neurology'],
  },
  {
    name: 'Mayaganj Hospital',
    district: 'Bhagalpur',
    address: 'Mayaganj Road, Bhagalpur',
    lat: 25.2510,
    lng: 86.9680,
    totalBeds: 150,
    availableBeds: 38,
    icuBeds: 20,
    availableIcuBeds: 6,
    contact: '+91-641-2401234',
    specialties: ['Pediatrics', 'Obstetrics', 'ENT', 'Ophthalmology'],
  },
  {
    name: 'Sadar Hospital Bhagalpur',
    district: 'Bhagalpur',
    address: 'Khalifabagh, Bhagalpur',
    lat: 25.2500,
    lng: 86.9850,
    totalBeds: 120,
    availableBeds: 42,
    icuBeds: 15,
    availableIcuBeds: 5,
    contact: '+91-641-2500456',
    specialties: ['Emergency', 'Trauma', 'General Medicine', 'Dermatology'],
  },
  {
    name: 'Apollo Clinic Bhagalpur',
    district: 'Bhagalpur',
    address: 'Adampur, Bhagalpur',
    lat: 25.2350,
    lng: 86.9920,
    totalBeds: 80,
    availableBeds: 28,
    icuBeds: 12,
    availableIcuBeds: 4,
    contact: '+91-641-2600789',
    specialties: ['Cardiology', 'Gastroenterology', 'Urology', 'Pulmonology'],
  },
  {
    name: 'Sneh Lata Hospital',
    district: 'Bhagalpur',
    address: 'Tilkamanjhi, Bhagalpur',
    lat: 25.2580,
    lng: 87.0010,
    totalBeds: 100,
    availableBeds: 35,
    icuBeds: 10,
    availableIcuBeds: 3,
    contact: '+91-641-2700321',
    specialties: ['Oncology', 'Nephrology', 'Endocrinology', 'General Surgery'],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Hospital.deleteMany({});
    await Ambulance.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert hospitals
    const insertedHospitals = await Hospital.insertMany(hospitals);
    console.log(`🏥 Inserted ${insertedHospitals.length} hospitals`);

    // Create ambulances linked to hospitals
    const ambulances = [
      { vehicleNumber: 'BR07-AMB-1001', driverName: 'Rajesh Kumar', contact: '+91-9876543210', lat: 25.2420, lng: 86.9750, status: 'available', hospitalId: insertedHospitals[0]._id, district: 'Bhagalpur' },
      { vehicleNumber: 'BR07-AMB-1002', driverName: 'Amit Singh', contact: '+91-9876543211', lat: 25.2480, lng: 86.9690, status: 'en-route', hospitalId: insertedHospitals[0]._id, district: 'Bhagalpur' },
      { vehicleNumber: 'BR07-AMB-2001', driverName: 'Suresh Yadav', contact: '+91-9876543212', lat: 25.2550, lng: 86.9640, status: 'available', hospitalId: insertedHospitals[1]._id, district: 'Bhagalpur' },
      { vehicleNumber: 'BR07-AMB-2002', driverName: 'Vikram Verma', contact: '+91-9876543213', lat: 25.2530, lng: 86.9880, status: 'busy', hospitalId: insertedHospitals[1]._id, district: 'Bhagalpur' },
      { vehicleNumber: 'BR07-AMB-3001', driverName: 'Manoj Tiwari', contact: '+91-9876543214', lat: 25.2460, lng: 86.9800, status: 'available', hospitalId: insertedHospitals[2]._id, district: 'Bhagalpur' },
      { vehicleNumber: 'BR07-AMB-4001', driverName: 'Deepak Sharma', contact: '+91-9876543215', lat: 25.2380, lng: 86.9950, status: 'available', hospitalId: insertedHospitals[3]._id, district: 'Bhagalpur' },
      { vehicleNumber: 'BR07-AMB-4002', driverName: 'Rahul Gupta', contact: '+91-9876543216', lat: 25.2400, lng: 86.9890, status: 'en-route', hospitalId: insertedHospitals[3]._id, district: 'Bhagalpur' },
      { vehicleNumber: 'BR07-AMB-5001', driverName: 'Arun Mishra', contact: '+91-9876543217', lat: 25.2600, lng: 86.9980, status: 'available', hospitalId: insertedHospitals[4]._id, district: 'Bhagalpur' },
    ];

    const insertedAmbulances = await Ambulance.insertMany(ambulances);
    console.log(`🚑 Inserted ${insertedAmbulances.length} ambulances`);

    // Create default users (one per role)
    const users = [
      {
        name: 'Admin User',
        email: 'admin@setu.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91-9000000001',
      },
      {
        name: 'Dr. Priya Sharma',
        email: 'doctor@setu.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+91-9000000002',
        assignedHospitalId: insertedHospitals[0]._id,
      },
      {
        name: 'Rajesh Kumar',
        email: 'driver@setu.com',
        password: 'driver123',
        role: 'driver',
        phone: '+91-9876543210',
        assignedHospitalId: insertedHospitals[0]._id,
      },
      {
        name: 'Rahul Verma',
        email: 'patient@setu.com',
        password: 'patient123',
        role: 'patient',
        phone: '+91-9000000004',
      },
    ];

    // Create users one by one so pre-save hook hashes passwords
    for (const userData of users) {
      await User.create(userData);
    }
    console.log(`👤 Inserted ${users.length} users`);

    console.log('\n✅ Seeding complete!');
    console.log('\n📋 Test credentials:');
    console.log('   Admin:   admin@setu.com / admin123');
    console.log('   Doctor:  doctor@setu.com / doctor123');
    console.log('   Driver:  driver@setu.com / driver123');
    console.log('   Patient: patient@setu.com / patient123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
