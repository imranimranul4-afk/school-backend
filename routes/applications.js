const router = require('express').Router();
const { Application } = require('../models/index');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const ADMIN = ['superadmin','admin'];

// ── GET /api/applications ────────────────────────
router.get('/', protect(ADMIN), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const apps = await Application.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: apps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/applications  (public — no auth) ────
router.post('/', async (req, res) => {
  try {
    const { guardianName, guardianPhone, studentName, applyClass } = req.body;
    if (!guardianName || !guardianPhone || !studentName || !applyClass)
      return res.status(400).json({ success: false, message: 'guardianName, guardianPhone, studentName, applyClass required.' });

    const app = await Application.create(req.body);
    res.status(201).json({ success: true, data: { appId: app.appId }, message: 'Application submitted successfully!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PUT /api/applications/:id/approve ────────────
// Approve → auto-create student account
router.put('/:id/approve', protect(ADMIN), async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (app.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Application already processed.' });

    // Auto-generate username & password
    const username = app.studentName.toLowerCase().replace(/\s+/g,'').slice(0,8) + Date.now().toString().slice(-4);
    const password = 'Mpcs@' + Date.now().toString().slice(-5);

    // Create student account
    const student = await Student.create({
      username, password,
      name:          app.studentName,
      class:         app.applyClass,
      section:       'A',
      gender:        app.gender,
      dob:           app.dob,
      bloodGroup:    app.bloodGroup,
      photo:         app.photo,
      guardianName:  app.guardianName,
      guardianNumber:app.guardianPhone,
      studentEmail:  app.studentEmail || app.guardianEmail,
    });

    // Mark application approved
    app.status = 'approved';
    await app.save();

    res.json({
      success: true,
      message: 'Application approved. Student account created.',
      credentials: { username, password, studentId: student.studentId },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PUT /api/applications/:id/reject ─────────────
router.put('/:id/reject', protect(ADMIN), async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    res.json({ success: true, message: 'Application rejected.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE /api/applications/:id ─────────────────
router.delete('/:id', protect(ADMIN), async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Application deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
