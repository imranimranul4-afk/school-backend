const router  = require('express').Router();
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');

const ADMIN = ['superadmin','admin'];

// ── GET /api/teachers ────────────────────────────
router.get('/', protect(ADMIN), async (req, res) => {
  try {
    const { approved } = req.query;
    const filter = {};
    if (approved !== undefined) filter.approved = approved === 'true';
    const teachers = await Teacher.find(filter).select('-password').sort({ name: 1 });
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/teachers/me ─────────────────────────
router.get('/me', protect(['teacher']), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).select('-password');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, data: teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/teachers  (register — pending approval) ─
router.post('/', async (req, res) => {
  try {
    const { username, password, name, email, phone, bio } = req.body;
    if (!username || !password || !name || !email || !phone)
      return res.status(400).json({ success: false, message: 'username, password, name, email, phone required.' });

    const exists = await Teacher.findOne({ username });
    if (exists) return res.status(400).json({ success: false, message: 'Username already taken.' });

    const teacher = await Teacher.create({ username, password, name, email, phone, bio, approved: false });
    const plain = teacher.toObject(); delete plain.password;
    res.status(201).json({ success: true, data: plain, message: 'Registration submitted. Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/teachers/:id/approve ────────────────
router.put('/:id/approve', protect(ADMIN), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, { approved: true }, { new: true }).select('-password');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, data: teacher, message: 'Teacher approved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/teachers/:id/assignments ────────────
router.put('/:id/assignments', protect(ADMIN), async (req, res) => {
  try {
    const { assignments } = req.body; // [{class, section, subject}]
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, { assignments }, { new: true }).select('-password');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, data: teacher, message: 'Assignments updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/teachers/:id ────────────────────────
router.put('/:id', protect(['superadmin','admin','teacher']), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    // Teachers can only edit their own profile
    if (req.user.role === 'teacher' && req.user.id !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    Object.assign(teacher, rest);
    if (password) teacher.password = password;
    await teacher.save();

    const plain = teacher.toObject(); delete plain.password;
    res.json({ success: true, data: plain, message: 'Teacher updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/teachers/:id ─────────────────────
router.delete('/:id', protect(ADMIN), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, message: 'Teacher deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
